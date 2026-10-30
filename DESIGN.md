# AY Store — design

The tokens live in `src/styles/index.css`; this file says why they are what they are.

## Product

- **What it is:** an online order form for AY honor patches, for Pathfinder clubs in Malaysia. Orders go by email. There is no payment on the site.
- **Who buys:** anyone. Club leaders, parents and Pathfinders all use it like an ordinary online store. Most arrive knowing which honor they need, on a phone.
- **The job:** find honors, set quantities and send an order in under two minutes, then keep the order number.
- **Feel:** an official store. Clean, trustworthy and plain, like a supplier's catalogue. The patch pictures are the colour; the interface stays quiet.
- **Voice:** plain and polite. Short sentences, verbs first on buttons. The site says "we" for the people who handle orders. Prices read like `RM 4.00`.
- **Brand limits:**
  - The name is always "AY Store".
  - Words come from the project glossary (honor, not badge or product).
  - The site never copies the official Pathfinder emblem or uniform.
  - English only.

## Direction

- **Name:** Oxblood and stone.
- **Thesis:** an everyday store with a warm, grown-up face. A stone page with white rounded cards, a deep oxblood header and oxblood pill buttons with stone lettering. The patch pictures carry the rest of the colour.
- **Memorable thing:** the oxblood header with the big "AY Store" title, and the same oxblood pill on every action. On the dark theme the buttons turn rose, so the brand colour stays visible.
- **Reference:** the card and pill structure follows apple.com/shop; the feel is our own. Nothing is copied: no Apple fonts, logos or brand values.

## Palette

| Role                      | Light                                                      | Dark                                                    |
| ------------------------- | ---------------------------------------------------------- | ------------------------------------------------------- |
| page                      | `#F3F0EC` stone                                            | `#000000`                                               |
| card                      | `#FFFFFF`                                                  | `#1C1C1E`                                               |
| soft fill (stepper pill)  | `#ECE6E1`                                                  | `#2C2C2E`                                               |
| ink (text)                | `#1D1D1F` (14.8:1 on page)                                 | `#F5F5F7` (19.3:1)                                      |
| muted                     | `#55555A` (6.5:1 on page, 6.0:1 on soft fill)              | `#A1A1A6` (8.2:1 on page, 5.4:1 on soft fill)           |
| hairline                  | `#D2D2D7`                                                  | `#38383A`                                               |
| oxblood (header, buttons) | `#4A1520`; hover `#33101A`                                 | header `#2A0C12`                                        |
| stone (text on oxblood)   | `#F3F0EC` (13.0:1; 15.0:1 on hover)                        | `#F3F0EC` (15.9:1 on the header)                        |
| rose (dark buttons)       | not used                                                   | `#E8B4BC` (11.7:1 on page)                              |
| button                    | oxblood fill, stone text (13.0:1)                          | rose fill, oxblood text (8.2:1; hover `#F0C4CA`, 9.5:1) |
| errors                    | `#B91C1C` (5.7:1 on page)                                  | `#F87171` (6.2:1 on a card)                             |
| trash icon                | `#C62828` (4.5:1 on soft fill)                             | `#FF6B6B` (5.0:1 on soft fill)                          |
| Unavailable tag           | `#8A4B00` on `#FDF0DC` (6.1:1)                             | `#F5C26B` on `#3D2A0F`                                  |
| Removed note              | `#F3F0EC` on `#1D1D1F` (14.8:1)                            | `#F5F5F7` on `#3A3A3C` (10.4:1)                         |
| focus ring                | `#3B82F6` (3.2:1 on page, 3.7:1 on card, 4.0:1 on oxblood) | `#8AB4FF` (10.1:1 on page, 8.7:1 on the header)         |

- The Category mark colours stay as ruled (real patch backgrounds).
- Red is kept for errors and the trash icon only.
- Tan `#B89A7A` is not used: it is 2.6:1 on white, so never text.
- The focus ring is blue (`#3B82F6`) so it never matches the oxblood it sits on. It measures 2.97:1 on the soft fill, so the cart stepper has its own ring: oxblood in light (12.0:1 on the soft fill, 14.8:1 on a card) and `#8AB4FF` in dark (6.7:1 on the soft fill, 8.2:1 on a card).
- Print keeps the light values.
- A test (`src/styles/tokens.test.ts`) holds the listed text pairs at 4.5:1 and the listed icon and ring pairs at 3:1, in light, dark and print.

