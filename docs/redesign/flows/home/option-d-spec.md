# Option D: Writing Studio (final spec)

Desktop only. Dark theme, Public Sans everywhere. Built from Option C.

Base concept: **Writing Studio** (24.5 points). Grafts: "Saving to" label, Cmd/Ctrl+Enter hint, Open in full editor, deep links, memory safeguards and fallback chain, offline/save-error Alerts, time-aware copy, in-place confirmation, sticky toolbar, short-viewport media query, stretched journey link, date + weekday meta.

## 0. Principles (the tie-breakers)

1. **Weight follows frequency.** The studio (needs 1 and 2) is the biggest and only large filled surface. The journey card (need 3) is the second filled surface. The memory (need 4) is the same family but quieter. Recently is plain text with hairline rules.
2. **One sage action.** "Save reflection" is the only filled `--primary` control. Sage is used only for:
   - the question overline
   - the progress fill
   - the current nav icon
   - Save
   - the transient save-confirmation check
3. **Nothing is counted.** The only number on the page is "Day 3 of 7". There are no streaks, word counts, timers, percentages, badges or time estimates.
4. **Writing is never at risk.** The draft is shared with `/journal/new`. Rail data failing or loading never blocks the editor. Save never navigates away.
5. **C's shell stays.** The sidebar is the same 248 px with the same nav pattern. There is no masthead and no other page changes, with one exception: on Home, "New reflection" becomes `secondary` (see 3.1).

---

## 1. Board and file

- Size: **1440 x 1120**. `data-props='{"$preview":{"width":1440,"height":1120}}'`
- Root:
  ```html
  <div class="optc" data-theme="dark" style="position:relative; width:1440px; min-height:1120px; display:flex; background:var(--background); color:var(--foreground); font-family:var(--font-sans)">
  ```
- Root children, in order:
  1. skip link
  2. sidebar
  3. `<main>`
- `renderVals()`:
  ```js
  { yes:true, logo:24, i16:16, i20:20, recent:[…3 items, see 3.6] }
  ```
- Helmet contains:
  - the Public Sans Google Fonts link (400, 500, 600, 700)
  - a `<style>` holding `body{margin:0}`, the `.optc` remap, `.optc .hs-logo-human{font-weight:600}`, and the class rules in section 6
- Everything else is inline style.

## 2. Grid (exact px)

| Zone | Rule | Result at 1440 |
|---|---|---|
| Sidebar | `width:248px; flex:none; box-sizing:border-box; padding:32px 20px 24px; border-right:1px solid var(--border); display:flex; flex-direction:column; gap:32px`. Stretches to board height. In the product: `position:sticky; top:0; height:100vh`. | x 0 to 248 |
| Main | `flex:1; min-width:0; box-sizing:border-box; padding:32px 48px 64px` | 1192 wide, content x 296 to 1392 (1096) |
| Content grid | `max-width:1280px; margin:0 auto; display:grid; grid-template-columns:repeat(12,minmax(0,1fr)); column-gap:32px; row-gap:32px; align-items:start` | 12 columns of **62 px**, gutter 32 |

Spans:
- 8 columns = 720 px
- 4 columns = 344 px
- 12 columns = 1096 px

Above 1600 px wide, the 1280 cap **centres** the content (`margin:0 auto`), so the side margins are equal and look intentional. At 1920 the margins are 196 px each.

### Vertical map at 1440

| Row | Region | grid-column | x | y |
|---|---|---|---|---|
| 1 | Header | 1 / -1 | 296 to 1392 | 32 to 76 (44) |
| 2 | Writing studio | 1 / span 8 | 296 to 1016 (720) | 108 to 765 (657) |
| 2 | Context rail | 9 / span 4 | 1048 to 1392 (344) | 108 to about 764 |
|   | ... Journey card | | | 108 to 520 (412) |
|   | ... gap 24 | | | |
|   | ... Memory card | | | 544 to 764 (220) |
| 3 | Recently (`margin-top:32px`, so 64 px rhythm) | 1 / -1 | 3 columns of 344 / 32 gutter | heading 829, items 869 to about 1042 |

**Decoupled heights (resolves mustFix 1).** The studio and the rail are both `align-self:start`. The editor has a fixed rest height (`min-height:304px`, about 10 lines). It is **not** stretched by the rail. The rest heights were chosen to match within about 1 px, so the bottom edges line up at rest.

When Ana writes more, the studio grows and the rail stays put. Recently moves down, which is correct, because she is writing.

Recently items line up with the columns above:
- Items 1 and 2: 344 + 32 + 344 = 720, which sits under the studio.
- Item 3 sits under the rail.

