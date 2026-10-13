-- HumanSoul · Migración para el rediseño (Home, Journal, Journeys) y arreglos de seguridad
-- Ejecutar en Supabase → SQL Editor. Cada bloque es independiente; se puede ejecutar todo de una vez.
-- Todo va dentro de una transacción: si algo falla, no se aplica nada.

begin;

-- ─────────────────────────────────────────────────────────────
-- 1. SEGURIDAD (urgente): un usuario no puede cambiar su propio rol ni su plan
--    Hoy la regla own_update de profiles deja a cualquier usuario editar su fila entera,
--    incluido role = 'admin' (acceso al admin y a editar journeys) y plan (premium gratis).
--    El panel de admin cambia roles con la service key, que sigue funcionando.
-- ─────────────────────────────────────────────────────────────
create or replace function public.protect_profile_privileges()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if coalesce(auth.role(), '') in ('authenticated', 'anon') then
    if new.role is distinct from old.role then
      raise exception 'Not allowed to change role';
    end if;
    if new.plan is distinct from old.plan then
      raise exception 'Not allowed to change plan';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists protect_profile_privileges on public.profiles;
create trigger protect_profile_privileges
  before update on public.profiles
  for each row execute function public.protect_profile_privileges();

-- Lo mismo al crear el perfil: un usuario nuevo no puede darse de alta como admin o premium.
create or replace function public.protect_profile_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if coalesce(auth.role(), '') in ('authenticated', 'anon') then
    new.role := 'user';
    new.plan := 'free';
  end if;
  return new;
end;
$$;

drop trigger if exists protect_profile_insert on public.profiles;
create trigger protect_profile_insert
  before insert on public.profiles
  for each row execute function public.protect_profile_insert();

-- ─────────────────────────────────────────────────────────────
-- 2. Journeys: el público solo ve los publicados (y los programados cuya hora ya llegó)
--    Borradores, archivados y programados futuros quedan solo para admins.
-- ─────────────────────────────────────────────────────────────
drop policy if exists journeys_public_read on public.journeys;
create policy journeys_public_read on public.journeys
  for select
  using (
    status = 'published'
    or (status = 'scheduled' and scheduled_publish_at is not null and scheduled_publish_at <= now())
  );

drop policy if exists journey_days_public_read on public.journey_days;
create policy journey_days_public_read on public.journey_days
  for select
  using (
    exists (
      select 1 from public.journeys j
      where j.id = journey_days.journey_id
        and (
          j.status = 'published'
          or (j.status = 'scheduled' and j.scheduled_publish_at is not null and j.scheduled_publish_at <= now())
        )
    )
  );

-- ─────────────────────────────────────────────────────────────
-- 3. Diseño: las reflexiones tienen título
-- ─────────────────────────────────────────────────────────────
alter table public.reflections
  add column if not exists title text;

-- ─────────────────────────────────────────────────────────────
-- 4. Limpieza: permisos duplicados (las reglas own_* ya cubren lo mismo)
-- ─────────────────────────────────────────────────────────────
drop policy if exists "Users can delete their own journals" on public.journals;
drop policy if exists "Users can insert their own journals" on public.journals;
drop policy if exists "Users can update their own journals" on public.journals;
drop policy if exists "Users can view their own journals"   on public.journals;

drop policy if exists reflections_delete_own on public.reflections;
drop policy if exists reflections_insert_own on public.reflections;
drop policy if exists reflections_select_own on public.reflections;
drop policy if exists reflections_update_own on public.reflections;

-- ─────────────────────────────────────────────────────────────
-- 5. Fotos de reflexiones: bucket privado (hoy se guardan en base64 dentro de la tabla)
--    Cada usuario solo puede leer y escribir en su carpeta: reflection-photos/<user_id>/...
--    El código pasará a guardar en reflections.photo la ruta del archivo, no la imagen.
-- ─────────────────────────────────────────────────────────────
insert into storage.buckets (id, name, public)
values ('reflection-photos', 'reflection-photos', false)
on conflict (id) do nothing;

drop policy if exists reflection_photos_select_own on storage.objects;
create policy reflection_photos_select_own on storage.objects
  for select to authenticated
  using (bucket_id = 'reflection-photos' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists reflection_photos_insert_own on storage.objects;
create policy reflection_photos_insert_own on storage.objects
  for insert to authenticated
  with check (bucket_id = 'reflection-photos' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists reflection_photos_update_own on storage.objects;
create policy reflection_photos_update_own on storage.objects
  for update to authenticated
  using (bucket_id = 'reflection-photos' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists reflection_photos_delete_own on storage.objects;
create policy reflection_photos_delete_own on storage.objects
  for delete to authenticated
  using (bucket_id = 'reflection-photos' and (storage.foldername(name))[1] = auth.uid()::text);

commit;

-- Comprobación rápida después de ejecutar (debe devolver la columna title):
-- select column_name from information_schema.columns where table_name = 'reflections' and column_name = 'title';
