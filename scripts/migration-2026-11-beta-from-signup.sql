-- HumanSoul · The 90 days of beta count from the day the account was created
--
-- The seat is still only taken once the email is confirmed (so unconfirmed
-- sign-ups don't use one of the 30), but the first day of the beta is the day the
-- account was created and the last day is 90 days later.
-- Also corrects people who already joined: their window now starts on their
-- account's creation date, keeping any extra days an admin gave them.
--
-- Run once in Supabase → SQL Editor. Safe to run again.

begin;

create or replace function public.beta_claim_invite()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  days int;
  started timestamptz;
begin
  if new.email_confirmed_at is null then
    return new;
  end if;
  if tg_op = 'UPDATE' and old.email_confirmed_at is not null then
    return new;
  end if;

  select access_days into days from public.beta_settings where id = 1;
  started := coalesce(new.created_at, now());

  update public.beta_invites
     set user_id = new.id,
         joined_at = started,
         access_until = started + make_interval(days => coalesce(days, 90))
   where lower(email) = lower(new.email)
     and user_id is null;
  if not found and new.email is not null then
    insert into public.beta_invites (email, note, user_id, joined_at, access_until)
    values (lower(new.email), 'Open beta', new.id, started, started + make_interval(days => coalesce(days, 90)))
    on conflict do nothing;
  end if;
  return new;
end;
$$;

drop trigger if exists beta_claim_invite on auth.users;
create trigger beta_claim_invite
  after insert or update of email_confirmed_at on auth.users
  for each row execute function public.beta_claim_invite();

-- People already in the beta: start on the day their account was created,
-- keeping the same length (90 days, or more if an admin extended it).
update public.beta_invites i
   set access_until = u.created_at + (i.access_until - i.joined_at),
       joined_at = u.created_at
  from auth.users u
 where u.id = i.user_id
   and i.joined_at is not null
   and i.access_until is not null
   and i.joined_at <> u.created_at;

commit;

-- Check: each person's first and last day.
select i.email, i.joined_at::date as first_day, i.access_until::date as last_day
from public.beta_invites i
where i.user_id is not null
order by i.joined_at;
