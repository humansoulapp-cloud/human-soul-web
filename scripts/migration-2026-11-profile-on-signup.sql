-- HumanSoul · Create the profile automatically when someone signs up,
-- and create the missing profiles of accounts that already exist.
-- Run once in Supabase → SQL Editor. Safe to run again.
--
-- Until now nothing created profiles: new people had no row in public.profiles,
-- so they didn't appear in Admin → Users and their onboarding choices and
-- time zone were not saved.
--
-- The trigger never blocks a sign-up: if the profile can't be created, the
-- account is still created and Postgres logs a warning.

begin;

create or replace function public.create_profile_for_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  begin
    insert into public.profiles (user_id, role, plan)
    select new.id, 'user', 'free'
    where not exists (select 1 from public.profiles p where p.user_id = new.id);
  exception when others then
    raise warning 'create_profile_for_new_user: % (%)', sqlerrm, sqlstate;
  end;
  return new;
end;
$$;

drop trigger if exists create_profile_for_new_user on auth.users;
create trigger create_profile_for_new_user
  after insert on auth.users
  for each row execute function public.create_profile_for_new_user();

-- Accounts that already exist without a profile.
insert into public.profiles (user_id, role, plan)
select u.id, 'user', 'free'
from auth.users u
where not exists (select 1 from public.profiles p where p.user_id = u.id);

commit;

-- Check (should return 0):
-- select count(*) from auth.users u left join public.profiles p on p.user_id = u.id where p.user_id is null;
