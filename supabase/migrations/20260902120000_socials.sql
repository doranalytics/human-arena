-- LinkedIn and X on the member row, shown on the leaderboard. Same shape as How to AI Games.
alter table members add column if not exists linkedin_url text;
alter table members add column if not exists x_url text;

create or replace function leaderboard(p_board text)
returns table (id uuid, display_name text, pseudonym text, avatar_url text, linkedin_url text, x_url text, points bigint, challenges bigint, rank bigint)
language sql stable as $$
  with pts as (
    select b.member_id,
           sum(b.points)::bigint as points,
           count(*) filter (where b.passed)::bigint as challenges
    from member_best b
    where p_board = 'all' or b.submitted_at >= date_trunc('week', now() at time zone 'utc')
    group by b.member_id
  )
  select m.id, m.display_name, m.pseudonym, m.avatar_url, m.linkedin_url, m.x_url, p.points, p.challenges,
         rank() over (order by p.points desc, p.challenges desc)::bigint as rank
  from pts p join members m on m.id = p.member_id
  where p.points > 0
  order by rank, m.created_at;
$$;
