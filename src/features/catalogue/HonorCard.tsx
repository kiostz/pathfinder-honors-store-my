// One honor in the catalogue grid: picture, name, Category label, price and Add, so a buyer can scan by picture and order from the card.

import type { Honor } from '@/shared/data/types.ts' // the shape of an honor
import { formatPrice } from '@/shared/format/price.ts' // "RM 4.00"
import { useCart } from '@/features/cart/use-cart.ts' // the cart the card edits
import { CardQuantity } from '@/features/cart/CardQuantity.tsx' // Add or the stepper
import { PatchPicture } from '@/shared/ui/PatchPicture.tsx' // picture or category mark
import { CARD_BOX } from './honor-card-box.ts' // the card's box classes

/**
 * Draws one card.
 * @param honor the honor to show
 * @param currency the currency code from the settings
 * @return an `li` element: picture on top, then the wrapping name, the Category label, the price and the Add control at the bottom
 */
export function HonorCard({ honor, currency }: { honor: Honor; currency: string }) {
  const { quantityOf, setQuantity } = useCart() // this honor's quantity and how to change it
  return (
    // One card.
    <li className={CARD_BOX}>
      {/* Picture or category mark, 112 px square. */}
      <PatchPicture honor={honor} size="card" />
      {/* The text grows so Add sits at the same height on every card in a row. */}
      <div className="flex min-w-0 flex-1 flex-col items-center gap-1 text-center">
        {/* The name, read first; wraps rather than truncates. */}
        <span className="font-medium wrap-break-word">{honor.name}</span>
        {/* The Category label: text only, not a control. */}
        <span className="text-text-default bg-border-subtle rounded-sm px-1.5 text-xs">{honor.category}</span>
        {/* The price in tabular figures. */}
        <span className="text-text-muted tabular-nums">{formatPrice(honor.price, currency)}</span>
      </div>
      <CardQuantity
        honorName={honor.name} // for the labels
        quantity={quantityOf(honor.id)} // 0 when not in the cart
        onChange={(quantity) => setQuantity(honor.id, quantity)} // edit the cart
      />
    </li>
  )
}
