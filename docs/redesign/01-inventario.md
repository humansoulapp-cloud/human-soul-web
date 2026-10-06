# HumanSoul · Inventario del estado actual (Paso 1)

Fuente: análisis estático del repo `human-soul-web` (rama `claude/humansoul-redesign-analysis-rdab14`, commit base `2e18df4`).
Alcance: todas las rutas de `app/`, componentes en `components/`, acciones en `lib/actions/`, `proxy.ts` y `app/globals.css`.

> **Nota sobre el esquema de Supabase.** El repo solo incluye dos migraciones (`scripts/migration-*.sql`). Las tablas y columnas de abajo están **inferidas del código** (queries y tipos TypeScript), no de un esquema real. Conviene que me confirmes o me pases un export del esquema (`pg_dump --schema-only` o capturas del Table Editor) antes de diseñar formularios definitivos.

---

## 0. Resumen ejecutivo

| | |
|---|---|
| Stack | Next.js 16.2 (App Router) · React 19 · Tailwind CSS v4 · Supabase (Auth SSR, Postgres, Storage) · framer-motion · lucide-react · next-themes |
| Pantallas reales | **16** (2 auth, 1 onboarding de 5 slides, 8 app de usuario, 5 admin) + 1 endpoint cron sin UI |
| Pantallas enlazadas pero inexistentes | `/forgot-password`, `/reset-password` (404) |
| Idioma de la UI | Inglés en todo (`<html lang="en">`, fechas `en-US`). El rediseño pedido es en español → **decisión de i18n pendiente** (ver §6) |
| Roles | `user` y `admin` (columna `profiles.role`) |
| shadcn/ui | **No está instalado** (sin `components.json`, sin carpeta `ui/`, sin Radix). Todo son componentes propios con clases Tailwind inline |
| Tailwind config | No hay `tailwind.config.*`; Tailwind v4 CSS-first y **sin bloque `@theme`**: los tokens son variables CSS usadas como `bg-[var(--…)]` |
| Estados de carga/error | Sin `loading.tsx`, `error.tsx` ni `not-found.tsx` en ninguna ruta. Carga = texto plano o `animate-pulse` en un solo sitio; los errores de Supabase casi siempre se ignoran en silencio |

### Principio de producto a respetar
El onboarding declara: *"No streaks. No scores. No pressure."* y *"Private by default"*. El rediseño no debería introducir rachas, puntuaciones ni gamificación. (El `PROJECT_MASTERPLAN.md` menciona "racha" en el dashboard, pero **no existe en el código**.)

---

## 1. Mapa de rutas por flujo

```
/                          → redirect a /dashboard
AUTH
  /sign-in                 Iniciar sesión
  /sign-up                 Crear cuenta
  /forgot-password         ✗ NO EXISTE (enlazada desde sign-in)
  /reset-password          ✗ NO EXISTE (permitida en proxy.ts)
ONBOARDING
  /onboarding              5 slides (pública)
APP DE USUARIO (layout con navegación)
  /dashboard               Inicio
  /journal                 Feed de reflexiones  (?journal_id=)
  /journal/new             Nueva reflexión      (?journal_id=)
  /journeys                Explorador de viajes guiados
  /journeys/[id]           Detalle + escritura diaria de un viaje
  /favorites               Reflexiones favoritas
  /profile                 Perfil
  /subscription            Premium
ADMIN (layout propio, solo role=admin)
  /admin                   Panel / estadísticas
  /admin/journeys          Lista de viajes (?status=)
  /admin/journeys/new      Crear viaje
  /admin/journeys/[id]     Editar viaje
  /admin/users             Usuarios y roles
API
  /api/cron/publish-journeys   GET|POST, publica viajes programados vencidos (Bearer CRON_SECRET opcional)
```

Rutas del `PROJECT_MASTERPLAN.md` que **no existen**: `/forgot-password`, `/reset-password`, `/journal/[id]` (detalle de reflexión). No hay forma de ver, editar ni borrar una reflexión individual.

### Navegación global
- **Usuario, desktop (`md+`)**: sidebar flotante izquierda (`w-64`, `top/bottom/left-4`, `rounded-3xl`, blur). Ítems: Home, Journal, Journeys, Favorites, Profile. Ítem extra punteado "Admin Panel" solo si `profiles.role = 'admin'`. Abajo: botón primario **Write** (`/journal/new`), toggle Light/Dark Mode, Sign Out.
- **Usuario, móvil (<`md`)**: barra inferior fija con los mismos 5 ítems (+ "Admin" si es admin). **No tiene** botón Write, toggle de tema ni Sign Out (solo accesibles desde Profile → Sign Out; el tema no se puede cambiar en móvil).
- **Admin**: sidebar fija `w-60` (Dashboard, Journeys, Users) + bloque "Signed in as {email}", Exit to App, toggle de tema (independiente del de usuario, `localStorage: admin-theme`), Sign Out. **No es responsive**: sin versión móvil.

