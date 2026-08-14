# 📜 MASTER PLAN: The Human Soul Web (Next.js + Supabase)

Este documento es la **fuente única de verdad y progreso** del proyecto. Cualquier agente de IA que inicie una nueva sesión debe leer este archivo para saber el estado exacto del desarrollo, los pasos completados y el siguiente paso a ejecutar.

---

## 📌 Metadata del Proyecto

- **Ruta del Proyecto**: `/Users/dariolledo/Code/apps/human-soul-web`
- **Stack Técnico**:
  - **Framework**: Next.js 14+ (App Router, TypeScript)
  - **Estilos & UI**: Tailwind CSS, Lucide Icons, Framer Motion, Google Fonts (Cormorant Garamond + Inter), Glassmorphism & Paper Aesthetic
  - **Backend & DB**: Supabase (PostgreSQL, Supabase Auth con SSR cookies, Supabase Storage)
  - **Despliegue**: Vercel

---

## 🗺️ Mapa de Rutas (Conversión desde Expo a Next.js)

| Vista / Función | Ruta en Expo Antigua | Ruta en Next.js Web Nueva | Estado |
| :--- | :--- | :--- | :--- |
| **Inicio de Sesión** | `app/sign-in.tsx` | `app/(auth)/sign-in/page.tsx` | `[x] Completado` |
| **Registro de Usuario** | `app/sign-up.tsx` | `app/(auth)/sign-up/page.tsx` | `[x] Completado` |
| **Olvidó Contraseña** | `app/forgot-password.tsx` | `app/(auth)/forgot-password/page.tsx` | `[x] Completado` |
| **Resetear Contraseña** | `app/reset-password.tsx` | `app/(auth)/reset-password/page.tsx` | `[x] Completado` |
| **Onboarding** | `app/onboarding.tsx` | `app/onboarding/page.tsx` | `[x] Completado` |
| **Dashboard / Inicio** | `app/(tabs)/index.tsx` | `app/(main)/dashboard/page.tsx` | `[x] Completado` |
| **Diario / Reflexiones** | `app/(tabs)/journal.tsx` | `app/(main)/journal/page.tsx` | `[x] Completado` |
| **Nueva Reflexión** | `app/reflection/new.tsx` | `app/(main)/journal/new/page.tsx` | `[x] Completado` |
| **Detalle de Reflexión** | `app/reflection/[id].tsx` | `app/(main)/journal/[id]/page.tsx` | `[x] Completado` |
| **Explorador de Viajes** | `app/(tabs)/journeys.tsx` | `app/(main)/journeys/page.tsx` | `[x] Completado` |
| **Detalle de Viaje** | `app/journey/[id].tsx` | `app/(main)/journeys/[id]/page.tsx` | `[x] Completado` |
| **Perfil de Usuario** | `app/(tabs)/profile.tsx` | `app/(main)/profile/page.tsx` | `[x] Completado` |
| **Favoritos** | `app/favorites.tsx` | `app/(main)/favorites/page.tsx` | `[x] Completado` |
| **Suscripción Premium** | `app/subscription.tsx` | `app/(main)/subscription/page.tsx` | `[x] Completado` |

---

## 🎯 Lista de Verificación por Fases