## Type

- For now, the system font stack: `system-ui, -apple-system, "Segoe UI", Roboto, sans-serif`. No web font is downloaded.
- Public Sans (OFL) is the intended face, added later.
- Big, bold screen titles; plain body text; prices in tabular figures.
- Exact sizes are in Spacing and sizes below.

## Layout

```
375 px                              desktop (1440)
AY Store                 [◐ v]      AY Store                             [◐ System v]
( ⌕ Search honors          )        ( ⌕ Search honors   )  [ All categories v ]
[ All categories v ]
┌──────────┐ ┌──────────┐           ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐
│  ( ◉ )   │ │  ( ◉ )   │           │ ( ◉ )  │ │ ( ◉ )  │ │ ( ◉ )  │ │ ( ◉ )  │
│Knot Tying│ │Camping I │           │Knot T. │ │Camp. I │ │First A.│ │Swimming│
│Outdoor   │ │Recreation│           │RM 4.00 │ │RM 4.00 │ │RM 4.00 │ │RM 4.00 │
│RM 4.00   │ │RM 4.00   │           │ (Add)  │ │(− 1 +) │ │ (Add)  │ │ (Add)  │
│  (Add)   │ │ (− 1 +)  │           └────────┘ └────────┘ └────────┘ └────────┘
└──────────┘ └──────────┘
( 3 items · RM 12.00    View cart )   sticky pill bar at the bottom
```

Home, the landing page at `#/` (375 px):

```
[        AY Store         (☀)]   44 px · title · 44 px
┌──────────────────────────────┐
│ Everything your club needs,  │   oxblood band, rounded bottom corners,
│ in one order        ╱╲ trace │   the emblem outline on its right
│ Pick the items, send ...  ╲╱ │
│ (Browse the shop ›)          │   rose pill, the one primary action
└──────────────────────────────┘
Shop by category
[Recreation][Health and S…][Outd…   scrolls sideways, the next tile shows in part
How ordering works
┌──────────────────────────────┐
│ (1) Pick your items          │
│ (2) Send your details        │
│ (3) Get your invoice         │
└──────────────────────────────┘
```

- Cards: white, large radius, no shadow in light mode, a hairline in dark mode.
- The header is an oxblood band in one grid on every screen: a 44 px left slot, the title, a 44 px right slot, so the title never moves. Home shows the big "AY Store" and, on the right, the theme button. Shop shows a small "AY Store" over "Shop" and the theme button. Inner screens (cart, details, confirmation) show a solid < back button on the left and a small "AY Store" above the page title, with no theme button.
- The theme button is a 44 px outlined circle: a sun while the page is light, a moon while it is dark. A tap flips between the two and remembers the pick; the first visit follows the device.
- Home's welcome band runs the full width under the header with rounded bottom corners; its text sits in the 1,200 px column. Browse the shop is a rose pill (the same rose in light and dark).
- A category tile is the category's full patch colour with its name bottom-left. The name follows the category mark's rule: near-black `#171717` on the two light tiles (Nature, Household Arts), white on the rest. White names sit in a dark halo (`text-shadow-halo`), and on Arts and Crafts, where white is only 3.6:1, in a stronger, tighter one (`text-shadow-halo-strong`). Near-black names have no halo.
- `on-patch` (`#FFFFFF`, the same in light and dark) is the white of those tile names; it is used only over the halo.
- The emblem trace is decoration. It draws once when Home opens: a rose line (2 px at 55 % opacity) builds in 4.1 s while a point and a fading trail ride it for 4.8 s, then only that outline stays. With Reduce Motion it is the same still outline. The text column stops short of the drawing from 640 px and the drawing sits under the text on a phone, so no letter lies over the line (stone text on the line blended into the band would fall to 3.8:1). It repaints a small SVG every frame for those 4.8 s, accepted because it is one short drawing; nothing moves after 5 s, so it needs no pause control.
- Buttons are pills. Add turns into a − 1 + pill on the card after the first tap.
- Content is centred in a 1,200 px column on desktop.