### Permisos / guards
| Capa | Qué hace |
|---|---|
| `proxy.ts` | Sin sesión → redirige a `/sign-in` (excepto auth y `/onboarding`). Con sesión en `/sign-in|up|forgot|reset` → `/dashboard`. `/admin` solo exige sesión. |
| `(admin)/layout.tsx` | Lee `profiles.role` con service client; si no es `admin` → `/dashboard`. |
| Server actions de admin | `requireAdmin()` en crear/editar/borrar/publicar/archivar viajes, cambiar rol, subir imagen. |
| Visibilidad de viajes | Usuario: solo `published` o `scheduled` con `scheduled_publish_at <= now`. Admin ve todo. `draft`/`archived` solo para admin (también en `/journeys/[id]`). |
| Premium | El flag `journeys.premium` existe y se muestra en admin, pero **no se aplica en ninguna pantalla de usuario** (ni badge ni bloqueo). |

---

## 2. Modelo de datos inferido (Supabase)

| Tabla / recurso | Columnas usadas en el código |
|---|---|
| `auth.users` | email, `user_metadata.display_name` |
| `profiles` | `user_id`, `role` (`user`\|`admin`), `created_at` |
| `journals` | `id`, `user_id`, `title`, `created_at` |
| `reflections` | `id`, `user_id`, `journal_id` (nullable), `content`, `tags` (text[]), `photo` (data-URL base64), `favorite`, `created_at` |
| `journeys` | `id` (slug), `title`, `category`, `realm`, `tagline`, `purpose`, `intro`, `time_required`, `image_url`, `premium`, `featured`, `completion_message`, `reflection_questions` (jsonb, hasta 3), `status` (`published`\|`scheduled`\|`draft`\|`archived`), `scheduled_publish_at`, `created_at`, `updated_at` |
| `journey_days` | `journey_id`, `day`, `title`, `prompt`, `purpose`, `deeper` (opcional) |
| Storage `journey-images` | Portadas subidas desde admin (URL pública) |
| Contenido estático `lib/content.ts` | `JOURNEYS` (10 viajes semilla), `CATEGORIES`. Se usa en el dashboard y en `scripts/seed-journeys.ts` |

---

## 3. Inventario por pantalla — Auth y onboarding

### 3.1 `/sign-in` · Iniciar sesión
- **Layout**: `AuthShell` — tarjeta centrada `max-w-md`, logo de texto (Human en DM Sans + Soul en Bernstein), título "Welcome Back", subtítulo "Sign in to return to your personal space."
- **Datos**: ninguno (solo `supabase.auth.signInWithPassword`).
- **Campos**: Email address (`email`, requerido, placeholder `you@example.com`) · Password (`password`, requerido, placeholder "Your password").
- **Acciones**: botón **Sign In** (→ `/dashboard`); enlace "Forgot password?" (→ `/forgot-password`, **404**); enlace "Create one" (→ `/sign-up`).
- **Estados**: cargando = botón "Signing in…" deshabilitado · error = caja roja `#D4A3A3` con el mensaje de Supabase o "Please enter your email and password." · vacío/éxito: n/a.
- **Permisos**: solo anónimos (con sesión redirige a `/dashboard`).
- **Observaciones**: sin mostrar/ocultar contraseña, sin `autocomplete`, sin login social, sin errores por campo.

### 3.2 `/sign-up` · Crear cuenta
- **Layout**: `AuthShell`, "Begin Your Space" / "A quiet, private place to notice yourself."
- **Campos**: Name (opcional → `user_metadata.display_name`) · Email address (req.) · Password (req., "At least 6 characters") · Confirm Password (req.).
- **Validaciones (cliente)**: email y contraseña obligatorios; mínimo 6 caracteres; contraseñas iguales.
- **Acciones**: **Create Account** (con sesión inmediata → `/onboarding`; sin sesión → mensaje informativo); enlace "Sign In".
- **Estados**: cargando "Creating account…" · error (caja roja) · **info** (caja verde `#A3B8A7`): "Account created. Please check your email to confirm your registration."
- **Observaciones**: sin términos/privacidad, sin indicador de fortaleza, sin reenvío de email de confirmación, sin pantalla dedicada de "revisa tu correo".

### 3.3 `/forgot-password` y `/reset-password` · **No existen**
Enlazadas y permitidas por el proxy, pero no hay `page.tsx`. Para el rediseño hay que decidir si se **diseñan y se implementan** (recomendado: son parte del flujo de auth estándar) o se quita el enlace.

