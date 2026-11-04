-- HumanSoul · A beta seat is taken when the email is confirmed, not when the account is created
--
-- Why: with "Confirm email" on in Supabase, an account exists as soon as someone
-- fills in the form, even if they never open the confirmation link. Before this,
-- that account already took one of the 30 seats. Now the seat (and the 90 days of
-- access) starts when the email is confirmed.
--
-- Works the same with "Confirm email" off: Supabase then confirms the account at
-- once, so the seat is taken at sign-up, as before.
--
-- Run once in Supabase → SQL Editor, after migration-2026-11-open-beta.sql. Safe to run again.

begin;

create or replace function public.beta_claim_invite()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  days int;
begin
  -- Only once the email is confirmed, and only the first time it becomes confirmed.
  if new.email_confirmed_at is null then
    return new;
  end if;
  if tg_op = 'UPDATE' and old.email_confirmed_at is not null then
    return new;
  end if;

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

drop trigger if exists beta_claim_invite on auth.users;
create trigger beta_claim_invite
  after insert or update of email_confirmed_at on auth.users
  for each row execute function public.beta_claim_invite();

commit;

-- Check: the trigger now fires on INSERT and UPDATE.
-- select tgname, pg_get_triggerdef(oid) from pg_trigger where tgname = 'beta_claim_invite';
