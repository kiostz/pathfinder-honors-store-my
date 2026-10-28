// One honor in the catalogue list: picture, name, category label and price, so a buyer can scan the list and compare.

import type { Honor } from '@/shared/data/types.ts' // the shape of an honor
import { formatPrice } from '@/shared/format/price.ts' // "RM 4.00"
import { PatchPicture } from './PatchPicture.tsx' // picture or category mark

export const HONOR_ROW_BOX = 'border-border-subtle flex min-h-14 items-center gap-3 border-b py-2' // one row's box, shared with the loading rows so the list does not jump

/**
 * Draws one list row.
 * @param honor the honor to show
 * @param currency the currency code from the settings
 * @return an `li` element with the picture on the left, the wrapping name with its category label under it, and the price on the right
 */
export function HonorRow({ honor, currency }: { honor: Honor; currency: string }) {
  return (
    // One row: picture, name that wraps, price that never shrinks.
    <li className={HONOR_ROW_BOX}>
      {/* Picture or category mark, 56 px square. */}
      <PatchPicture honor={honor} />
      {/* The name wraps rather than truncates; the category label sits under it, so the price column stays free for a stepper. */}
      <div className="flex min-w-0 flex-1 flex-col items-start gap-1">
        {/* The name, read first. */}
        <span className="wrap-break-word">{honor.name}</span>
        {/* The category label: text only, not a control; it wraps rather than truncates. */}
        <span className="text-text-muted bg-border-subtle rounded-sm px-1.5 text-xs">{honor.category}</span>
      </div>
      {/* The price, muted so the name leads. */}
      <span className="text-text-muted shrink-0">{formatPrice(honor.price, currency)}</span>
    </li>
  )
}
