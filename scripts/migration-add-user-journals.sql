-- User Journals: allow users to create custom journals to house and organize their reflections
create table if not exists public.journals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Link reflections to custom journals if specified
alter table public.reflections
  add column if not exists journal_id uuid references public.journals(id) on delete set null;

-- Row Level Security
alter table public.journals enable row level security;

-- Drop existing policies first to ensure clean idempotent execution
drop policy if exists "Users can view their own journals" on public.journals;
create policy "Users can view their own journals"
  on public.journals for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert their own journals" on public.journals;
create policy "Users can insert their own journals"
  on public.journals for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update their own journals" on public.journals;
create policy "Users can update their own journals"
  on public.journals for update
  using (auth.uid() = user_id);

drop policy if exists "Users can delete their own journals" on public.journals;
create policy "Users can delete their own journals"
  on public.journals for delete
  using (auth.uid() = user_id);

-- Permissions
grant select, insert, update, delete on public.journals to authenticated;
grant select, insert, update, delete on public.journals to anon;
grant select, insert, update, delete on public.reflections to authenticated;
grant usage, select on all sequences in schema public to authenticated;
