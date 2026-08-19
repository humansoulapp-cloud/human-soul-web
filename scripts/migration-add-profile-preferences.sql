-- Profile (redesign): the account details and preferences the screen edits
-- have nowhere to live yet. Run in the Supabase SQL editor.

alter table public.profiles
  add column if not exists alias text,
  add column if not exists timezone text,
  add column if not exists reminder_hour text,
  add column if not exists preferences jsonb not null default '{}'::jsonb;

-- People edit their own row from the Profile screen.
grant select, insert, update on public.profiles to authenticated;
