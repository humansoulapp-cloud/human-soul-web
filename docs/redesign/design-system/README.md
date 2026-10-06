HumanSoul is a personal journal and a collection of guided journeys. The system is built to feel calm: warm paper, sage, serif headings and plenty of air. All user-facing content is in English, in a quiet tone.

## Content fundamentals

- Address the user as "you", in short, calm sentences. No exclamation marks, no emoji, no urgency. Brand examples: "A quiet place to notice yourself.", "No streaks. No scores. No pressure.", "Private by default.", "Whenever you're ready."
- Never introduce streaks, scores, badges or consistency counters. The onboarding promises the opposite.
- Use sentence case for buttons and labels ("Save reflection", not "Save Reflection"). Screen titles and product names keep the existing title case ("Your Journals", "Guided Journeys").
- Buttons say what happens: verb + object ("Create Journal", "Save Reflection", "Publish Now"). Avoid "OK" and "Submit".
- Errors say what happened and what to do, without apology: "Could not save your reflection. Your text is still here; try again."
- Fixed vocabulary: **Journal** (a user's collection of reflections), **Reflection** (one entry), **Journey** (a multi-day guided path), **Favorites**. Do not mix in "diary", "notebook" or "entry".
- Dates use US long format ("September 12, 2026"); in tables and compact cards, "Sep 12, 2026".

## Visual foundations

- **Color.** Page background is `background`, text is `foreground`, secondary text is `muted-foreground`. Raised surfaces use `card`; floating ones use `popover`. The main action is always `primary` with `primary-foreground` text; never use it for decoration. `brand` (the original sage) only fills decorative shapes and never carries text on `background` in light.
- **States.** Error uses `destructive` and `destructive-soft`, success `success` and `success-soft`, pending `warning` and `warning-soft`, info or draft `info` and `info-soft`. Every state carries an icon or a word, never color alone.
- **Highlight.** `accent` with `accent-foreground` marks the active item, the hovered row, and hovered chips or tabs.
- **Typography.** Headings use Newsreader (`text-display`, `text-h1` to `text-h4`), always weight 400; it is a reading serif made for long text, which suits reflections. Body uses Source Sans 3: `text-body` by default, `text-body-lg` for writing and reading reflections, `text-body-sm` for hints and dates. `text-caption` and `text-overline` (12px) only for counters, badges and categories. Running text never goes below 14px. DM Sans and Bernstein appear only in the wordmark (`font-wordmark`, `font-wordmark-serif`). Both Newsreader and Source Sans 3 load from Google Fonts; Bernstein ships as a file.
- **Spacing.** Scale `space-1` to `space-8` (4 to 64px). Card padding: `space-4` on mobile, `space-5` from 640px. Page side margin: `space-4` on mobile, `space-6` on desktop.
- **Radius.** Fields and buttons `radius-md`; cards `radius-lg`; sheets, dialogs and the sidebar `radius-xl`; chips, avatars and badges `radius-full`.
- **Shadow.** `shadow-sm` on cards, `shadow-md` on hover, `shadow-lg` on dialogs and sheets. Borders use `border`; controls use `input`.
- **Focus.** A solid 2px `ring` with a 2px offset on every interactive element. Never remove it.
- **Touch.** Every control is at least 44px tall; bottom navigation items are 52px.
- **Motion.** 150ms transitions on color, border and shadow. Honor `prefers-reduced-motion`: no spinning or pulsing.
- **Imagery.** Journey covers sit above the card in 16:10, never with text on top. Reflection photos use `radius-md` and a 240px maximum height.
- **Themes.** Light and dark share the same token names. Every text color meets 4.5:1 on the surfaces its note lists, in both themes. In light, `primary` is a deep sage; in dark it is the brand sage with dark text.

## Iconography

Lucide-style stroke icons (24px grid, stroke 2, round caps), available by name in `Icon`. Base size 20px; 16px inside chips and badges; 28px inside empty states. They inherit text color (`currentColor`). No emoji and no filled icons, except the favorite heart, which fills when active.

## Brand

The wordmark is "Human" in DM Sans 500 plus "Soul" in Bernstein, on one line, in `foreground`. Use the `Logo` component. `assets/Logos/logo.svg` is the original mark in dark ink: use it only on light backgrounds; on dark backgrounds use `Logo`.

## How to build

- Use only the tokens and components in this system. Do not introduce loose colors, radii or sizes.
- Desktop: sidebar (`Sidebar`). Mobile: bottom navigation (`BottomNav`). Tables become cards (`DataList`) and modals become sheets (`Sheet`). See "Responsive".
- Every screen that loads data defines four states: with data, loading (`Skeleton`), empty (`EmptyState`) and error (`ErrorState`). See "States".
