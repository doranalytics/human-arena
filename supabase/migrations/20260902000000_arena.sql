-- Human Arena backend: members, scored results, leaderboard. Ported from ai-certified-next and slimmed.
-- Apply with: supabase db push   (or paste into the SQL editor)

create extension if not exists citext;
create extension if not exists pgcrypto;

create table members (
  id            uuid primary key default gen_random_uuid(),
  email         citext not null unique,
  auth_id       uuid unique references auth.users (id) on delete set null,
  pseudonym     text not null,
  display_name  text,
  avatar_url    text,
  product       text not null default 'claude' check (product in ('claude', 'chatgpt')),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index members_auth_id_idx on members (auth_id);

create or replace function set_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;
create trigger members_updated_at before update on members for each row execute function set_updated_at();

-- "Quiet Otter 42": deterministic per email so re-imports do not rename people.
create table pseudonym_adjectives (word text primary key);
create table pseudonym_nouns (word text primary key);
insert into pseudonym_adjectives (word) values
  ('Quiet'),('Brave'),('Curious'),('Swift'),('Calm'),('Bright'),('Bold'),('Clever'),('Steady'),('Lucky'),
  ('Wandering'),('Patient'),('Sharp'),('Gentle'),('Restless'),('Sunny'),('Humble'),('Nimble'),('Witty'),('Keen'),
  ('Early'),('Hidden'),('Silver'),('Amber'),('Cobalt'),('Velvet'),('Rapid'),('Mellow'),('Frank'),('Vivid');
insert into pseudonym_nouns (word) values
  ('Otter'),('Kettle'),('Falcon'),('Heron'),('Lantern'),('Badger'),('Comet'),('Harbor'),('Maple'),('Sparrow'),
  ('Fox'),('Beacon'),('Walrus'),('Pebble'),('Orchard'),('Tiger'),('Compass'),('Puffin'),('Meadow'),('Anchor'),
  ('Lynx'),('Ember'),('Willow'),('Marmot'),('Signal'),('Glacier'),('Dune'),('Cricket'),('Summit'),('Ferry');

create or replace function make_pseudonym(p_email text) returns text language sql stable as $$
  with h as (select ('x' || substr(md5(lower(p_email)), 1, 8))::bit(32)::int as n),
  a as (select word from pseudonym_adjectives order by word),
  b as (select word from pseudonym_nouns order by word)
  select (select word from a offset (abs((select n from h)) % (select count(*) from a)) limit 1)
      || ' ' ||
         (select word from b offset (abs((select n from h) / 97) % (select count(*) from b)) limit 1)
      || ' ' || (abs((select n from h)) % 90 + 10)::text;
$$;

-- One row per Start. submit stamps submitted_at; the server clock is the honest one.
create table attempts (
  id            uuid primary key default gen_random_uuid(),
  member_id     uuid not null references members (id) on delete cascade,
  slug          text not null,
  started_at    timestamptz not null default now(),
  submitted_at  timestamptz
);
create index attempts_member_slug_idx on attempts (member_id, slug, started_at desc);

-- One row per scored attempt. Best per challenge counts.
create table results (
  id            uuid primary key default gen_random_uuid(),
  member_id     uuid not null references members (id) on delete cascade,
  attempt_id    uuid references attempts (id) on delete set null,
  slug          text not null,
  points        integer not null check (points >= 0),
  passed        boolean not null,
  seconds       integer not null check (seconds >= 0),
  hints_used    integer not null default 0,
  grade         jsonb not null default '{}'::jsonb,   -- behaviors, checks, feedback, model, events
  submitted_at  timestamptz not null default now()
);
create index results_member_slug_idx on results (member_id, slug);

create view member_best as
  select distinct on (member_id, slug) member_id, slug, points, passed, seconds, hints_used, submitted_at
  from results
  order by member_id, slug, points desc, submitted_at asc;

create view member_points as
  select m.id as member_id,
         coalesce((select sum(points) from member_best b where b.member_id = m.id), 0) as points,
         (select count(*) from member_best b where b.member_id = m.id and b.passed) as challenges
  from members m;

create view member_points_week as
  select m.id as member_id,
         coalesce((select sum(points) from (
             select distinct on (slug) points from results r
             where r.member_id = m.id and r.submitted_at >= date_trunc('week', now() at time zone 'utc')
             order by slug, points desc) w), 0) as points,
         (select count(distinct slug) from results r
             where r.member_id = m.id and r.passed and r.submitted_at >= date_trunc('week', now() at time zone 'utc')) as challenges
  from members m;

create or replace function leaderboard(p_board text) returns table (
  id uuid, display_name text, pseudonym text, avatar_url text, points bigint, challenges bigint, rank bigint
) language sql stable as $$
  with pts as (
    select * from member_points where p_board = 'all'
    union all
    select * from member_points_week where p_board = 'week'
  )
  select m.id, m.display_name, m.pseudonym, m.avatar_url, p.points, p.challenges,
         rank() over (order by p.points desc, p.challenges desc) as rank
  from members m join pts p on p.member_id = m.id
  where p.points > 0
  order by rank;
$$;

-- Called after a magic-link login. Attaches the auth user to the member row with the same email.
create or replace function claim_member() returns members language plpgsql security definer as $$
declare
  v_email citext;
  v_member members;
begin
  select email into v_email from auth.users where id = auth.uid();
  if v_email is null then raise exception 'not signed in'; end if;
  insert into members (email, pseudonym, auth_id)
  values (v_email, make_pseudonym(v_email), auth.uid())
  on conflict (email) do update set auth_id = excluded.auth_id
  returning * into v_member;
  return v_member;
end $$;

alter table members enable row level security;
alter table attempts enable row level security;
alter table results enable row level security;
create policy "own member row" on members for select using (auth_id = auth.uid());
create policy "own results" on results for select using (member_id in (select id from members where auth_id = auth.uid()));
-- attempts and results are written server-side with the service key.

grant execute on function leaderboard(text) to anon, authenticated;
grant execute on function claim_member() to authenticated;
