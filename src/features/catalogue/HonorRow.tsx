// One honor in the catalogue list: picture, name, category label and price, so a buyer can scan the list and compare.

import type { Honor } from '@/shared/data/types.ts' // the shape of an honor
import { formatPrice } from '@/shared/format/price.ts' // "RM 4.00"
import { useCart } from '@/features/cart/use-cart.ts' // the cart the stepper edits
import { QuantityStepper } from '@/features/cart/QuantityStepper.tsx' // the quantity control
import { HONOR_ROW_BOX, HONOR_ROW_END_BOX } from '@/shared/ui/honor-row-box.ts' // the line's box classes
import { PatchPicture } from '@/shared/ui/PatchPicture.tsx' // picture or category mark

/**
 * Draws one list row.
 * @param honor the honor to show
 * @param currency the currency code from the settings
 * @return an `li` element with the picture on the left, the wrapping name with its category label under it, and the price over its quantity stepper on the right
 */
export function HonorRow({ honor, currency }: { honor: Honor; currency: string }) {
  const { quantityOf, setQuantity } = useCart() // this honor's quantity and how to change it
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
      {/* The price, muted so the name leads, with the stepper under it. */}
      <div data-testid="honor-row-end" className={HONOR_ROW_END_BOX}>
        <span className="text-text-muted">{formatPrice(honor.price, currency)}</span> {/* the price */}
        <QuantityStepper
          honorName={honor.name} // for the labels
          quantity={quantityOf(honor.id)} // 0 when not in the cart
          onChange={(quantity) => setQuantity(honor.id, quantity)} // edit the cart
        />
      </div>
    </li>
  )
}
