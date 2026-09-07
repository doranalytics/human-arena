-- Plan is derived from server-maintained entitlements; clients cannot assign it.
alter table members add column account_tier text generated always as
  (case when is_paid then 'premium' else 'standard' end) stored;
alter table members add column challenge_guide_seen_at timestamptz;

-- A typed email is not proof of ownership. Claim imported profiles only after verification.
create or replace function claim_member() returns members
language plpgsql security definer set search_path=public as $$
declare v_email citext; v_member members;
begin
  select email into v_email from auth.users
    where id=auth.uid() and email_confirmed_at is not null and not coalesce(is_anonymous,false);
  if v_email is null then raise exception 'Verify your email before creating an account'; end if;
  insert into members(email,pseudonym,auth_id)
    values(v_email,make_pseudonym(v_email),auth.uid())
    on conflict(email) do update set auth_id=excluded.auth_id
    returning * into v_member;
  return v_member;
end $$;
revoke all on function claim_member() from public,anon;
grant execute on function claim_member() to authenticated;