### 3.4 `/onboarding` · Onboarding (5 slides)
- **Layout**: columna centrada `max-w-md`, indicador de puntos arriba, contenido con transición framer-motion (fade + 10px), CTA abajo.
- **Slides**:
  1. "The Human Soul" — "A quiet place to notice yourself." — *Continue*
  2. "There are" — "No streaks. / No scores. / No pressure." — *Continue*
  3. "Your reflections belong to you." — "Private by default." — *Continue*
  4. "Would you like gentle reminders?" — **Yes, I would** / **Not now**
  5. "Welcome." — "Whenever you're ready." — *Begin* (→ `/dashboard`)
- **Datos**: escribe en `localStorage`: `reminders_enabled` y `onboarding_done`. **No se guarda en Supabase y nada en la app lee esas claves** (no existe ninguna función de recordatorios).
- **Estados**: sin vacío/error/cargando (estático). Sin botón Atrás ni "Saltar".
- **Permisos**: pública. **No hay lógica que obligue a pasar por el onboarding**: un usuario nuevo solo lo ve si el registro devuelve sesión inmediata.

---

## 4. Inventario por pantalla — App de usuario

### 4.1 `/dashboard` · Inicio
- **Datos**:
  - `auth.getUser()` → nombre (`display_name` o parte local del email).
  - `journals` del usuario (`select *`, `created_at desc`).
  - `reflections` (`id, journal_id`) del usuario, solo para contar entradas por cuaderno (descarga todas las filas).
  - `JOURNEYS[0]` de `lib/content.ts` (estático, **no** de la BD) para el banner destacado, con imágenes Unsplash hardcodeadas por id.
  - Cita diaria: texto fijo ("A quiet space to pause and listen to your thoughts.").
- **Bloques**:
  1. Cabecera: fecha larga (en-US) + saludo por hora ("Good Morning/Afternoon/Evening, {nombre}") + "What's on your mind today?"
  2. Tarjeta **Daily Reflection** con CTA **Write Now** (→ `/journal/new`).
  3. Banner de viaje destacado: imagen, badge de categoría, título, tagline, "{n} days", **Begin Journey** (→ `/journeys/{id}`).
  4. Sección **Your Journals**: botón **New Journal**; grid de tarjetas de cuaderno.
- **Tarjeta de cuaderno**: contador "{n} reflection(s)", título (→ `/journal?journal_id=`), fecha de creación, **Write** (→ `/journal/new?journal_id=`), **Open** (→ `/journal?journal_id=`), icono papelera (visible en hover) → confirmación inline "Delete / ✕". Tarjeta final punteada "Create New Journal".
- **Modal "Create a Journal"** (centrado): campo *Journal Title* (req., autofocus, placeholder "e.g. Morning Thoughts…") + 8 sugerencias en chips (Morning Pages, Gratitude & Joy, Mindful Moments, Creative Sparks, Travel & Wonder, Life Lessons, Deep Questions, Daily Musings) + Cancel / **Create Journal** ("Creating…").
- **Estados**:
  - Cargando: 3 skeletons `animate-pulse` **solo en la sección de cuadernos** (el resto aparece de golpe).
  - Vacío: "Create Your First Journal" + 5 chips "Popular Titles" + **Create Custom Journal**.
  - Con datos: grid 1/2/3 columnas.
  - Error: **ninguno** (errores de insert/delete se ignoran; la UI no avisa).
- **Acciones destructivas**: borrar cuaderno (sin saber qué ocurre con sus reflexiones: depende de la FK de la BD, no está en el repo).
- **Observaciones**: no se puede renombrar un cuaderno. El viaje destacado no sale de la BD y puede no existir/estar publicado. Mezcla de `journals` (cuadernos) y "journeys" (viajes) → terminología confusa (ver §6).

### 4.2 `/journal` · Feed de reflexiones (`?journal_id=`)
- **Datos**: `reflections` del usuario (`created_at desc`), filtradas por `journal_id` si viene en la URL; `journals.title` del cuaderno activo.
- **Elementos**: título ("Your Reflections" o nombre del cuaderno) + subtítulo; botón **New Reflection** (conserva `journal_id`); banner "Filtered by: {cuaderno}" con **Show all reflections**; buscador (texto + tags, filtrado en cliente, "Search by keyword or tag…").
- **Tarjeta de reflexión**: fecha larga, botón corazón (toggle `favorite`), foto opcional (`max-h-60`), contenido (`whitespace-pre-wrap`), chips de tags.
- **Estados**:
  - Cargando: texto "Loading reflections…" (sin skeleton).
  - Vacío: icono + "No reflections yet" + texto según contexto + **Write your first reflection**. (El mismo bloque se muestra cuando una **búsqueda no devuelve resultados**, con texto equivocado.)
  - Con datos: lista vertical.
  - Error: ninguno; si no hay `user`, se queda cargando para siempre.
- **No existe**: editar, borrar, ver detalle, paginación, filtros por tag/fecha, ordenar, mover entre cuadernos. Los favoritos usan `bg-red-50` fijo (rompe en modo oscuro).

