# Screen states

Every screen that reads data from Supabase resolves four states. None is left half-done.

| State | Component | Rule |
| --- | --- | --- |
| With data | The screen's card or table | Default state. |
| Loading | `Skeleton` shaped like the content | No "Loading…" text. Same dimensions as the final content to avoid layout jumps. |
| Empty | `EmptyState` | Says what is missing and offers the first action. A search with no results is different from "nothing here yet". |
| Error | `ErrorState` or `Alert variant="destructive"` | `ErrorState` when the whole load fails; `Alert` when an action fails (save, delete). Always with "Try again". |

## Control states
Every control documents: default, hover, focus, disabled, error and loading (where they apply). A button's loading state keeps its label and shows a spinner; it does not change width.

## Sample messages
- Empty reflections: "No reflections yet. Take a few minutes today to write what's on your mind."
- Empty favorites: "You haven't marked any reflections as favorites yet. Tap the heart on any entry to save it here."
- Empty search: "Nothing matches “calm”. Try another word or tag."
- Load error: "We could not load your reflections. Check your connection and try again."
- Save error: "Could not save your reflection. Your text is still here; try again."
