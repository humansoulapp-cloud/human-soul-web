-- HumanSoul · Beta access: invite-only sign-up, at most 30 people, 90 days of full access each.
-- Run once in Supabase → SQL Editor. Everything is in one transaction: if anything fails, nothing is applied.
-- Safe to run again.
--
-- How it works
-- - An admin invites an email in Admin → Beta (stored in beta_invites).
-- - While beta_settings.invite_only is true, Supabase refuses to create an account for
--   any email that has no invite, or once max_users invites have been used. This check
--   runs inside the database, so it holds even if someone calls the Supabase API directly.
-- - When an invited person signs up, their invite is claimed: joined_at = now and
--   access_until = now + access_days. The app gives full access (as Plus) until then.
-- - On the day access ends nothing is deleted: the journal stays, Plus journeys lock after Day 1.
-- - For the public launch, switch "Invite only" off in Admin → Beta.

begin;

-- ─────────────────────────────────────────────────────────────
-- 1. Settings (a single row)
-- ─────────────────────────────────────────────────────────────
create table if not exists public.beta_settings (
  id          int primary key default 1 check (id = 1),
  invite_only boolean not null default true,
  max_users   int not null default 30 check (max_users >= 0),
  access_days int not null default 90 check (access_days > 0),
  updated_at  timestamptz not null default now()
);
insert into public.beta_settings (id) values (1) on conflict (id) do nothing;

-- Only the server (service key) reads and changes settings.
alter table public.beta_settings enable row level security;

-- ─────────────────────────────────────────────────────────────
-- 2. Invites
-- ─────────────────────────────────────────────────────────────
create table if not exists public.beta_invites (
  id           uuid primary key default gen_random_uuid(),
  email        text not null,
  note         text,
  invited_at   timestamptz not null default now(),
  user_id      uuid references auth.users (id) on delete set null,
  joined_at    timestamptz,
  access_until timestamptz
);
create unique index if not exists beta_invites_email_key on public.beta_invites (lower(email));
create index if not exists beta_invites_user_id_idx on public.beta_invites (user_id);

-- Each person can read their own invite (to see their access end date). Nothing else.
alter table public.beta_invites enable row level security;
drop policy if exists beta_invites_select_own on public.beta_invites;
create policy beta_invites_select_own on public.beta_invites
  for select to authenticated
  using (user_id = auth.uid());

-- ─────────────────────────────────────────────────────────────
-- 3. Waitlist (people who aren't invited yet)
-- ─────────────────────────────────────────────────────────────
create table if not exists public.waitlist (
  id         uuid primary key default gen_random_uuid(),
  email      text not null,
  created_at timestamptz not null default now()
);
create unique index if not exists waitlist_email_key on public.waitlist (lower(email));

-- Written and read only by the server (service key).
alter table public.waitlist enable row level security;

-- ─────────────────────────────────────────────────────────────
-- 4. Sign-up gate: no invite, no account (while invite_only is on)
-- ─────────────────────────────────────────────────────────────
create or replace function public.beta_gate_signup()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  s public.beta_settings;
  used int;
begin
  select * into s from public.beta_settings where id = 1;
  if s.id is null or not s.invite_only then
    return new;
  end if;

  if new.email is null
     or not exists (select 1 from public.beta_invites i where lower(i.email) = lower(new.email)) then
    raise exception 'HumanSoul is invite-only right now';
  end if;

  select count(*) into used from public.beta_invites where joined_at is not null;
  if used >= s.max_users then
    raise exception 'The HumanSoul beta is full';
  end if;

  return new;
end;
$$;

drop trigger if exists beta_gate_signup on auth.users;
create trigger beta_gate_signup
  before insert on auth.users
  for each row execute function public.beta_gate_signup();

-- ─────────────────────────────────────────────────────────────
-- 5. Claim the invite when the account is created
--    Only beta_invites is touched, never profiles, so the profile protections
--    from the security migration are not involved.
-- ─────────────────────────────────────────────────────────────
create or replace function public.beta_claim_invite()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  days int;
begin
  select access_days into days from public.beta_settings where id = 1;
  update public.beta_invites
     set user_id = new.id,
         joined_at = now(),
         access_until = now() + make_interval(days => coalesce(days, 90))
   where lower(email) = lower(new.email)
     and user_id is null;
  return new;
end;
$$;

drop trigger if exists beta_claim_invite on auth.users;
create trigger beta_claim_invite
  after insert on auth.users
  for each row execute function public.beta_claim_invite();

-- ─────────────────────────────────────────────────────────────
-- 6. API access. Some projects don't grant new tables to the API roles
--    automatically; without this the server can't read them. RLS above still
--    decides which rows each person sees.
-- ─────────────────────────────────────────────────────────────
grant select, insert, update, delete on public.beta_settings, public.beta_invites, public.waitlist to service_role;
grant select on public.beta_invites to authenticated;

commit;

-- Make the API notice the new tables right away.
notify pgrst, 'reload schema';

-- Quick check after running (should return one row with invite_only = true):
-- select * from public.beta_settings;