### 4.3 `/journal/new` · Nueva reflexión (`?journal_id=`)
- **Datos**: `journals` (`id, title`) del usuario para el selector; inserta en `reflections`.
- **Campos**:
  - **Save to Journal** (`select`, solo si hay cuadernos): "General (No Journal)" + cuadernos. Preseleccionado por `?journal_id`.
  - **Texto** (`textarea`, req., 8 filas; placeholder cambia según cuaderno).
  - **Tags or emotions** (opcional, multiselección de 8 chips fijos): Gratitude, Calm, Clarity, Tired, Hopeful, Uncertain, Peaceful, Reflective.
  - **Foto** (opcional): *Attach/Change photo* (`image/*`, se convierte a base64 y se guarda en la columna `photo`) + quitar con X.
- **Acciones**: **Save Reflection** (→ feed del cuaderno o `/journal`); enlace "Back to journal".
- **Estados**: guardando "Saving…" · error en caja roja ("Write something in your reflection before saving.", "You must be signed in…", mensaje de Supabase) · fallback Suspense "Loading editor…".
- **Observaciones**: sin autoguardado ni confirmación al salir con texto; sin límite/compresión de imagen (base64 en BD); no se pueden crear tags propios; la fecha no es editable.

### 4.4 `/journeys` · Viajes guiados
- **Datos**: `journeys` + `journey_days` (server, `getJourneys()`), solo los visibles al público. Categorías derivadas de los datos.
- **Elementos**: cabecera "Guided Journeys"; pills de categoría (All journeys + una por categoría, scroll horizontal en móvil); grid 1/2/3 columnas de tarjetas con imagen de fondo (con `FALLBACK_IMAGE` Unsplash), badge de categoría, título, tagline (2 líneas), "{n} days", "Begin →".
- **Estados**: con datos. **Vacío: no hay** (grid en blanco si no hay viajes o si la categoría queda vacía). Cargando/error: ninguno (RSC; si Supabase falla, `throw` → error genérico de Next).
- **Observaciones**: no muestra `premium`, `featured`, `time_required` ni `realm`. Sin buscador. Tarjetas con `opacity-30` sobre la imagen en claro (aspecto lavado). `dark:` de Tailwind v4 sigue `prefers-color-scheme`, no la clase `.dark` (ver §5.5).

### 4.5 `/journeys/[id]` · Detalle de viaje
- **Datos**: `journeys` + `journey_days` ordenados por `day` (server). `notFound()` si no existe o no es visible. Inserta en `reflections`.
- **Elementos**: "← All journeys"; tarjeta cabecera (categoría, `time_required`, título, `intro` o `purpose`); título "Day X of N: {título}"; tabs de días (Day 1…N, scroll horizontal); tarjeta con `prompt` del día, cita en cursiva con `purpose` del día, formulario de respuesta.
- **Formulario**: textarea "Your reflection for Day X:" (5 filas) + **Save to my Journal**. Guarda en `reflections` con contenido formateado `[Título - Day N: título]\n\n…`, tags `[título del viaje, "Day N"]`, **sin `journal_id`**.
- **Estados**: guardando "Saving…" · éxito (caja verde "Reflection saved to your journal!" y avance automático al siguiente día a los 1,5 s) · 404 de Next si no existe. **Error de guardado: ninguno** (se ignora); si no hay usuario el botón queda en "Saving…".
- **No existe**: progreso por viaje, día completado/bloqueado, ver respuestas previas, retomar donde lo dejé.
- **Datos que existen pero nunca se muestran al usuario**: `journey_days.deeper`, `journeys.completion_message`, `journeys.reflection_questions`, `realm`, `image_url`, `premium`. Solo `JourneyPreviewModal` (admin) los renderiza → el flujo de "final de viaje" está diseñado en admin pero **no existe en la app**.

### 4.6 `/favorites` · Favoritos
- **Datos**: `reflections` del usuario con `favorite = true`, `created_at desc`.
- **Elementos**: "← Back to profile", título, subtítulo, tarjetas idénticas a las del feed con botón corazón relleno (quita de favoritos y la tarjeta desaparece).
- **Estados**: cargando (texto "Loading favorites…") · vacío (icono corazón + "You haven't marked any reflections as favorites yet." + pista) · con datos · error: ninguno.
- **Observaciones**: aparece en la nav principal **y** como sub-pantalla de Profile con "Back to profile" (inconsistente).

### 4.7 `/profile` · Perfil
- **Datos**: `auth.getUser()`; conteos exactos (`head: true`) de `reflections` y de `reflections` favoritas.
- **Elementos**: tarjeta de usuario (avatar genérico con icono, nombre, email); 2 estadísticas (Reflections written, Favorite reflections → `/favorites`); lista de enlaces: "View My Favorites" (→ `/favorites`) y "Premium Subscription" con badge **Free** fijo (→ `/subscription`); botón **Sign Out**.
- **Estados**: **sin skeleton**: muestra "User" y ceros hasta que cargan. Sin vacío ni error propios.
- **No existe**: editar nombre/email/contraseña, avatar, preferencias de recordatorios, idioma, tema (en móvil), exportar/borrar datos/cuenta, enlaces legales. Es la única pantalla de "ajustes" y no tiene ajustes.

