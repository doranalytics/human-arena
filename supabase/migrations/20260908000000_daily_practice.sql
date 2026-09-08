-- Habit is independent of scores and skill awards. No historical guessing of
-- local dates: tracking starts here; existing results and levels are unchanged.
alter table public.members add column practice_timezone text;

create table public.practice_days (
  member_id uuid not null references public.members(id) on delete cascade,
  local_date date not null,
  timezone text not null,
  attempt_id uuid references public.attempts(id) on delete set null,
  completed_at timestamptz not null default now(),
  primary key (member_id, local_date)
);
alter table public.practice_days enable row level security;
create policy "read own practice days" on public.practice_days for select
  using (member_id in (select id from public.members where auth_id = auth.uid()));
revoke all on public.practice_days from anon, authenticated;
grant select on public.practice_days to authenticated;
grant all on public.practice_days to service_role;

-- Runs inside the existing finish_arena_attempt transaction. A rollback cannot
-- leave a streak without a grade; concurrent completions count only one day.
create function public.record_practice_day() returns trigger
language plpgsql security definer set search_path = public as $$
declare zone text;
begin
  if not new.passed or new.attempt_id is null then return new; end if;
  select practice_timezone into zone from members where id = new.member_id for update;
  if zone is null then
    zone := 'UTC';
    update members set practice_timezone = zone where id = new.member_id;
  end if;
  insert into practice_days(member_id, local_date, timezone, attempt_id)
    values(new.member_id, (now() at time zone zone)::date, zone, new.attempt_id)
    on conflict (member_id, local_date) do nothing;
  return new;
end $$;
revoke all on function public.record_practice_day() from public, anon, authenticated;
create trigger result_records_practice after insert on public.results
  for each row execute function public.record_practice_day();
