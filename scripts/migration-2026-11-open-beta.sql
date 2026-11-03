-- HumanSoul · Open beta: anyone can sign up, first come first served, until the seats run out.
-- Run once in Supabase → SQL Editor, after migration-2026-11-beta-access.sql. One transaction. Safe to run again.
--
-- How it works
-- - With "Invite only" off, any email can create an account while seats are left
--   (beta_settings.max_users, 30 by default). Once they are taken, sign-up is refused.
-- - Every new account takes a seat: it gets a row in beta_invites (note "Open beta"),
--   joined now, with access_days of full access, exactly like an invited person.
-- - Existing invites still work and also count as seats once used.
-- - Sign-ups are counted one at a time, so two people can never take the last seat.

begin;

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
  if s.id is null then
    return new;
  end if;

  -- One sign-up at a time, so the seat count can't be overtaken.
  perform pg_advisory_xact_lock(724203);

  if s.invite_only and (new.email is null
     or not exists (select 1 from public.beta_invites i where lower(i.email) = lower(new.email))) then
    raise exception 'HumanSoul is invite-only right now';
  end if;

  select count(*) into used from public.beta_invites where joined_at is not null;
  if used >= s.max_users then
    raise exception 'The HumanSoul beta is full';
  end if;

  return new;
end;
$$;

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

  if not found and new.email is not null then
    insert into public.beta_invites (email, note, user_id, joined_at, access_until)
    values (lower(new.email), 'Open beta', new.id, now(), now() + make_interval(days => coalesce(days, 90)))
    on conflict do nothing;
  end if;
  return new;
end;
$$;

-- Open the doors.
update public.beta_settings set invite_only = false, updated_at = now() where id = 1;

commit;

-- Quick check (invite_only should be false):
-- select invite_only, max_users, access_days from public.beta_settings;