### 4.8 `/subscription` · Premium
- **Datos**: ninguno (todo estático).
- **Elementos**: "← Back to profile"; icono, título "The Human Soul Premium", subtítulo; tarjeta con "Monthly Plan **$4.99 / month**", "Cancel anytime", 4 beneficios (Unlimited access to all Guided Journeys · Unlimited reflections with photo attachments · Secure cloud sync with Supabase · No ads or distracting elements) y botón **Subscribe to Premium**.
- **Estados**: el botón hace `alert("Payment feature available at final MVP launch.")`. No hay plan activo, ni facturación, ni pasarela de pago, ni estados de error/cargando.
- **Observaciones**: un único plan mensual en USD; el beneficio "Secure cloud sync with Supabase" menciona un proveedor técnico al usuario.

---

## 5. Inventario por pantalla — Admin (solo `role = admin`)

Layout común: sidebar `w-60` + `<main class="p-8">`. Tema propio `.admin-panel` con variables `--admin-*`, **dark por defecto** (toggle persistido en `localStorage`), estilos casi todos en `style={{}}` inline.

### 5.1 `/admin` · Dashboard
- **Datos** (`getStats()`, service client): conteo de `journeys` (total, programados futuros, destacados, premium) y de `profiles` (usuarios).
- **Elementos**: 5 tarjetas KPI enlazadas — Total Journeys (`/admin/journeys`), Scheduled (`?status=scheduled`, resaltada si >0), Total Users (`/admin/users`), Featured, Premium — y bloque **Quick Actions**: **+ New Journey**, **Manage Users**.
- **Estados**: sin skeleton, sin error propio (si falla, error de Next), sin vacío (muestra 0).
- **Observación de seguridad (fuera de alcance del diseño, pero relevante)**: `getStats()` está exportada desde un archivo `"use server"` **sin `requireAdmin()`**, por lo que es invocable como server action por cualquier usuario autenticado. Lo mismo aplica a `getJourneys({ includeAll: true })` (depende de RLS). Lo apunto para que lo revises.

### 5.2 `/admin/journeys` · Lista de viajes (`?status=all|published|scheduled|draft|archived`)
- **Datos**: `getJourneys({ includeAll: true })`. Estado "Live" = `published` o `scheduled` ya vencido.
- **Elementos**: cabecera con resumen "{n} total · {n} live · {n} scheduled · {n} drafts · {n} archived" + **New Journey**; pestañas con contador (All, Live & Published, Scheduled, Drafts, Archived) coloreadas por estado; grid 1–4 columnas de tarjetas.
- **Tarjeta**: portada (o placeholder), badges (Live / Scheduled / Draft / Archived + Featured + Premium), categoría, título, tagline/purpose, banner "Auto-upload: {fecha}" si está programado, "{n} days", `time_required`, y acciones: **Edit** (→ `/admin/journeys/[id]`), **Preview** (nueva pestaña a `/journeys/[id]`), **Publish Now** (solo si no está live/archivado; `window.confirm` nativo), **Archive / Restore** (confirmación inline "Archive?/Restore?"; restaurar deja en `draft`), **Delete** (papelera → confirmación inline "Confirm").
- **Estados**: vacío por pestaña con mensaje específico + botón Create Journey · con datos · cargando: ninguno · error: las acciones no muestran errores (`result.error` se ignora en Publish/Archive/Delete).
- **Acciones masivas / búsqueda / orden**: no existen.

### 5.3 `/admin/journeys/new` y `/admin/journeys/[id]` · Formulario de viaje (`JourneyForm`)
Misma pantalla en modo crear/editar; `notFound()` si el id no existe.
- **Barra superior sticky**: volver, título + "{id} · {n} days · {category}", indicador "Saved / Unsaved changes", **Preview as User** (abre modal), **Save Changes** ("Saving…").
- **Sección Ajustes del viaje**:
  - **Cover**: vista previa 16:10, botón de subida (→ Storage `journey-images`, "Uploading…") y campo URL (modo `url`/`upload`).
  - Checkboxes: **Featured**, **Premium only**.
  - Campos: Title (req.) · Tagline · Category · Realm · Time required · **Journey ID** (req., slug; bloqueado al editar).
  - Colapsable **Detailed texts**: Purpose (textarea) · Introduction (textarea).
