-- Incremental lesson state is private; the server evaluates and commits each step.
create table public.lesson_runs (
  member_id uuid not null references public.members(id) on delete cascade,
  lesson_id text not null check (lesson_id in ('shape-answers','better-context')),
  step integer not null default 0 check (step between 0 and 10),
  turns jsonb not null default '[]',
  revision integer not null default 0,
  feedback text not null default '',
  last_pass boolean not null default false,
  last_request uuid,
  lock_token uuid,
  locked_at timestamptz,
  completed_at timestamptz,
  primary key (member_id,lesson_id)
);
alter table public.lesson_runs enable row level security;
revoke all on public.lesson_runs from anon,authenticated;
grant all on public.lesson_runs to service_role;

create function public.commit_lesson_step(p_member uuid,p_lesson text,p_token uuid,p_step int,p_turns jsonb,p_feedback text,p_pass boolean,p_request uuid)
returns jsonb language plpgsql security definer set search_path=public as $$
declare r lesson_runs; a uuid; pts int; title text; badges jsonb;
begin
 select * into r from lesson_runs where member_id=p_member and lesson_id=p_lesson for update;
 if not found or r.lock_token is distinct from p_token then raise exception 'Lesson changed; reload'; end if;
 if p_step <> r.step + (case when p_pass then 1 else 0 end) or p_step > 10 then raise exception 'Invalid progression'; end if;
 update lesson_runs set step=p_step,turns=p_turns,feedback=p_feedback,last_pass=p_pass,last_request=p_request,
 revision=revision+1,lock_token=null,locked_at=null,completed_at=case when p_step=10 then now() else null end
 where member_id=p_member and lesson_id=p_lesson returning * into r;
 if p_step=10 then
  pts := case when p_lesson='shape-answers' then 60 else 100 end;
  title := case when p_lesson='shape-answers' then 'You can shape an AI answer.' else 'You can use context, questions, and criteria.' end;
  badges := case when p_lesson='shape-answers' then '["constraints","audience"]'::jsonb else '["interviewing","iteration"]'::jsonb end;
  insert into attempts(member_id,slug,submitted_at) values(p_member,'lesson-'||p_lesson,now()) returning id into a;
  insert into results(member_id,attempt_id,slug,points,passed,seconds,hints_used,grade)
   values(p_member,a,'lesson-'||p_lesson,pts,true,0,0,jsonb_build_object('maxPoints',pts,'speedMult',1,'badges',badges,'feedback',title,'checks','[]'::jsonb,'behaviors','[]'::jsonb));
 end if;
 return to_jsonb(r) - 'lock_token' - 'locked_at' - 'member_id';
end $$;
revoke all on function public.commit_lesson_step(uuid,text,uuid,int,jsonb,text,boolean,uuid) from public,anon,authenticated;
grant execute on function public.commit_lesson_step(uuid,text,uuid,int,jsonb,text,boolean,uuid) to service_role;

-- Only the server supplies a signed guest identity and a verified account identity.
create function public.merge_learning_guest(p_guest uuid,p_member uuid)
returns void language plpgsql security definer set search_path=public as $$
begin
 if p_guest=p_member then return; end if;
 perform id from members where id in (p_guest,p_member) order by id for update;
 if not exists(select 1 from members where id=p_guest and auth_id is null and email::text='guest-'||p_guest::text||'@guests.howto-ai.invalid') then return; end if;
 if not exists(select 1 from members m join auth.users u on u.id=m.auth_id where m.id=p_member and u.email_confirmed_at is not null) then raise exception 'Verified account required'; end if;
 insert into lesson_runs(member_id,lesson_id,step,turns,revision,feedback,last_pass,completed_at)
 select p_member,lesson_id,step,turns,revision,feedback,last_pass,completed_at from lesson_runs where member_id=p_guest
 on conflict(member_id,lesson_id) do update set step=excluded.step,turns=excluded.turns,revision=lesson_runs.revision+1,feedback=excluded.feedback,last_pass=excluded.last_pass,completed_at=excluded.completed_at
 where excluded.step>lesson_runs.step;
 update attempts set member_id=p_member where member_id=p_guest;
 update results set member_id=p_member where member_id=p_guest;
 insert into practice_days(member_id,local_date,timezone,attempt_id,completed_at)
 select p_member,local_date,timezone,attempt_id,completed_at from practice_days where member_id=p_guest on conflict do nothing;
 update members m set onboarding=g.onboarding,onboarded_at=coalesce(m.onboarded_at,g.onboarded_at),product=g.product,
 display_name=coalesce(m.display_name,g.display_name),practice_timezone=coalesce(m.practice_timezone,g.practice_timezone)
 from members g where m.id=p_member and g.id=p_guest and coalesce((m.onboarding->>'version')::int,0)<3;
 delete from members where id=p_guest;
end $$;
revoke all on function public.merge_learning_guest(uuid,uuid) from public,anon,authenticated;
grant execute on function public.merge_learning_guest(uuid,uuid) to service_role;

create table public.membership_reviews (
 member_id uuid primary key references public.members(id) on delete cascade,
 email citext not null,
 status text not null default 'pending' check (status in ('pending','verified','not_found')),
 requested_at timestamptz not null default now()
);
alter table public.membership_reviews enable row level security;
revoke all on public.membership_reviews from anon,authenticated;
grant all on public.membership_reviews to service_role;
alter table public.members add column promotion_opt_in boolean not null default false;
