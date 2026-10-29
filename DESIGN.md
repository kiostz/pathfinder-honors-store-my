# Pathfinder Honors — design

Seed: exact tokens in Task 06 Part A, full file from the built screens at the end of Task 06.

## Product

- **What it is:** an online order form for AY honor patches, for Pathfinder clubs in Malaysia. Orders go by email. There is no payment on the site.
- **Who buys:** anyone. Club leaders, parents and Pathfinders all use it like an ordinary online store. Most arrive knowing which honor they need, on a phone.
- **The job:** find honors, set quantities and send an order in under two minutes, then keep the order number.
- **Feel:** an official store. Clean, trustworthy and plain, like a supplier's catalogue. The patch pictures are the colour; the interface stays quiet.
- **Voice:** plain and polite. Short sentences, verbs first on buttons. The site says "we" for the people who handle orders. Prices read like `RM 4.00`.
- **Brand limits:**
  - The name is always "Pathfinder Honors".
  - Words come from the project glossary (honor, not badge or product).
  - The site never copies the official Pathfinder emblem or uniform.
  - English only.

## Direction

- **Name:** Navy and gold.
- **Thesis:** an official patch store with its own colours. A calm page with white rounded cards, a dark navy header and buttons with gold lettering, like a club flag or an honor sash trim. The patch pictures carry the rest of the colour.
- **Memorable thing:** the navy header with the gold "Pathfinder Honors" title, and the same navy-and-gold pill on every action.
- **Reference:** the card and pill structure follows apple.com/shop; the feel is our own. Nothing is copied: no Apple fonts, logos or brand values.

## Palette

| Role                       | Light                        | Dark                         |
| -------------------------- | ---------------------------- | ---------------------------- |
| page                       | `#F5F5F2`                    | `#000000`                    |
| card                       | `#FFFFFF`                    | `#1C1C1E`                    |
| ink (text)                 | `#1D1D1F`                    | `#F5F5F7`                    |
| muted                      | `#6E6E73`                    | `#A1A1A6`                    |
| hairline                   | `#D2D2D7`                    | `#38383A`                    |
| navy (header, buttons)     | `#162447`                    | `#0D1730` (header only)      |
| gold (text on navy, title) | `#F2C14E`                    | `#F2C14E`                    |
| button                     | navy fill, gold text (9.1:1) | gold fill, navy text (9.1:1) |

- The Category mark colours stay as ruled (real patch backgrounds).
- Red is kept for errors only.
- Gold is never used as text on the white page; it fails contrast there.

## Type

- For now, the system font stack: `system-ui, -apple-system, "Segoe UI", Roboto, sans-serif`. No web font is downloaded.
- Public Sans (OFL) is the intended face, added later.
- Big, bold screen titles; plain body text; prices in tabular figures.
- Exact sizes are set in Task 06 Part A.

## Layout

```
375 px                              desktop (1440)
Pathfinder Honors        [◐ v]      Pathfinder Honors                    [◐ System v]
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

- Cards: white, large radius, no shadow in light mode, a hairline in dark mode.
- The header is a navy band with the gold title and the theme control.
- Buttons are pills. Add turns into a − 1 + pill on the card after the first tap.
- Content is centred in a 1,200 px column on desktop.

## Principles

- Navy and gold mark every action; nothing else uses them.
- The patch is the hero of every card. Text stays small and grey under it.
- Quiet chrome: no gradients and no decoration. The space between things does the separating.
- A theme control (System, Light, Dark) sits in the header.

## Rulings this direction would change

- Task 02's row layout becomes a card grid (already ruled 2026-10-29: cards with Add turning into a stepper).
- Task 03's always-shown row steppers go (same ruling).
- No other standing ruling changes: the A–Z order, the Category label on each card, the Category filter dropdown, the Category mark colours and the confirmation wording all stay.