- **Sección Publishing & Schedule**: 4 opciones tipo tarjeta — **Publish Immediately**, **Schedule for Future Date**, **Save as Draft**, **Archive Journey**; si "Schedule": `datetime-local` (hora local) + presets **Tomorrow**, **+3 Days**, **+1 Week** (redondeo a 15 min).
- **Sección Journey Days (master-detail)**: lista lateral (280 px) con **+ Add**, seleccionar día, eliminar día (mínimo 1; renumera) · editor del día: Title · Purpose (breve intención) · Prompt (textarea principal) · Deeper question (opcional).
- **Sección Journey Completion**: 3 campos "Reflection question 1–3" + Completion message (textarea).
- **Validaciones**: ID y título obligatorios; si es "scheduled", fecha obligatoria.
- **Estados**: guardando · error (caja roja) · dirty/saved · tras guardar **redirige a `/admin/journeys`** (por tanto "Saved" casi nunca se ve). Sin confirmación al salir con cambios sin guardar. Sin skeleton.
- **Modal `JourneyPreviewModal`** ("User Experience Preview"): casi pantalla completa (`max-w-5xl`, 92vh); conmutador **Desktop / Mobile**; chip de estado; selector de días; render del día (prompt, purpose, deeper), textarea de ejemplo con "Save to my Journal (Preview Only)" y la **vista de cierre** (completion message + preguntas). Es hoy el único lugar donde se ve el cierre de un viaje.
- **Observación**: la fusión de borrar y reinsertar todos los días en cada guardado (`updateJourney`) es una decisión de backend, no de UI, pero implica que no hay IDs estables de día.

### 5.4 `/admin/users` · Usuarios
- **Datos**: `profiles` (`user_id, role, created_at`) con service client. **No hay emails** (`email: "—"` fijo; la nota de la pantalla lo reconoce y remite al dashboard de Supabase).
- **Elementos**: cabecera "{n} users · {n} admin(s)"; nota informativa; **tabla** de 4 columnas (User ID monoespaciado con avatar escudo/usuario · Role badge · Joined · Actions) con botón **Make admin / Revoke admin** (sin confirmación; error en texto rojo bajo el botón).
- **Estados**: vacío ("No users found.") · con datos · cargando "…" en el botón · sin skeleton, sin paginación, sin búsqueda ni filtros.
- **Observaciones**: un admin puede revocarse su propio rol sin aviso. En móvil la tabla de `grid-cols-[1fr_120px_140px_120px]` se rompe (hay que convertirla en tarjetas, como pide la regla).

### 5.5 `/api/cron/publish-journeys`
Sin UI. Publica `scheduled` con `scheduled_publish_at <= now`. Fuera del alcance del rediseño.

---

## 6. Design system actual

### 6.1 Tokens (`app/globals.css`)
Variables CSS propias, **no** siguen la nomenclatura shadcn.

| Token actual | Claro | Oscuro (`.dark`) | Equivalente shadcn aproximado |
|---|---|---|---|
| `--bg-surface` | `#F8F6F2` | `#141312` | `background` |
| `--bg-surface-secondary` | `#F2EEE8` | `#1C1A19` | `card` / `muted` |
| `--bg-surface-tertiary` | `#E4DED5` | `#262423` | `accent` (casi sin uso) |
| `--text-primary` | `#2F2F2F` | `#F8F6F2` | `foreground` |
| `--text-secondary` | `#6E6A65` | `#9E9A93` | `muted-foreground` |
| `--text-muted` | `#9E9A93` | `#6E6A65` | (tercer nivel de texto) |
| `--brand-primary` | `#8BA58F` | `#8BA58F` | `primary` |
| `--brand-primary-hover` | `#78937C` | `#78937C` | `primary` (hover) |
| `--border-subtle` | `#E4DED5` | `#2A2826` | `border` |
| `--border-strong` | `#8BA58F` | `#8BA58F` | `ring` (sin uso detectado) |
| `--logo-color` | `#131312` | `#FFFFFF` | — |

- **No hay** `destructive`, `secondary`, `accent`, `popover`, `input`, `ring` ni `radius`. El estado de error/destructivo se resuelve con hex sueltos (`#D4A3A3`) y `red-*` de Tailwind.
- **Contraste a revisar**: texto `#F8F6F2` sobre `--brand-primary #8BA58F` en botones primarios ≈ 2,5:1 (no llega a AA); `--text-muted #9E9A93` sobre `#F8F6F2` ≈ 2,6:1. Lo confirmaré con medición real en la fase de design system.
- **Panel admin**: segundo sistema paralelo `--admin-*` (bg, sidebar, surface, surface-2, border, border-hover, text, text-muted, text-secondary, input-bg, input-border, accent `#8BA58F`, accent-hover, danger `#E57373`/`#D32F2F`, danger-bg) en dos temas (`.admin-panel` oscuro por defecto, `.admin-panel.light`).
- **Colores hardcodeados fuera de tokens**: `#D4A3A3` (error/danger suave), `#A3B8A7` (éxito), `#8BA58F`/`#78937C` (copias del primario en navbar y admin), `#1F1D1B` (fondo de tarjetas de viaje en dark), `#D4CED5` (scrollbar), y la paleta Tailwind `emerald/amber/zinc/purple/indigo/red` para estados de viaje.