## Spacing and sizes

All spacing is on a 4 px scale (Tailwind steps). The gap inside a group is smaller than the gap between groups. Values are taken from the catalogue and cart as built.

| Use                                     | Value                                       | In code                   |
| --------------------------------------- | ------------------------------------------- | ------------------------- |
| Page side gutter                        | 16 px                                       | `px-4`                    |
| Content column (desktop)                | 1,200 px max                                | `max-w-300`               |
| Top of page content                     | 24 px                                       | `pt-6`                    |
| Cart screen column (desktop)            | 768 px max, centred                         | `max-w-3xl`               |
| Between sections (toolbar, count, grid) | 12–24 px                                    | `mt-3` to `mt-6`          |
| Between cards                           | 12 px                                       | `gap-3`                   |
| Inside a card (padding)                 | 8 px under 640 px, 12 px from 640 px        | `p-2 sm:p-3`              |
| Between parts of a card                 | 8 px                                        | `gap-2`                   |
| Header band padding                     | 12 px top and bottom, 16 px sides           | `py-3 px-4`               |
| Header grid                             | 44 px · title · 44 px, 8 px gaps            | `grid-cols-[2.75rem_minmax(0,1fr)_2.75rem]` |
| Theme button                            | 44 px circle, 20 px icon                    | `size-11`, `size-5`       |
| Welcome band                            | 20 px top and bottom, 20 px sides, bottom corners 16 px | `p-5 rounded-b-card` |
| Category tile                           | 104 × 88 px, 10 px padding, 12 px gaps      | `w-26 h-22 p-2.5 gap-3`   |
| Emblem trace                            | about 174 × 170 px at the band's right      | `w-43.5 h-42.5`           |
| Step number circle                      | 32 px                                       | `size-8`                  |
| Patch picture on a card                 | 112 px                                      | `size-28`                 |
| Tap target (buttons, steppers, fields)  | 44 px tall at least                         | `h-11`                    |
| Between neighbouring targets            | 8 px at least                               | `gap-2`                   |
| Card stepper width                      | 134 px                                      |                           |
| Cart stepper pill                       | 36 px drawn, 44 px tap area per control     | `h-9`, `h-11 w-11`        |
| Cart row                                | 80 px                                       | `min-h-20 p-3`            |
| Cart Patch picture                      | 56 px, 10 px corners                        | `size-14 rounded-picture` |
| Removed note                            | held 5 s, fades in its last 150 ms          |                           |
| Cart bar                                | 16 px from the screen edges and bottom      | `inset-x-4 bottom-4`      |
| Card radius                             | 16 px                                       | `rounded-card`            |
| Buttons, fields, cart bar               | pill                                        | `rounded-pill`            |
| Screen title                            | 20 px under 640 px, 28 px from 640 px, bold | `text-xl sm:text-title`   |

- Cart, order form and confirmation use the same values: a 16 px gutter, 12 px between cards or lines, 24 px between sections, 44 px targets.
- The cart column is 768 px, not 1,200: a line is a picture, a name and a stepper, and across 1,200 px they sit about 900 px apart. The order form and confirmation keep it.
- The cart stepper pill is 36 px because it reads lighter than 44 px on an 80 px row; each control keeps a 44 px tap area (the target rule), drawn round the control so the focus ring sits outside the soft fill.
- The cart Patch picture is 56 px with 10 px corners: two text lines sit beside it, and the row comes to 80 px.
- The Removed note holds 5 s (Customer.io's snackbar timing), pauses while the pointer or focus is on it, and restarts at 5 s when they leave.
- A new value needs a reason written here first.

## Principles

- Oxblood marks every action and the header; nothing else uses it. Dark mode swaps the buttons to rose.
- The patch is the hero of every card. Text stays small and grey under it.
- Quiet chrome: no gradients and no decoration. The space between things does the separating.
- The theme button sits in the header on Home and Shop only.
- One way back on inner screens: the < button in the header. Other buttons say "Browse more" when they lead to the catalogue.

## Fixed choices

- Honors show as a card grid, with Add turning into a stepper after the first tap, not as rows with always-shown steppers.
- Unchanged: the A–Z order, the Category label on each card, the Category filter dropdown, the Category mark colours and the confirmation wording.
