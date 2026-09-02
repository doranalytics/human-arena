-- LinkedIn and X on the member row, shown on the leaderboard. Same shape as How to AI Games.
alter table members add column if not exists linkedin_url text;
alter table members add column if not exists x_url text;

-- Postgres cannot change a function's return type in place.
drop function if exists leaderboard(text);

create function leaderboard(p_board text) returns table (
  id uuid, display_name text, pseudonym text, avatar_url text, linkedin_url text, x_url text, points bigint, challenges bigint, rank bigint
) language sql stable as $$
  with pts as (
    select * from member_points where p_board = 'all'
    union all
    select * from member_points_week where p_board = 'week'
  )
  select m.id, m.display_name, m.pseudonym, m.avatar_url, m.linkedin_url, m.x_url, p.points, p.challenges,
         rank() over (order by p.points desc, p.challenges desc) as rank
  from members m join pts p on p.member_id = m.id
  where p.points > 0
  order by rank;
$$;

grant execute on function leaderboard(text) to anon, authenticated;