**Fold.** On a 1440 x 900 screen (about 790 px of viewport):
- Save sits at y 697 to 741.
- The journey CTA sits at y 456 to 500.
- The memory card is fully visible.
- The Recently heading at 829 is just below the fold, which invites a scroll.

**Short viewports.** `@media (max-height:820px){ .d-editor{min-height:176px} }` brings Save to y 569 to 613. This keeps it above the fold on 1366 x 768 and 1440 x 800 screens. In that state the rail is about 128 px taller than the studio. That is accepted, and Recently starts below the taller one.

**Below 1200 px wide** (out of scope): the rail stacks under the studio.

---

## 3. Regions, in DOM order

### 3.0 Skip link (first child of `.optc`)

```html
<a class="d-skip" href="#d-editor">Skip to writing</a>
```

- Visually hidden until it has focus (see section 6).
- When focused it shows at top 12 px, left 16 px, as a pill:
  - padding 10px 16px
  - `--radius-full`
  - background `var(--popover)`
  - text `var(--foreground)`, 500 14/20
  - outline 2px `var(--ring)`

### 3.1 Sidebar (`<div class="d-side">`, not `<aside>`, so there is no extra complementary landmark)

From top to bottom:

1. **Logo**
   ```html
   <a href="/dashboard" aria-label="HumanSoul home" style="display:flex; align-items:center; min-height:44px; padding:0 12px">
     <x-import component-from-global-scope="HumanSoul.Logo" size="{{logo}}"></x-import>
   </a>
   ```
   This 44 px row lines up with the main header row (y 32 to 76).

2. **New reflection** (y 108 to 152)
   ```html
   <x-import component-from-global-scope="HumanSoul.Button" variant="secondary" icon="pen" full="{{yes}}" href="/journal/new">New reflection</x-import>
   ```
   - md size, 44 px tall.
   - It is `secondary` so that Save is the only filled sage control.
   - It opens the **same draft** as the studio.
   - Other pages keep C's `default` variant until the owner decides otherwise (open question).

3. **Primary nav**
   ```html
   <nav aria-label="Primary" style="display:flex; flex-direction:column; gap:2px">
   ```
   It holds 4 links, each `<a class="d-nav" href="…">` containing `<x-import component-from-global-scope="HumanSoul.Icon" name="…" size="{{i20}}"></x-import>` followed by the label:
   - Home: `href="/dashboard"`, `aria-current="page"`, icon `home`
   - Journal: `/journal`, icon `book`
   - Journeys: `/journeys`, icon `compass`
   - Favorites: `/favorites`, icon `heart`

   There are no counts and no list of journals.

4. **Admin panel** (role=admin only; Ana does not see it)
   - An `<a class="d-nav" href="/admin">` with the `shield` icon.
   - It sits above Profile and is styled like `.hs-nav-item-admin`: `border:1px dashed var(--primary); color:var(--primary)`.

5. **Profile**
   ```html
   <a class="d-nav" href="/profile" style="margin-top:auto; min-height:56px">
   ```
   It contains:
   - `<x-import component-from-global-scope="HumanSoul.Avatar" name="Ana Ruiz" size="sm"></x-import>`
   - a column span with:
     - "Ana Ruiz" at 500 14/20, `var(--foreground)`
     - "Profile & settings" (`text-caption`, weight 400, `var(--muted-foreground)`)

### 3.2 Header (row 1)

`<header>` sits inside `<main>`, so it is not a banner landmark. Style: `grid-column:1 / -1; min-height:44px; display:flex; align-items:center; justify-content:space-between; gap:24px`.

**Left** (`display:flex; align-items:baseline; gap:16px`):

```html
<h1 style="margin:0; font:600 24px/32px var(--font-sans); letter-spacing:-0.01em">Good evening, Ana.</h1>
<span class="text-body-sm" style="color:var(--muted-foreground)">Tuesday, October 6</span>
```

