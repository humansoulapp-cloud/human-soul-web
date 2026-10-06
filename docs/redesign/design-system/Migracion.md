# Migración desde la app actual

Equivalencias entre los tokens y componentes actuales del repositorio y este sistema.

## Tokens

| Actual (`globals.css`) | Nuevo |
| --- | --- |
| `--bg-surface` | `background` |
| `--bg-surface-secondary` | `card` (y `sidebar`) |
| `--bg-surface-tertiary` | `secondary` |
| `--text-primary` | `foreground` |
| `--text-secondary` | `muted-foreground` |
| `--text-muted` | `muted-foreground` (se fusiona: el tono anterior no cumplía contraste) |
| `--brand-primary` | `primary` (en claro pasa a una salvia más profunda) y `brand` (la salvia original, solo decorativa) |
| `--brand-primary-hover` | derivado en el componente, no es token |
| `--border-subtle` | `border` |
| `--border-strong` | `ring` y `input` |
| `--admin-*` | desaparece: el panel de administración usa los tokens comunes |
| `#D4A3A3`, `red-*` | `destructive`, `destructive-soft` |
| `#A3B8A7`, `emerald-*` | `success`, `success-soft` |
| `amber-*` | `warning`, `warning-soft` |
| `zinc-*`, `purple-*`, `indigo-*` | `info`, `muted`, `accent` según el estado |

## Componentes

| Actual | Nuevo |
| --- | --- |
| `Navigation` (barra lateral y barra inferior) | `Sidebar` + `BottomNav` |
| `AuthShell` | `Card` + `Logo` + `Field` |
| Botones sueltos con clases repetidas | `Button` (variantes) |
| Inputs, textareas y select con clases repetidas | `Field` + `Input` / `Textarea` / `Select` |
| Cajas de error y éxito | `Alert` |
| Pastillas de categoría, etiquetas y sugerencias | `Chip`, `Tabs`, `Badge` |
| Tarjeta de reflexión (diario y favoritos, duplicada) | `ReflectionCard` |
| Tarjeta de cuaderno | `CuadernoCard` |
| Tarjeta de viaje (inicio, viajes, admin) | `JourneyCard` |
| Modal «Crear un cuaderno» | `Dialog` en escritorio, `Sheet` en móvil |
| `JourneyPreviewModal` | `Dialog` grande en escritorio, `Sheet` en móvil |
| `window.confirm`, «Confirmar» inline | `Dialog` / `Sheet` de confirmación con `Button variant="destructive"` |
| Tabla de usuarios | `DataList` |
| Tarjetas KPI de admin y estadísticas de perfil | `Stat` |
| `animate-pulse` suelto | `Skeleton` |

## Decisiones de implementación
- Añadir `@custom-variant dark (&:where(.dark, .dark *))` en `globals.css` si se mantiene `dark:` de Tailwind; con los tokens nuevos no hace falta ninguna utilidad `dark:`.
- Excluir `/fonts/` del matcher de `proxy.ts` para que Bernstein cargue sin sesión.
- Adoptar shadcn/ui con estos nombres de token (`components.json` + `cn()`): los nombres ya coinciden.
