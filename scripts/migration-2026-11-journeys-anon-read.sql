-- HumanSoul · Signed-out visitors can read published journeys again
--
-- Problem: an older rule on journeys or journey_days (made in the dashboard, not in this repo)
-- looks into public.profiles (for example to let admins see drafts) and applies to every role.
-- Since the privacy rules migration, signed-out visitors (anon) can't read profiles, so Postgres
-- stops the whole query with "permission denied for table profiles" and the landing library is empty.
--
-- Fix: any such rule now applies to signed-in people only. The *_public_read rules are untouched,
-- so anon still sees published journeys and nothing else.
--
-- Safe to run more than once. Run it in Supabase → SQL Editor.

do $$
declare
  p record;
begin
  for p in
    select tablename, policyname
    from pg_policies
    where schemaname = 'public'
      and tablename in ('journeys', 'journey_days')
      and policyname not in ('journeys_public_read', 'journey_days_public_read')
      and (coalesce(qual, '') ilike '%profiles%' or coalesce(with_check, '') ilike '%profiles%')
      and roles && array['public', 'anon']::name[]
  loop
    execute format('alter policy %I on public.%I to authenticated', p.policyname, p.tablename);
    raise notice 'Now for signed-in people only: % on %', p.policyname, p.tablename;
  end loop;
end $$;

-- CHECK: the rules left on these tables. Anything mentioning profiles should say {authenticated}.
select tablename, policyname, cmd, roles, qual
from pg_policies
where schemaname = 'public'
  and tablename in ('journeys', 'journey_days')
order by tablename, policyname;
