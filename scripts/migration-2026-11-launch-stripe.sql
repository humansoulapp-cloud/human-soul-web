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
begin;

-- 1. Subscriptions (written only by the server with the service key).
create table if not exists public.subscriptions (
  user_id uuid primary key references auth.users(id) on delete cascade,
  stripe_customer_id text,
  stripe_subscription_id text unique,
  status text not null default 'incomplete',
  price_cents int,
  tier int,
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  first_paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.subscriptions enable row level security;

drop policy if exists subscriptions_own_read on public.subscriptions;
create policy subscriptions_own_read on public.subscriptions
  for select using (auth.uid() = user_id);

-- 2. How many people have paid so far (prices the next buyer). Safe to call from the landing.
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
