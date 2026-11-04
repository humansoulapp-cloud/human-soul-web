-- HumanSoul · Privacy rules for the tables that hold people's writing
--
-- What this guarantees: a signed-in person can only read and change their own
-- profile, reflections and journals. Nobody signed out can read any of them.
-- Journeys stay readable by everyone (only published ones, see the DS v2 security
-- migration); only the server, with the service key, can write them.
--
-- Safe to run more than once. Run it in Supabase → SQL Editor.
-- Then run the CHECK at the bottom: it lists every rule on these tables, so any
-- older, looser rule shows up and can be removed.

begin;

-- ─────────────────────────────────────────────────────────────
-- 1. Row level security on, for every table with personal data
-- ─────────────────────────────────────────────────────────────
alter table public.profiles    enable row level security;
alter table public.reflections enable row level security;
alter table public.journals    enable row level security;
alter table public.journeys     enable row level security;
alter table public.journey_days enable row level security;

-- ─────────────────────────────────────────────────────────────
-- 2. Profiles: each person sees and edits only their own row.
--    Role and plan stay protected by the triggers in the DS v2 security migration.
--    The row itself is created by the sign-up trigger (profile-on-signup migration).
-- ─────────────────────────────────────────────────────────────
drop policy if exists hs_profiles_select_own on public.profiles;
create policy hs_profiles_select_own on public.profiles
  for select to authenticated using (user_id = auth.uid());

drop policy if exists hs_profiles_insert_own on public.profiles;
create policy hs_profiles_insert_own on public.profiles
  for insert to authenticated with check (user_id = auth.uid());

drop policy if exists hs_profiles_update_own on public.profiles;
create policy hs_profiles_update_own on public.profiles
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ─────────────────────────────────────────────────────────────
-- 3. Reflections: only their author, for reading, writing, editing and deleting.
-- ─────────────────────────────────────────────────────────────
drop policy if exists hs_reflections_select_own on public.reflections;
create policy hs_reflections_select_own on public.reflections
  for select to authenticated using (user_id = auth.uid());

drop policy if exists hs_reflections_insert_own on public.reflections;
create policy hs_reflections_insert_own on public.reflections
  for insert to authenticated with check (user_id = auth.uid());

drop policy if exists hs_reflections_update_own on public.reflections;
create policy hs_reflections_update_own on public.reflections
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists hs_reflections_delete_own on public.reflections;
create policy hs_reflections_delete_own on public.reflections
  for delete to authenticated using (user_id = auth.uid());

-- ─────────────────────────────────────────────────────────────
-- 4. Journals (the person's own named journals): same rule.
-- ─────────────────────────────────────────────────────────────
drop policy if exists hs_journals_select_own on public.journals;
create policy hs_journals_select_own on public.journals
  for select to authenticated using (user_id = auth.uid());

drop policy if exists hs_journals_insert_own on public.journals;
create policy hs_journals_insert_own on public.journals
  for insert to authenticated with check (user_id = auth.uid());

drop policy if exists hs_journals_update_own on public.journals;
create policy hs_journals_update_own on public.journals
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists hs_journals_delete_own on public.journals;
create policy hs_journals_delete_own on public.journals
  for delete to authenticated using (user_id = auth.uid());

-- ─────────────────────────────────────────────────────────────
-- 5. Nobody signed out touches personal tables, even by table grant.
-- ─────────────────────────────────────────────────────────────
revoke all on public.profiles, public.reflections, public.journals from anon;

commit;

-- ═════════════════════════════════════════════════════════════
-- CHECK: every rule on these tables. Expected:
--   · profiles, reflections, journals: only rules that compare user_id with auth.uid()
--     (the hs_* ones above, and maybe older own_* ones that say the same).
--   · journeys, journey_days: only the *_public_read rules.
-- Anything with qual = 'true' on profiles, reflections or journals, or a rule for
-- the "public"/"anon" role there, is too open: drop it with
--   drop policy "<policyname>" on public.<tablename>;
-- ═════════════════════════════════════════════════════════════
select tablename, policyname, cmd, roles, qual, with_check
from pg_policies
where schemaname = 'public'
  and tablename in ('profiles', 'reflections', 'journals', 'journeys', 'journey_days')
order by tablename, cmd, policyname;

-- And row level security must be on (rowsecurity = true) for all five:
select tablename, rowsecurity
from pg_tables
where schemaname = 'public'
  and tablename in ('profiles', 'reflections', 'journals', 'journeys', 'journey_days');
