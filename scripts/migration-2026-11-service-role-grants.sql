-- The server (service role) can't read or change reflections or journals:
-- "permission denied for table reflections". Earlier migrations granted these
-- tables to `authenticated` only, and this project doesn't grant new tables to
-- the API roles automatically.
--
-- What breaks without it:
--   · Admin dashboard and Users show zero entries and writers
--   · Delete account fails ("permission denied") and nothing is erased
--   · Daily reminder emails and the "journey finished" email can't check what was written
--
-- The service role bypasses Row Level Security, so this changes nothing for
-- people using the app: it only lets the server code that already expects it work.
--
-- Run once in Supabase → SQL Editor.

grant select, insert, update, delete on public.reflections to service_role;
grant select, insert, update, delete on public.journals to service_role;
grant usage, select on all sequences in schema public to service_role;

-- The journals table was also granted to anon (signed-out visitors) in an older
-- migration. Nobody signed out should touch it; RLS already blocks the rows, this
-- removes the grant too.
revoke all on public.journals from anon;
