// One honor in the catalogue list: picture, name and price, so a buyer can scan the list and compare.

import type { Honor } from '@/shared/data/types.ts' // the shape of an honor
import { formatPrice } from '@/shared/format/price.ts' // "RM 4.00"
import { PatchPicture } from './PatchPicture.tsx' // picture or category mark

/**
 * Draws one list row.
 * @param honor the honor to show
 * @param currency the currency code from the settings
 * @return an `li` element with the picture on the left, the wrapping name and the price on the right
 */
export function HonorRow({ honor, currency }: { honor: Honor; currency: string }) {
  return (
    // One row: picture, name that wraps, price that never shrinks.
    <li className="border-border-subtle flex min-h-14 items-center gap-3 border-b py-2">
      {/* Picture or category mark, 56 px square. */}
      <PatchPicture honor={honor} />
      {/* The name wraps rather than truncates; long names stay readable at 375 px. */}
      <span className="min-w-0 flex-1 wrap-break-word">{honor.name}</span>
      {/* The price, muted so the name leads. */}
      <span className="text-text-muted shrink-0">{formatPrice(honor.price, currency)}</span>
    </li>
  )
}
