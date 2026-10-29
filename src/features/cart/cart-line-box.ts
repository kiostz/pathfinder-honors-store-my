// The class strings of the cart card and its order lines, shared by the real lines and the loading lines so the screen does not jump when data arrives.

export const CART_CARD_BOX =
  'bg-bg-surface border-border-subtle rounded-card mt-3 overflow-hidden border' // one white card holding every line
export const CART_LINE_BOX =
  'border-border-subtle flex min-h-20 items-center gap-3 border-b p-3 last:border-b-0' // one line: 56 px picture in 12 px padding is 80 px, a hairline under it, none under the last
export const CART_PICTURE_BOX =
  'rounded-picture size-14 shrink-0 overflow-hidden' // the 56 px picture with 10 px corners
