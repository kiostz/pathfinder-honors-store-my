// The classes every floating pill shares: where it sits and how it looks, so the tab pill, the cart's Checkout pill and the details page's Send order pill are one shape.

import { ACTION_BOX } from './button-box.ts' // the shared pill action: shape, press feedback and focus ring

export const PILL_DOCK =
  'fixed inset-x-4 bottom-5.5 z-20 mx-auto flex max-w-105 flex-col gap-3 print:hidden' // the position: 16 px from the sides, 22 px from the bottom, 420 px at most; whatever is stacked above the pill sits 12 px over it

export const PILL_SURFACE = 'bg-bg-surface rounded-pill pill-edge flex h-16 items-center px-1.5' // the look: a white pill 64 px tall with the pill's shadow or hairline

export const PILL_NOTE =
  'bg-bg-inverse text-on-inverse rounded-card flex w-full items-center gap-3 py-1 pr-1 pl-4' // a note stacked above the pill, as wide as the pill: the Removed note and the failure note

export const PILL_ACTION = `${ACTION_BOX} bg-accent text-on-accent h-13 gap-2 font-extrabold!` // the oxblood action inside a pill, 52 px tall in the 64 px pill: the shared 44 px pill action's ring and press feedback, taller and heavier (the ! beats its font-medium)