The greeting is time-aware (needs the user's timezone):

| Time | Greeting |
|---|---|
| 05:00 to 11:59 | "Good morning, Ana." |
| 12:00 to 17:59 | "Good afternoon, Ana." |
| 18:00 to 04:59 | "Good evening, Ana." |

**Right:**

```html
<x-import component-from-global-scope="HumanSoul.Button" variant="ghost" size="sm" icon="clock" aria-haspopup="dialog" aria-expanded="false">Reminder at 9:00 PM</x-import>
```

- It opens a popover (`var(--popover)`, radius 16, padding 16, `--shadow-md`) containing:
  - `HumanSoul.Switch` with the label "Gentle reminder"
  - `HumanSoul.Select` with the label "Time" and half-hour options, default 9:00 PM
- When the reminder is off, the button label reads "Set a gentle reminder".
- Its right edge is at x 1392, aligned with the rail.

**Hierarchy fix:** the h1 is 24 px and the question is 36 px, a decisive 12 px step. The greeting is never louder than the prompt.

### 3.3 Writing studio (row 2, `grid-column:1 / span 8`)

```html
<section id="d-studio" class="d-studio" aria-labelledby="d-question">
```

Style: `background:var(--card); border:1px solid var(--border); border-radius:24px; padding:40px 40px 0; display:flex; flex-direction:column`. Rest size is 720 x 657. Inner width is 640.

Contents, top to bottom:

1. **Top row** (`display:flex; align-items:center; justify-content:space-between; min-height:36px`)
   - Left: `<p id="d-q-label" class="text-overline" style="margin:0; color:var(--primary)">Tonight's question</p>`. The label is time-aware:
     | Time | Label |
     |---|---|
     | 05:00 to 11:59 | "This morning's question" |
     | 12:00 to 17:59 | "Today's question" |
     | 18:00 to 04:59 | "Tonight's question" |
   - Right group (`display:flex; gap:4px`):
     ```html
     <x-import component-from-global-scope="HumanSoul.Button" variant="ghost" size="sm" icon="sparkles">Another question</x-import>
     <x-import component-from-global-scope="HumanSoul.Button" variant="ghost" size="icon-sm" icon="arrowUpRight" aria-label="Open in full editor" href="/journal/new"></x-import>
     ```
     "Open in full editor" carries the draft and the current question across.

2. **Question** (16 px gap)
   ```html
   <div aria-live="polite">
     <h2 id="d-question" style="margin:0; max-width:600px; font:500 36px/44px var(--font-sans); letter-spacing:-0.022em; text-wrap:balance">What did you notice today that you usually overlook?</h2>
   </div>
   ```
   - Two lines, 88 px tall. This is the **largest type on the page**.
   - The live region is on the wrapper, not on the h2.
   - Cap: 2 lines. Prompts are curated so they never exceed about 60 characters.

3. **Helper** (8 px gap)
   ```html
   <p id="d-helper" class="text-body" style="margin:0; color:var(--muted-foreground)">Answer it, or write about whatever is on your mind.</p>
   ```

4. **Alert slot** (only when needed, 16 px above the editor; nothing is drawn at rest):
   - Offline:
     ```html
     <x-import component-from-global-scope="HumanSoul.Alert" variant="info" icon="wifiOff">You're offline. Your words are kept on this device and will save when you're back.</x-import>
     ```
   - Save error (`role="alert"`):
     ```html
     <x-import component-from-global-scope="HumanSoul.Alert" variant="destructive">Couldn't save just now. Your words are still here. Try again.</x-import>
     ```
     "Try again" is a `link` Button.

5. **Editor** (32 px gap)
   ```html
   <textarea id="d-editor" class="d-editor" aria-label="Your reflection" aria-describedby="d-question d-helper" placeholder="Start with one sentence. Only you will read this."></textarea>
   ```
   - Borderless. It sits directly on the card, which acts as the paper.
   - Type: 400 18/30.
   - `min-height:304px` at rest. It auto-grows with content (`field-sizing:content`, with a JS fallback) and never scrolls internally. The page scrolls instead.
   - It does **not** autofocus on load.
   - Clicking any empty part of the studio focuses the textarea.

6. **Toolbar** (24 px gap)
   ```html
   <div class="d-toolbar">
   ```
   Style: `position:sticky; bottom:0; z-index:1; background:var(--card); border-top:1px solid var(--border); padding:16px 0 24px; display:flex; align-items:center; justify-content:space-between; gap:12px`. Height 85.

   It pins to the bottom of the viewport only while the studio's bottom is off-screen, so Save is always reachable during long writing.

   - **Left** (`display:flex; align-items:center; gap:4px`):
     ```html
     <span class="text-body-sm" style="color:var(--muted-foreground); margin-right:4px">Saving to</span>
     <x-import component-from-global-scope="HumanSoul.Button" variant="ghost" size="sm" icon="book" aria-label="Saving to Morning Pages. Change journal" aria-haspopup="listbox" aria-expanded="false">Morning Pages</x-import>
     <x-import component-from-global-scope="HumanSoul.Button" variant="ghost" size="icon-sm" icon="camera" aria-label="Add a photo"></x-import>
     ```
     Tags are not shown here. They live in the full editor.

   - **Right** (`display:flex; align-items:center; gap:16px`):
     - Status slot:
       ```html
       <span class="text-caption" style="display:inline-flex; align-items:center; gap:6px; font-weight:400; color:var(--muted-foreground)">
         <x-import component-from-global-scope="HumanSoul.Icon" name="lock" size="{{i16}}"></x-import>
         <span>Only you can read this</span>
       </span>
       ```
       The text changes with state; the lock icon stays constant, so privacy is always signalled:
       | State | Text |
       |---|---|
       | Editor not focused | "Only you can read this" |
       | Editor focused | "⌘ Enter to save" on Mac, "Ctrl + Enter to save" elsewhere |
       | For 2 s after an autosave | "Draft saved" |
       The slot is **not** an aria-live region.
     - Save:
       ```html
       <x-import component-from-global-scope="HumanSoul.Button">Save reflection</x-import>
       ```
       Variant `default`, md, 44 px, no icon. It renders a `<button type="button">` with **no href**.

**Save behaviour**
- **Empty editor:**
  - Focus moves to the editor.
  - A visually hidden `aria-live="polite"` region announces "Your page is empty. Start with one sentence."
  - There is never a disabled state.
- **With text:**
  - The button shows the DS `loading` state.
  - Then the studio body (question to toolbar) is replaced **in place** at the same height by:
    ```html
    <div role="status" tabindex="-1">
    ```
    Focus moves to this container. Its contents (`display:flex; flex-direction:column; gap:8px`):
    - a `check` Icon at 20 px in `var(--primary)`
    - "Saved to Morning Pages." (500 20/26, `var(--foreground)`)
    - "Rest well, Ana." (`text-body`, muted). In the morning: "Have a gentle day, Ana." In the afternoon: "Take care, Ana."
    - a row (gap 8):
      - `HumanSoul.Button variant="ghost" size="sm" href="/journal?entry=…"` "View"
      - `HumanSoul.Button variant="secondary" size="sm" icon="pen"` "Write another"
  - There is no toast; the DS has none.
- The saved reflection records the question that was showing. The new item fades in as the first item in Recently (200 ms opacity, no transform).

**Other studio behaviour**
- **"Another question"** crossfades the h2 (150 ms). It **never** touches typed text.
- **Journal picker** opens a listbox popover:
  - Options: Morning Pages, Gratitude & Joy, Deep Questions, Travel & Wonder, Life Lessons. No counts.
  - The default is the last-used journal.
  - Changing it never clears the draft.
- **Camera** opens the file picker. The photo shows as a 72 x 72 thumbnail (radius 8) between the editor and the toolbar, with a ghost icon-sm `x` labelled "Remove photo".
- **Draft:**
  - Autosaves 1.5 s after typing stops.
  - It is stored locally and on the server in one shared store used by Home, `/journal/new` and the sidebar button.

**Keyboard:** Cmd/Ctrl+Enter saves, and Esc blurs the editor. There are **no single-key shortcuts** (WCAG 2.1.4).

### 3.4 Your journey (rail, first)

The rail wrapper is `<div style="grid-column:9 / span 4; display:flex; flex-direction:column; gap:24px; min-width:0">`. The journey card is specified in section 4.

### 3.5 Memory (rail, second, 344 x 220)

```html
<section aria-labelledby="d-memory" class="d-memory">
```

Style: `position:relative; border:1px solid var(--border); border-radius:16px; padding:24px; background:transparent; display:flex; flex-direction:column`.

It is outline-only: the same 1 px `var(--border)` family as the studio and journey card, with no fill, so it reads as quieter.

1. **Heading row** (`min-height:24px; display:flex; align-items:center`):
   ```html
   <h2 id="d-memory" class="text-overline" style="margin:0; color:var(--muted-foreground)">One month ago</h2>
   ```

2. **Hide control** (positioned at `top:18px; right:14px`):
   ```html
   <x-import component-from-global-scope="HumanSoul.Button" class="d-hide" variant="ghost" size="icon-sm" icon="x" aria-label="Hide this memory for today"></x-import>
   ```
   - At rest it is `opacity:0` but stays focusable.
   - It shows on card `:hover`, on `:focus-within`, and on its own `:focus-visible`.
   - When used, the card collapses and focus moves to the "Recently" heading link.

3. **Quote** (12 px gap):
   ```html
   <blockquote style="margin:12px 0 0"><p style="margin:0; font:400 16px/24px var(--font-sans); color:color-mix(in srgb,var(--foreground) 88%,transparent)">“I walked home without headphones and heard the neighbour's daughter practising scales. Somehow it was the best part of my day.”</p></blockquote>
   ```
   Four lines.

4. **Footer row** (16 px gap; `display:flex; align-items:center; justify-content:space-between; min-height:24px`):
   - Left (`display:inline-flex; align-items:center; gap:8px`):
     - `<span class="text-caption" style="font-weight:400; color:var(--muted-foreground)">Sunday, September 6</span>`
     - `HumanSoul.Icon name="heart" size="{{i16}}" label="Favorite"`, coloured `var(--muted-foreground)`
   - Right: `<a class="d-link-quiet" href="/journal?entry=rf_0906">Read it again</a>`. This uses the quiet style, not sage, and deep-links to the entry.

**Source order:**
1. Favorites from one month ago
2. Any entry from one month ago
3. One week ago
4. One year ago
5. A random favorite

The overline changes to match: "One week ago", "One year ago" or "From your favorites". If nothing qualifies, the card is omitted.

There is also a Profile setting, "Show memories on Home" (Switch, on by default).

### 3.6 Recently (row 3)

```html
<section aria-labelledby="d-recent" style="grid-column:1 / -1; margin-top:32px">
```

**Heading row** (`display:flex; align-items:baseline; justify-content:space-between; margin-bottom:16px`):
- `<h2 id="d-recent" class="text-overline" style="margin:0; color:var(--muted-foreground)">Recently</h2>`
- `<a class="d-link-quiet" href="/journal">See all in Journal</a>`

**List** (`<ul role="list" style="list-style:none; margin:0; padding:0; display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); column-gap:32px">`):

```html
<sc-for list="{{recent}}" as="r" hint-placeholder-count="3">
  <li><a class="d-recent" href="{{r.href}}">…</a></li>
</sc-for>
```

Each item (`.d-recent` is a flex column, see section 6):
1. **Meta row** (`display:flex; align-items:center; justify-content:space-between; min-height:20px`):
   - `<span class="text-body-sm"><span style="font-weight:500; color:var(--foreground)">{{r.date}}</span><span style="color:var(--muted-foreground)"> · {{r.day}}</span></span>`
   - `<sc-if value="{{r.fav}}" hint-placeholder-val="{{false}}">` containing a heart Icon (16, label "Favorite", `var(--muted-foreground)`)
2. 12 px gap.
3. `<p class="d-excerpt">{{r.text}}</p>`, clamped to 4 lines.
4. 8 px gap.
5. `<span class="text-caption" style="font-weight:400; color:var(--muted-foreground)">{{r.journal}}</span>`

Data:

| href | date | day | journal | fav | text |
|---|---|---|---|---|---|
| `/journal?entry=rf_1005` | Yesterday | Monday | Morning Pages | false | I keep saying I don’t have time to read, but I scrolled for forty minutes before bed. It isn’t about time. It’s about what feels easy when I’m tired. |
| `/journal?entry=rf_1003` | Oct 3 | Saturday | Becoming More Human · Day 2 | true | Noticed how differently I speak to strangers than to my own family. More patient with people I’ll never see again. Want to sit with that. |
| `/journal?entry=rf_0929` | Sep 29 | Tuesday | Travel & Wonder | false | The train out of Lisbon was late and nobody seemed to mind. An old man shared his oranges with the whole carriage. |

---

## 4. Journey card (rail, 344 x 412)

```html
<section aria-labelledby="d-journey">
  <article class="d-journey" style="position:relative; background:var(--card); border:1px solid var(--border); border-radius:16px; overflow:hidden; display:flex; flex-direction:column">
```

The border is a real border, not an inset shadow, so it frames the image. The radius is 16 here against the studio's 24: radius scales with surface size.

### Cover image

```html
<div class="d-cover" style="position:relative; aspect-ratio:16 / 9; background:var(--muted); overflow:hidden">
  <img src="/_blob/7e25d393e9682e97a36b34c1947f936b" alt="Cover image for Becoming More Human">
  <span aria-hidden="true" style="position:absolute; inset:0; background:linear-gradient(180deg, transparent 55%, var(--card) 100%)"></span>
</div>
```

- Rendered at 342 x 192.
- The image has `width:100%; height:100%; object-fit:cover; object-position:50% 60%; display:block; filter:brightness(.9)`. The brightness filter keeps the cover from being the brightest thing above the fold.
- The span is a decorative fade into the card body, so there is no seam.
- **No text overlays the image**, so no contrast scrim is required. If any label is ever placed on the cover, it must get a scrim of `color-mix(in srgb,var(--background) 60%,transparent)`.
- **No hover zoom.**
- Each journey stores its own `object-position`. Cover-art guideline: mid-tone skies, subject in the upper 55%.
- If the image fails to load: the `var(--muted)` block with a centred `compass` Icon (24, `var(--muted-foreground)`).

### Body

`padding:20px 24px 20px; display:flex; flex-direction:column`. Inner width 294.

1. **Heading row** (`display:flex; align-items:center; justify-content:space-between; min-height:24px`):
   - `<h2 id="d-journey" class="text-overline" style="margin:0; color:var(--muted-foreground)">Your journey</h2>`
   - `<a class="d-link-quiet" href="/journeys" style="position:relative; z-index:1">All journeys</a>`
     - 14/20 with a 24 px hit area.
     - It sits above the stretched layer, so the targets are not nested.

2. **Title** (8 px gap):
   ```html
   <h3 style="margin:0; font:600 20px/26px var(--font-sans); letter-spacing:-0.01em; white-space:nowrap; overflow:hidden; text-overflow:ellipsis">Becoming More Human</h3>
   ```

3. **Up next** (4 px gap):
   ```html
   <p class="text-body-sm" style="margin:0; color:var(--muted-foreground)">Up next: <span style="color:var(--foreground)">The routines that carry you</span></p>
   ```

4. **Progress line** (16 px gap; `display:flex; align-items:center; gap:12px; min-height:20px`):
   ```html
   <div role="progressbar" aria-label="Becoming More Human" aria-valuemin="0" aria-valuemax="7" aria-valuenow="3" aria-valuetext="Day 3 of 7"
        style="flex:1; height:4px; border-radius:9999px; background:color-mix(in srgb,var(--foreground) 14%,transparent); overflow:hidden">
     <div style="width:42.857%; height:100%; border-radius:inherit; background:var(--primary)"></div>
   </div>
   <span class="text-label" aria-hidden="true" style="color:var(--foreground); white-space:nowrap">Day 3 of 7</span>
   ```
   - It is **one continuous solid line**. There are no dots, segments, two-tone fill, knob, percentage or animation.
   - The fill is 3/7 because it marks where she is, and that matches the label.
   - Sage against the 14% track is 4.31:1, above the 3:1 non-text minimum.
   - The label is 500 14/20 in foreground, so the page's only number is legible.

5. **CTA** (16 px gap):
   ```html
   <x-import component-from-global-scope="HumanSoul.Button" variant="outline" full="{{yes}}" href="/journeys/becoming-more-human?day=3" aria-label="Continue Day 3 of Becoming More Human">Continue Day 3</x-import>
   ```
   - md, 44 px, 294 wide.
   - The accessible name begins with the visible text (WCAG 2.5.3).

### Whole-card target

The CTA is the card's single link and single tab stop. Its `::after` stretches over the whole card (`.d-journey .hs-btn::after`), so the cover and title are clickable too. This works because `.hs-btn` has no `position` rule; this was checked in the bundle.

Hover and focus states are in section 6.

### States

| State | Line | Label | Copy | CTA |
|---|---|---|---|---|
| Day 3 written today | 3/7 | "Day 3 of 7 · written today" | "Day 4 is ready whenever you are" | ghost "Read today's entry" |
| Finished | full | "7 of 7 days" | "You walked the whole journey." | outline "Look back". No badge, no confetti. |
| No active journey | none | caption "7 days · one question a day" | Cover of "The Art of Paying Attention". Overline "A journey to begin". Copy "Discover the extraordinary hidden within the ordinary." | outline "Preview journey" |
| Several active | | | Show the most recently touched journey. | |

If journeys unlock daily, the "Day 3 written today" copy reads "Day 4 opens tomorrow". This is an assumption.

---

## 5. Type and colour

Public Sans only.

| Role | Spec | Token / colour |
|---|---|---|
| Question h2 (largest) | 500 36/44, -0.022em, balance, max-width 600 | `--foreground` |
| Greeting h1 | 600 24/32, -0.01em | `--foreground` |
| Journey h3, confirmation | 600 / 500 20/26, -0.01em | `--foreground` |
| Editor | 400 18/30 (measure 640 px, about 68 characters) | `--foreground`; caret `--primary`; placeholder `--muted-foreground` |
| Helper | `text-body` 16/24 | `--muted-foreground` |
| Memory quote, excerpts | 400 16/24 | `color-mix(in srgb,var(--foreground) 88%,transparent)` |
| Nav, links, buttons, "Day 3 of 7" | 500 14/20 | nav `--muted-foreground` (current `--foreground`); quiet links `--muted-foreground` |
| Meta, date | 400 14/20 (`text-body-sm`) | `--muted-foreground` |
| Overlines | `text-overline` 600 12/16, uppercase | Question overline `--primary` (about 6.5:1 on card); all others `--muted-foreground` |
| Captions | `text-caption` 12/16 at weight 400 | `--muted-foreground` |

The scale has seven steps: 36, 24, 20, 18, 16, 14, 12. Nothing is smaller than 12 px, and nothing is italic.

Surfaces:
- Page: `--background`
- Studio and journey card: `--card`
- Memory: transparent
- Popovers: `--popover`
- Every edge: 1 px `--border`
- Focus: `--ring`

There are no tinted surfaces, no glows, no glass and no gradients other than the cover fade.

Spacing uses the spacing tokens throughout: 4, 8, 12, 16, 24, 32, 48, 64. The one deliberate exception is the 20 px used for paddings inside the journey body and the sidebar, carried over from C.

Radii: 12 (nav, buttons), 16 (journey card, memory, popovers), 24 (studio).

## 6. Helmet class rules (complete list)

```css
.d-skip:not(:focus){position:absolute;width:1px;height:1px;overflow:hidden;clip-path:inset(50%);white-space:nowrap}
.d-skip:focus{position:absolute;z-index:20;top:12px;left:16px;padding:10px 16px;border-radius:9999px;background:var(--popover);color:var(--foreground);font:500 14px/20px var(--font-sans);text-decoration:none;outline:2px solid var(--ring);outline-offset:2px}
.d-nav{display:flex;align-items:center;gap:12px;min-height:44px;padding:0 12px;border-radius:12px;color:var(--muted-foreground);text-decoration:none;font:500 14px/20px var(--font-sans)}
.d-nav:hover{color:var(--foreground);background:color-mix(in srgb,var(--foreground) 5%,transparent)}
.d-nav[aria-current="page"]{color:var(--foreground);background:color-mix(in srgb,var(--foreground) 7%,transparent)}
.d-nav[aria-current="page"] .hs-icon{color:var(--primary)}
.d-studio{transition:border-color .15s,box-shadow .15s}
.d-studio:focus-within{border-color:var(--ring);box-shadow:0 0 0 4px color-mix(in srgb,var(--ring) 14%,transparent)}
.d-editor{display:block;width:100%;box-sizing:border-box;min-height:304px;field-sizing:content;resize:none;border:0;outline:none;padding:0;background:transparent;color:var(--foreground);font:400 18px/30px var(--font-sans);caret-color:var(--primary)}
.d-editor::placeholder{color:var(--muted-foreground)}
.d-toolbar{position:sticky;bottom:0;z-index:1;background:var(--card)}
.d-journey .hs-btn::after{content:"";position:absolute;inset:0;border-radius:16px}
.d-journey{transition:border-color .15s}
.d-journey:hover{border-color:color-mix(in srgb,var(--primary) 45%,var(--border))}
.d-journey:hover .hs-btn-outline{background:var(--accent);color:var(--accent-foreground);border-color:var(--primary)}
.d-journey:focus-within{border-color:var(--ring)}
.d-hide{position:absolute;top:18px;right:14px;opacity:0;transition:opacity .15s}
.d-memory:hover .d-hide,.d-memory:focus-within .d-hide{opacity:1}
.d-recent{display:flex;flex-direction:column;padding-top:20px;border-top:1px solid var(--border);color:inherit;text-decoration:none;transition:border-color .15s}
.d-recent:hover{border-top-color:var(--input)}
.d-recent:hover .d-excerpt{color:var(--foreground)}
.d-excerpt{margin:12px 0 8px;font:400 16px/24px var(--font-sans);color:color-mix(in srgb,var(--foreground) 88%,transparent);display:-webkit-box;-webkit-line-clamp:4;-webkit-box-orient:vertical;overflow:hidden}
.d-link-quiet{display:inline-block;padding:2px 0;color:var(--muted-foreground);font:500 14px/20px var(--font-sans);text-decoration:none}
.d-link-quiet:hover{color:var(--foreground);text-decoration:underline;text-underline-offset:3px}
:is(.d-nav,.d-link-quiet,.d-recent):focus-visible{outline:2px solid var(--ring);outline-offset:2px;border-radius:8px}
@media (max-height:820px){.d-editor{min-height:176px}}
@media (prefers-reduced-motion:reduce){.d-studio,.d-journey,.d-recent,.d-hide{transition:none}}
```

Notes on these rules:
- `.d-studio:focus-within` gives the studio a full-strength `--ring` border plus a 4 px halo. This compensates for the textarea's `outline:none`.
- `.d-journey .hs-btn::after` is the stretched link that makes the whole card one target.
- `.d-journey:hover .hs-btn-outline` mirrors the DS outline hover on the CTA when the card is hovered.
- `.d-journey:focus-within` turns the card border to `--ring`; the CTA also shows its own DS focus outline.
- `.d-hide` uses opacity, not `display:none`, so it stays reachable by keyboard.
- `.d-recent:hover` uses `--input` for the hairline, not sage, so the sage budget holds.
- DS controls bring their own focus outline (2 px `--ring`, 2 px offset).

## 7. States

- **Loading:**
  - DS Skeleton blocks: 2 question bars (600 x 36), the journey image block (342 x 192) plus 3 bars, the memory block, and 3 excerpt blocks.
  - The editor is usable immediately.
  - Sizes are exact, so there is no layout shift.
- **Rail error:** an inline `HumanSoul.ErrorState` inside the rail with a "Try again" button. Writing is never blocked.
- **New user with no reflections:**
  - Recently is replaced by `HumanSoul.Card variant="dashed"` spanning 1 / -1, reading "Your reflections will gather here. Come back to them whenever you like." (`text-body-sm`, muted).
  - There is no CTA, because the editor is the CTA.
  - The memory card is omitted.
- **Reminder off:** the header button reads "Set a gentle reminder".
- **Morning:** "Good morning, Ana.", "This morning's question", and "Have a gentle day, Ana." after save. There is no colour change.

## 8. Accessibility checklist

- **Landmarks:** `nav[aria-label="Primary"]` and `main`. The sidebar wrapper is a plain div, and the header is inside main.
- **Headings:**
  - One h1: "Good evening, Ana."
  - h2s in order: the question, "Your journey", "One month ago", "Recently".
  - One h3: the journey title.
  - Every section uses `aria-labelledby`.
- **Focus order:**
  1. Skip link
  2. Logo
  3. New reflection
  4. Nav links
  5. Profile
  6. Reminder
  7. Another question
  8. Open in full editor
  9. Editor
  10. Journal picker
  11. Photo
  12. Save
  13. All journeys
  14. Continue Day 3
  15. Hide memory
  16. Read it again
  17. See all in Journal
  18. Recently items
- **Focus on load:** none. The page starts at the document top, so screen-reader users get the h1 context. The skip link takes keyboard users to the editor in one keystroke.
- **Accessible names:**
  - The textarea is named "Your reflection" and described by the question and the helper.
  - Every icon-only button has an `aria-label`.
  - The picker and CTA labels contain their visible text.
  - Hearts are labelled "Favorite".
- **Live regions:**
  - Only the question wrapper (polite), the empty-save announcement (polite), the save confirmation (`role="status"`), and save errors (`role="alert"`).
  - The autosave status is **not** announced.
- **Progress:** `role="progressbar"` with min, max, now and `aria-valuetext="Day 3 of 7"`. The visible label is `aria-hidden`.
- **Targets:**
  - Primary controls are 44 px.
  - Compact ghost controls are 36 px.
  - Text links are at least 24 px tall.
  - The journey card is one 344 x 412 target.
- **Contrast:**
  - `--foreground` on `--card`: about 15:1.
  - `--muted-foreground` on `--card`: about 7:1.
  - `--primary` on `--card`: about 6.5:1.
  - Progress fill against the track: 4.31:1.
  - Studio focus ring (`--ring` on `--card`): above 3:1.
- **Colour alone:** never used to carry meaning. Progress always has its text label.
- **Motion:** only colour and opacity transitions (150 to 200 ms). Everything is off under `prefers-reduced-motion`.

## 9. Assumed data and build risks

1. **New data:**
   - a daily prompt plus a pool of alternates
   - per-user journey progress (current day, whether today's day is written)
   - one shared draft store
   - the last-used journal
   - a memory query using the fallback chain
   - a "Show memories on Home" setting
   - the reminder time from onboarding
   - the user's timezone
   - entry deep links via `/journal?entry=<id>` (no route exists today; the Journal page opens that entry)
   - a journey day link via `/journeys/[id]?day=3`
2. **Verify the DS Button:**
   - It forwards `aria-label`, `aria-haspopup` and `aria-expanded`.
   - It renders `<button>` when there is no `href`.
   - It accepts `class` (needed for `.d-hide`).
   If any of these fail, use a native element with `hs-btn hs-btn-ghost hs-btn-sm` classes.
3. **Rest-height match.** The studio is 657 and the rail is about 656, and both are top-aligned. If the memory quote wraps to 3 lines, the rail is 24 px shorter. That is acceptable; nothing is stretched.
4. **Short-viewport mode.** Under 820 px of viewport height the editor rests at 176 px and the rail is taller than the studio. This is intentional, so Save stays visible.
5. **Cover art** varies by journey: apply `brightness(.9)`, store a per-journey focal point, and follow the art guideline.
6. **"New reflection" variant.** It is `secondary` on Home. Confirm with the owner whether the other pages follow.
7. **`field-sizing:content`** needs a JS auto-grow fallback in browsers that lack it.
