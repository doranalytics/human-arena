-- Version every attempt; finish grading and save its result in one transaction.
alter table attempts add column if not exists contract jsonb;
alter table attempts add column if not exists version text;
alter table attempts add column if not exists grading_token uuid;
alter table attempts add column if not exists grading_started_at timestamptz;
alter table attempts add column if not exists result jsonb;

create table if not exists attempt_chats (
  attempt_id uuid not null references attempts(id) on delete cascade,
  chat_id text not null,
  title text not null,
  messages jsonb not null default '[]',
  contexts jsonb not null default '[]',
  pending boolean not null default false,
  primary key (attempt_id, chat_id)
);
alter table attempt_chats enable row level security;

create or replace function finish_arena_attempt(p_id uuid, p_member uuid, p_token uuid, p_result jsonb, p_grade jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare a attempts;
begin
  select * into a from attempts where id=p_id and member_id=p_member for update;
  if not found then raise exception 'Attempt not found'; end if;
  if a.result is not null then return a.result; end if;
  if a.grading_token is distinct from p_token then raise exception 'Grading claim changed'; end if;
  insert into results(member_id,attempt_id,slug,points,passed,seconds,hints_used,grade)
  values(p_member,p_id,a.slug,(p_result->>'points')::int,(p_result->>'passed')::boolean,
    (p_result->>'seconds')::int,(p_result->>'hintsUsed')::int,p_grade);
  update attempts set result=p_result,submitted_at=now(),grading_token=null,grading_started_at=null where id=p_id;
  return p_result;
end $$;
revoke all on function finish_arena_attempt(uuid,uuid,uuid,jsonb,jsonb) from public,anon,authenticated;
grant execute on function finish_arena_attempt(uuid,uuid,uuid,jsonb,jsonb) to service_role;

alter table members add column if not exists onboarding jsonb not null default '{}';
alter table members add column if not exists onboarded_at timestamptz;
alter table members add column if not exists is_paid boolean not null default false;
alter table members add column if not exists subscription_checked_at timestamptz;
