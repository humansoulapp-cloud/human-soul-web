-- Home (redesign) needs two columns that don't exist yet, plus the GRANT
-- that currently makes inserting into `reflections` fail with
-- "permission denied". Run in the Supabase SQL editor.

-- 1. Mood per entry — the chips in "How is today feeling?" and the badge
--    on each row of "Recent entries".
alter table public.reflections
  add column if not exists mood text;

-- 2. Subscription plan — drives the HumanSoul Plus upsell in the sidebar
--    and the Subscription screen. Stripe fills this in later.
alter table public.profiles
  add column if not exists plan text not null default 'free';

-- 3. Pending fix: `authenticated` could not insert its own reflections.
grant select, insert, update, delete on public.reflections to authenticated;
grant usage, select on all sequences in schema public to authenticated;