### Fase 1: Configuración de Infraestructura y Supabase `[COMPLETADO]`
- [x] Inicialización del proyecto Next.js App Router con TypeScript y Tailwind CSS en `/Users/dariolledo/Code/apps/human-soul-web`.
- [x] Instalación de dependencias: `@supabase/supabase-js`, `@supabase/ssr`, `lucide-react`, `framer-motion`, `clsx`, `tailwind-merge`.
- [x] Configurar variables de entorno `.env.local` (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`).
- [x] Implementar clientes SSR de Supabase en `lib/supabase/client.ts` y `lib/supabase/server.ts`.
- [x] Implementar `middleware.ts` para protección de rutas y refresco de sesiones.

### Fase 2: Autenticación & Onboarding `[COMPLETADO]`
- [x] Construir componentes UI reutilizables (`AuthShell`, botones, inputs, modales).
- [x] Implementar página de Login (`app/(auth)/sign-in/page.tsx`).
- [x] Implementar página de Registro (`app/(auth)/sign-up/page.tsx`).
- [x] Implementar pantalla de Onboarding (`app/onboarding/page.tsx`) con transiciones animadas de Framer Motion.

### Fase 3: Navegación Principal y Módulos del MVP `[COMPLETADO]`
- [x] Layout principal `app/(main)/layout.tsx` con Sidebar (Desktop) y Barra de Navegación Responsive (Móvil) (`components/navbar.tsx`).
- [x] Página de Inicio / Dashboard (`app/(main)/dashboard/page.tsx`) con cita diaria, racha, saludo por horario y creador de cuadernos.
- [x] Módulo de Diario (`app/(main)/journal/page.tsx`) con búsqueda en tiempo real y favoritos.
- [x] Creador de Reflexiones (`app/(main)/journal/new/page.tsx`) con selección de emociones/tags e imágenes.
- [x] Módulo de Viajes Guiados (`app/(main)/journeys/page.tsx` y `app/(main)/journeys/[id]/page.tsx`).
- [x] Vista de Perfil (`app/(main)/profile/page.tsx`) y Favoritos (`app/(main)/favorites/page.tsx`).
- [x] Vista de Suscripción Premium (`app/(main)/subscription/page.tsx`).

### Fase 4: Pulido Estético & Responsividad `[COMPLETADO]`
- [x] Paleta editorial suave de papel (`#F8F6F2`, `#F2EEE8`, `#8BA58F`, `#2F2F2F`) con tipografía Cormorant Garamond e Inter.
- [x] Interfaz 100% responsiva (Mobile-First en smartphones, Sidebar en ordenadores/tablets).

### Fase 5: Verificación y Despliegue `[COMPLETADO]`
- [x] Verificación de compilación (`npm run build`) superada con 0 errores TypeScript/Next.js.

---

### Fase 6: Panel de Administración & Programación de Viajes (Scheduling) `[COMPLETADO]`
- [x] Panel de administración `/admin` con estadísticas de viajes (activos, programados, borradores, usuarios).
- [x] Gestión CRUD completa de viajes guiados con soporte de portada (URL o subida directa a Supabase Storage).
- [x] Sistema de estados y programación de publicaciones (`published`, `scheduled`, `draft`).
- [x] Componente de selección de fecha y hora local con presets rápidos (+1 día, +3 días, +1 semana).
- [x] Filtros por pestañas en `/admin/journeys` (Todos, Publicados en vivo, Programados, Borradores).
- [x] Publicación instantánea con 1 clic ("Publish Now") para viajes programados o borradores.
- [x] Publicación automática inmediata al cumplirse la fecha/hora programada en consultas de usuario y endpoint cron `/api/cron/publish-journeys`.
- [x] Script de migración SQL en `scripts/migration-add-scheduling.sql`.

---

## 📝 Registro de Sesiones e Historial de Cambios

### 📅 Sesión 2 - 2026-08-14 (Agente Antigravity)
- **Acciones Realizadas**:
  1. Se implementó la funcionalidad completa de **Scheduling & Automated Publishing** para Viajes en el Panel de Administración.
  2. Se añadieron columnas `status` y `scheduled_publish_at` en la base de datos de Supabase.
  3. Se creó el control visual en el formulario de creación/edición de viajes (`components/admin/JourneyForm.tsx`) con date-picker y presets rápidos.
  4. Se integraron pestañas de filtrado y etiquetas de estado con badges dinámicos en el listado de administración (`app/(admin)/admin/journeys/page.tsx`).
  5. Se implementó el endpoint `/api/cron/publish-journeys` para automatizaciones en segundo plano.
  6. Se verificó con `npm run build` obteniendo 0 errores de compilación y tipado.

### 📅 Sesión 1 - 2026-07-30 (Agente Antigravity)
- **Acciones Realizadas**:
  1. Se creó la nueva aplicación Web limpia en `/Users/dariolledo/Code/apps/human-soul-web`.
  2. Se configuraron Supabase Auth (SSR Cookies), Tailwind CSS, fuentes editoriales (Cormorant Garamond + Inter) y la estética tipo diario de papel.
  3. Se replicaron las 14 rutas y pantallas de la app original (Sign In, Sign Up, Onboarding, Dashboard, Diario, Nueva Reflexión, Viajes Guiados, Lecciones, Perfil, Favoritos, Suscripción).
  4. Se validó la compilación de producción con `npm run build` obteniendo **14 rutas estáticas/dinámicas compiladas correctamente**.
  5. Se redactó y finalizó este archivo `PROJECT_MASTERPLAN.md`.

---

## 🤖 Guía de Instrucciones para la IA (Cualquier Sesión Futura)

1. **Estado Actual**: El MVP y el Módulo de Administración con Programación de Viajes (Scheduling) están 100% completados y listos para producción.
2. **Para probar localmente**:
   - Abrir terminal en `/Users/dariolledo/Code/apps/human-soul-web`.
   - Ejecutar `npm run dev`.
   - Navegar a `http://localhost:3000/admin/journeys`.
3. **Para despliegue**:
   - Subir el código a GitHub y conectar con Vercel. Las variables de entorno en `.env.local` deben añadirse al panel de Vercel.
   - Ejecutar el script `scripts/migration-add-scheduling.sql` en el SQL Editor de Supabase si la tabla aún no cuenta con las columnas `status` y `scheduled_publish_at`.