### 6.2 Tailwind
- `postcss.config.mjs` con `@tailwindcss/postcss`; **sin `tailwind.config`**, sin `@theme`, sin `@custom-variant`.
- ⚠️ **Bug de modo oscuro (confirmado en el CSS compilado)**: el tema se activa con la clase `.dark` (next-themes, `attribute="class"`), pero las utilidades `dark:` de Tailwind v4 se compilan como `@media (prefers-color-scheme: dark)` porque no se declara `@custom-variant dark (&:where(.dark, .dark *))`. Resultado: `dark:opacity-70`, `dark:text-white`, `dark:bg-[#1F1D1B]`, `dark:border-red-800`… solo se aplican si el **SO** está en oscuro, aunque el usuario fuerce otro tema con el toggle de la app (y al revés). Afecta sobre todo a las tarjetas de viaje y al banner del dashboard.
- ⚠️ **Bug de fuente (confirmado)**: `proxy.ts` solo excluye `svg|png|jpg|jpeg|gif|webp` del matcher, no `.ttf`. Para un usuario **sin sesión**, `GET /fonts/BernsteinSerial-Regular.ttf` responde `307 → /sign-in`, la fuente falla (`Bernstein: error`) y los titulares de `/sign-in`, `/sign-up` y `/onboarding` se pintan con el fallback `Georgia/Times`. Las capturas de esas pantallas muestran ese fallback, que es lo que ven hoy los usuarios anónimos en producción. Con sesión iniciada la fuente sí carga.
- Clases usadas que no existen en Tailwind v4 por defecto: `scrollbar-none` (sin plugin), `animate-in fade-in duration-200` (requiere `tailwindcss-animate`, que **no** está instalado). (`md:pl-76`, `px-4.5` y `py-0.2` sí compilan en v4 por escala dinámica). Es decir, algunas animaciones/efectos probablemente **no hacen nada**.

### 6.3 Tipografía
| Rol | Fuente | Origen |
|---|---|---|
| Titulares (`h1–h3`, `.font-serif-editorial`) | **Bernstein Serial** Regular (peso 400) | local `public/fonts/` (existe también `ExtraLight.ttf`, sin usar) |
| Cuerpo | **Inter** 300/400/500/600 | `next/font/google` (`--font-inter`) |
| Logotipo "Human" y variante `.font-dm-sans` | **DM Sans** 400/500/700 | `next/font/google` |
- Escala: todo con `text-[…px]`/`text-xs…5xl` ad hoc; muchos textos de 10–11 px (`text-[10px]`, `text-[11px]`). `PROJECT_MASTERPLAN.md` dice "Cormorant Garamond": **desactualizado**.
- Logo: texto compuesto (no usa `public/logo.svg` / `logo.png`, que existen).

### 6.4 Forma, sombras y movimiento
- Radios: `rounded-xl` (inputs, botones), `rounded-2xl` (tarjetas, nav items), `rounded-3xl` (tarjetas grandes, sidebar), `rounded-full` (chips/pills). Sin escala ni token.
- Sombras: `shadow-sm` casi en todo; `shadow-lg/2xl` en hover y modales.
- Efectos: `backdrop-blur` en sidebar/barra inferior/modales; zoom de imagen `scale-105` 700 ms en tarjetas de viaje; framer-motion solo en onboarding.
- Espaciado: `px-6 pt-8 pb-24 md:pl-76 md:pr-10` en `main`; contenido de formularios en columnas `max-w-xl/2xl`.

### 6.5 Componentes shadcn/ui
**Ninguno.** No hay `components.json`, `components/ui/`, Radix, `cva` ni `class-variance-authority`. Solo están `clsx` y `tailwind-merge`, **sin helper `cn()`** (no existe `lib/utils.ts`) y casi no se usan.

### 6.6 Componentes propios

| Componente | Archivo | Uso |
|---|---|---|
| `Navigation` (sidebar + tab bar) | `components/navbar.tsx` | Layout de usuario |
| `AuthShell` | `components/auth-shell.tsx` | Sign in / Sign up |
| `ThemeProvider` | `components/theme-provider.tsx` | next-themes (class, system) |
| `JourneysFilter` (pills + grid de tarjetas) | `components/JourneysFilter.tsx` | `/journeys` |
| `JourneyDetailClient` | `components/JourneyDetailClient.tsx` | `/journeys/[id]` |
| `AdminSidebar`, `AdminThemeProvider` | `components/admin/` | Layout admin |
| `JourneyForm` (973 líneas) | `components/admin/JourneyForm.tsx` | Crear/editar viaje |
| `JourneyPreviewModal` | `components/admin/JourneyPreviewModal.tsx` | Preview admin |
| `ChangeRoleButton`, `PublishNowButton`, `DeleteJourneyButton`, `ArchiveJourneyButton` | `components/admin/` | Acciones de admin |

