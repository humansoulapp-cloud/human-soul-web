-- HumanSoul · Launch with Stripe (replaces the open beta)
--
-- PART A (safe to run now): the subscriptions table and founding_sales().
-- PART B (run on launch day, together with NEXT_PUBLIC_PAYWALL=on): opens sign-up without the beta gate.
--
-- - Anyone can create an account: the beta sign-up gate and the automatic beta seat are removed.
-- - Full access now comes from paying: the Stripe webhook writes one row per person in
--   public.subscriptions and sets profiles.plan ('founding' while active, 'free' otherwise).
-- - People who already joined the beta keep their access until their date (beta_invites untouched).
-- - founding_sales() counts everyone who has ever paid, to price the next buyer
--   (first 100 at $29.99, next 100 at $39.99; see lib/plans.ts).

-- ═══════════════ PART A ═══════════════
-- Works whether or not an older "subscriptions" table already exists: it only adds what's missing.
begin;

create table if not exists public.subscriptions (user_id uuid primary key references auth.users(id) on delete cascade);

alter table public.subscriptions add column if not exists user_id uuid;
alter table public.subscriptions add column if not exists stripe_customer_id text;
alter table public.subscriptions add column if not exists stripe_subscription_id text;
alter table public.subscriptions add column if not exists status text not null default 'incomplete';
alter table public.subscriptions add column if not exists price_cents int;
alter table public.subscriptions add column if not exists tier int;
alter table public.subscriptions add column if not exists current_period_end timestamptz;
alter table public.subscriptions add column if not exists cancel_at_period_end boolean not null default false;
alter table public.subscriptions add column if not exists first_paid_at timestamptz;
alter table public.subscriptions add column if not exists created_at timestamptz not null default now();
alter table public.subscriptions add column if not exists updated_at timestamptz not null default now();

-- One row per person, so the server can upsert by user_id.
create unique index if not exists subscriptions_user_id_key on public.subscriptions (user_id);
create unique index if not exists subscriptions_stripe_subscription_id_key on public.subscriptions (stripe_subscription_id);

alter table public.subscriptions enable row level security;

drop policy if exists subscriptions_own_read on public.subscriptions;
create policy subscriptions_own_read on public.subscriptions
  for select using (auth.uid()::text = user_id::text);

-- How many people have paid so far (prices the next buyer). Safe to call from the landing.
create or replace function public.founding_sales()
returns int
language sql
stable
security definer
set search_path = public
as $$
  select count(*)::int from public.subscriptions where first_paid_at is not null;
$$;

grant execute on function public.founding_sales() to anon, authenticated;

commit;

-- ═══════════════ PART B (launch day) ═══════════════
-- Sign-up is open, with no seat cap and no automatic beta access. Beta testers keep their dates.
-- begin;
-- drop trigger if exists beta_gate_signup on auth.users;
-- drop trigger if exists beta_claim_invite on auth.users;
-- commit;

-- Quick check:
-- select public.founding_sales();
-- select * from public.subscriptions order by created_at desc;
