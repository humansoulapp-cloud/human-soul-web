# Responsive: desktop and mobile

One breakpoint: **768px**. Below it is mobile; from 768px up is desktop. Design and review at 1440px and 390px.

| Element | Desktop (≥ 768px) | Mobile (< 768px) |
| --- | --- | --- |
| Navigation | Floating `Sidebar`, 256px, on the left, with "Write", light/dark mode and sign out at the bottom | Fixed `BottomNav` with 5 items (Home, Journal, Journeys, Favorites, Profile); "Write" becomes a floating `Button size="fab"`; dark mode, sign out and the Admin Panel link live in Profile |
| Content | Left margin of 304px (256 + 16 + 32), right margin `space-6` | Side margin `space-4`, 88px of room at the bottom for the bar |
| Modal | Centered `Dialog`, 448px | `Sheet` anchored to the bottom, full width, buttons stacked and full width |
| Table | `DataList` as a table | `DataList` as a stack of cards with actions at the foot |
| Grids | 2 or 3 columns (`space-5` gap) | 1 column (`space-3` gap) |
| Tabs and filters | `Tabs` on one row | `Tabs` scroll horizontally, no visible scrollbar |
| Forms | Column of at most 672px, centered | Full width, primary button full width |

## Admin
The admin panel uses the same tokens and components as the rest of the app (no separate palette). On desktop it has its own `Sidebar` with "Admin Panel", "Journeys" and "Users". On mobile, navigation is a menu in a `Sheet` opened from a menu button in the header.

## Rules
- A touch target is never below 44px.
- Content never overflows horizontally: wide things (tables, tabs) scroll on their own or become cards.
- Respect the device safe areas on the bottom bar.