### 6.7 Patrones repetidos que deberían ser componentes del nuevo DS
(Hoy están copiados y pegados con clases inline.)

| Patrón | Dónde aparece |
|---|---|
| Botón primario (verde salvia) | Casi todas las pantallas (≈ 20 copias) |
| Botón secundario / ghost / destructivo suave | dashboard, profile, admin |
| Input de texto / textarea / select | auth, journal/new, journey detail, modal, admin |
| Alerta (error `#D4A3A3`, éxito `#A3B8A7`) | auth, journal/new, journey detail |
| Chip / pill (filtro, tag, sugerencia) | journeys, journal, journal/new, dashboard |
| Tarjeta (surface-secondary, borde, `rounded-2xl/3xl`) | todas |
| Tarjeta de reflexión | journal, favorites (duplicada) |
| Tarjeta de viaje con imagen | dashboard, journeys, admin |
| Estado vacío | dashboard, journal, favorites, admin |
| Skeleton | solo dashboard (cuadernos) |
| Modal | dashboard (crear cuaderno), admin (preview) |
| Confirmación inline / `window.confirm` | dashboard, admin (3 variantes distintas) |
| Tabs (días, categorías, estado admin) | journeys, journey detail, admin |
| Badge de estado | admin (Live/Scheduled/Draft/Archived/Featured/Premium), profile (Free) |
| Tabla | solo admin/users |
| Barra de navegación | usuario (sidebar + tab bar), admin (sidebar) |

---

## 7. Hallazgos y decisiones abiertas para el rediseño

**Funcionalidad que falta o está rota** (conviene decidir antes de diseñar, porque cambia el número de pantallas):
1. `/forgot-password` y `/reset-password` no existen.
2. No hay detalle, edición ni borrado de reflexiones; ni renombrar cuadernos.
3. El cierre de un viaje (`completion_message`, `reflection_questions`, `deeper`) está en admin pero no en la app de usuario; tampoco hay progreso por viaje.
4. Premium no se aplica en la app de usuario; el pago es un `alert()`.
5. Los recordatorios del onboarding no se persisten ni se usan.
6. Perfil sin ajustes reales (nombre, contraseña, tema en móvil, recordatorios, exportar/eliminar datos).
7. Admin sin versión móvil.
8. Terminología confusa: "Journal(s)" = cuadernos del usuario, "Journey(s)" = viajes guiados, "Reflection" = entrada. Propondré nombres en español coherentes (p. ej. *Cuadernos*, *Viajes*, *Reflexiones*) en el design system.

**Estados que hoy no existen y el rediseño debe cubrir** (regla: vacío, skeleton, error, con datos): skeleton en todas las pantallas; error en todas las que consultan Supabase; vacío en `/journeys`, `/admin` y `/admin/users`; vacío de búsqueda distinto del vacío "sin reflexiones".

**Idioma**: la app está en inglés. Asumo que el rediseño se entrega **en español** como pides, y que la implementación posterior traducirá textos (hoy no hay librería i18n). ¿Quieres que la app final sea solo en español o bilingüe?

**Datos que mostraré en el rediseño aunque hoy no se vean** (marcados como "campo existente no mostrado" para que decidas): `realm`, `premium`, `featured`, `time_required` en tarjetas de viaje; `deeper`; `completion_message`; `reflection_questions`.

---

## 8. Estado de las capturas (Paso 2)

Capturadas en `docs/redesign/capturas/` (Chromium, 1440×900 y 390×844, claro y oscuro, página completa). Convención: `{flujo}-{pantalla}__{claro|oscuro}__{desktop|mobile}.png` (`light`/`dark` en el nombre del archivo).

| Pantalla | Estado |
|---|---|
| `/sign-in`, `/sign-up` | ✅ 1440 y 390, claro y oscuro |
| `/onboarding` (5 slides) | ✅ 1440 y 390, claro y oscuro |
| `/forgot-password`, `/reset-password` | — no existen |
| `/dashboard`, `/journal`, `/journal/new`, `/journeys`, `/journeys/[id]`, `/favorites`, `/profile`, `/subscription` | ⛔ requieren sesión y datos de Supabase |
| `/admin`, `/admin/journeys`, `/admin/journeys/new`, `/admin/journeys/[id]`, `/admin/users` | ⛔ requieren sesión de **admin** y datos |

Las capturas se hicieron con la app en local apuntando a un Supabase ficticio (sin red), solo posible para las pantallas anónimas. Los estados de error, carga y vacío de las demás pantallas tampoco son capturables sin backend real o datos de prueba.
