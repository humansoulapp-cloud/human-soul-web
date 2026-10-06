# Migration from the current app

Equivalences between the repository's current tokens and components and this system.

## Tokens

| Current (`globals.css`) | New |
| --- | --- |
| `--bg-surface` | `background` |
| `--bg-surface-secondary` | `card` (and `sidebar`) |
| `--bg-surface-tertiary` | `secondary` |
| `--text-primary` | `foreground` |
| `--text-secondary` | `muted-foreground` |
| `--text-muted` | `muted-foreground` (merged: the previous tone failed contrast) |
| `--brand-primary` | `primary` (deeper sage in light) and `brand` (the original sage, decorative only) |
| `--brand-primary-hover` | derived inside the component, not a token |
| `--border-subtle` | `border` |
| `--border-strong` | `ring` and `input` |
| `--admin-*` | removed: the admin panel uses the shared tokens |
| `#D4A3A3`, `red-*` | `destructive`, `destructive-soft` |
| `#A3B8A7`, `emerald-*` | `success`, `success-soft` |
| `amber-*` | `warning`, `warning-soft` |
| `zinc-*`, `purple-*`, `indigo-*` | `info`, `muted`, `accent` depending on the state |

## Components

| Current | New |
| --- | --- |
| `Navigation` (sidebar and bottom bar) | `Sidebar` + `BottomNav` |
| `AuthShell` | `Card` + `Logo` + `Field` |
| Loose buttons with repeated classes | `Button` (variants) |
| Inputs, textareas and selects with repeated classes | `Field` + `Input` / `Textarea` / `Select` |
| Error and success boxes | `Alert` |
| Category pills, tags and suggestions | `Chip`, `Tabs`, `Badge` |
| Reflection card (Journal and Favorites, duplicated) | `ReflectionCard` |
| Journal card | `JournalCard` |
| Journey card (Home, Journeys, admin) | `JourneyCard` |
| "Create a Journal" modal | `Dialog` on desktop, `Sheet` on mobile |
| `JourneyPreviewModal` | Large `Dialog` on desktop, `Sheet` on mobile |
| `window.confirm`, inline "Confirm" | Confirmation `Dialog` / `Sheet` with `Button variant="destructive"` |
| Users table | `DataList` |
| Admin KPI cards and profile stats | `Stat` |
| Loose `animate-pulse` | `Skeleton` |

## Implementation notes
- Add `@custom-variant dark (&:where(.dark, .dark *))` to `globals.css` if Tailwind's `dark:` is kept; with the new tokens no `dark:` utility is needed.
- Exclude `/fonts/` from the `proxy.ts` matcher so Bernstein loads without a session.
- Adopt shadcn/ui with these token names (`components.json` + `cn()`): the names already match.
