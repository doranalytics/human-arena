-- Independent membership sources: Circle access must survive a Substack-list miss.
alter table members add column substack_paid boolean not null default false;
update members set substack_paid = is_paid;

create table circle_memberships (
  email citext primary key,
  circle_id bigint,
  community_id bigint not null,
  active boolean not null,
  checked_at timestamptz not null,
  sync_id uuid
);
create unique index circle_memberships_circle_id on circle_memberships(community_id,circle_id) where circle_id is not null;
alter table circle_memberships enable row level security;

create table circle_sync_runs (
  id uuid primary key default gen_random_uuid(),
  community_id bigint not null,
  status text not null check (status in ('running','complete','failed')),
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  records integer,
  active_members integer,
  error text
);
alter table circle_sync_runs enable row level security;

-- Source refresh happens under the member row lock; unavailable sources keep their last value.
create or replace function refresh_member_access(p_member uuid, p_substack_paid boolean default null)
returns jsonb language plpgsql security definer set search_path=public as $$
declare m members; c circle_memberships; paid boolean;
begin
  select * into m from members where id=p_member for update;
  if not found then raise exception 'Member not found'; end if;
  select * into c from circle_memberships where email=m.email;
  paid := coalesce(p_substack_paid,m.substack_paid) or coalesce(c.active,false);
  update members set substack_paid=coalesce(p_substack_paid,m.substack_paid), is_paid=paid,
    subscription_checked_at=case when p_substack_paid is not null then now() else subscription_checked_at end where id=m.id;
  return jsonb_build_object('paid',paid,'substack',coalesce(p_substack_paid,m.substack_paid),'circle',coalesce(c.active,false),
    'circleCheckedAt',c.checked_at,'substackCheckedAt',case when p_substack_paid is not null then now() else m.subscription_checked_at end);
end $$;
revoke all on function refresh_member_access(uuid,boolean) from public,anon,authenticated;
grant execute on function refresh_member_access(uuid,boolean) to service_role;

-- Apply only a complete validated snapshot, atomically. Never create auth users or send emails.
create or replace function apply_circle_snapshot(p_run uuid, p_community bigint, p_members jsonb)
returns jsonb language plpgsql security definer set search_path=public as $$
declare run circle_sync_runs; active_count int; inserted_count int;
begin
  perform pg_advisory_xact_lock(hashtext('howto-ai-circle-import'));
  select * into run from circle_sync_runs where id=p_run for update;
  if run.id is null or run.status <> 'running' or run.community_id <> p_community then raise exception 'Invalid sync run'; end if;
  if exists(select 1 from circle_sync_runs where status='complete' and started_at>run.started_at) then raise exception 'A newer sync already completed'; end if;
  if exists(select 1 from circle_sync_runs where status='complete' and community_id<>p_community) then raise exception 'Community mismatch'; end if;
  if jsonb_typeof(p_members) is distinct from 'array' then raise exception 'Expected member array'; end if;
  if exists(select 1 from jsonb_to_recordset(p_members) as x(id bigint,community_id bigint,email text,active boolean)
    where x.id is null or x.community_id is distinct from p_community or x.email is null or x.active is null) then raise exception 'Invalid member record'; end if;

  -- Remove obsolete IDs before email changes are inserted; old email access is revoked below.
  update circle_memberships c set circle_id=null where c.community_id=p_community and c.checked_at<=run.started_at
    and exists(select 1 from jsonb_to_recordset(p_members) as x(id bigint,email text) where x.id=c.circle_id and lower(x.email)<>c.email);
  insert into circle_memberships(email,circle_id,community_id,active,checked_at,sync_id)
    select lower(x.email),x.id,p_community,x.active,run.started_at,p_run
    from jsonb_to_recordset(p_members) as x(id bigint,email text,active boolean)
    on conflict(email) do update set circle_id=excluded.circle_id,community_id=excluded.community_id,
      active=excluded.active,checked_at=excluded.checked_at,sync_id=p_run
      where circle_memberships.checked_at<=run.started_at;
  update circle_memberships set active=false,checked_at=run.started_at
    where community_id=p_community and sync_id is distinct from p_run and checked_at<=run.started_at;

  insert into members(email,pseudonym,display_name,avatar_url,is_paid)
    select lower(x.email),make_pseudonym(lower(x.email)),nullif(left(x.name,80),''),
      case when x.avatar_url like 'https://%' then left(x.avatar_url,500) end,true
    from jsonb_to_recordset(p_members) as x(email text,name text,avatar_url text,active boolean)
    where x.active
    on conflict(email) do nothing;
  get diagnostics inserted_count = row_count;
  update members m set is_paid=m.substack_paid or c.active from circle_memberships c where m.email=c.email and c.community_id=p_community and m.is_paid is distinct from (m.substack_paid or c.active);
  select count(*) into active_count from circle_memberships where community_id=p_community and active;
  update circle_sync_runs set status='complete',finished_at=now(),records=jsonb_array_length(p_members),active_members=active_count where id=p_run;
  return jsonb_build_object('records',jsonb_array_length(p_members),'activeMembers',active_count,'createdProfiles',inserted_count);
end $$;
revoke all on function apply_circle_snapshot(uuid,bigint,jsonb) from public,anon,authenticated;
grant execute on function apply_circle_snapshot(uuid,bigint,jsonb) to service_role;

create or replace function record_circle_lookup(p_community bigint,p_email text,p_record jsonb)
returns void language plpgsql security definer set search_path=public as $$
declare v_email citext := lower(trim(p_email)); v_id bigint; v_active boolean := false;
begin
  perform pg_advisory_xact_lock(hashtext('howto-ai-circle-import'));
  if exists(select 1 from circle_sync_runs where status='complete' and community_id<>p_community) then raise exception 'Community mismatch'; end if;
  if p_record is not null then
    if (p_record->>'community_id')::bigint is distinct from p_community or lower(p_record->>'email') is distinct from v_email::text
      or p_record->>'active' is null or p_record->>'id' is null then raise exception 'Invalid Circle lookup'; end if;
    v_id := (p_record->>'id')::bigint; v_active := (p_record->>'active')::boolean;
    -- A verified email change revokes the old email's Circle entitlement.
    update circle_memberships set active=false,circle_id=null,checked_at=now() where community_id=p_community and circle_id=v_id and email<>v_email;
  end if;
  insert into circle_memberships(email,circle_id,community_id,active,checked_at)
    values(v_email,v_id,p_community,v_active,now())
    on conflict(email) do update set circle_id=excluded.circle_id,community_id=excluded.community_id,active=excluded.active,checked_at=excluded.checked_at;
  update members m set is_paid=m.substack_paid or c.active from circle_memberships c where m.email=c.email and c.community_id=p_community and m.is_paid is distinct from (m.substack_paid or c.active);
end $$;
revoke all on function record_circle_lookup(bigint,text,jsonb) from public,anon,authenticated;
grant execute on function record_circle_lookup(bigint,text,jsonb) to service_role;
