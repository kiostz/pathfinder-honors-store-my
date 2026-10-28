// The cart bar fixed to the bottom: Item count and estimated total, so the buyer always sees what is picked and can find the cart.

import { useState } from 'react' // the last non-empty numbers
import type { Honor } from '@/shared/data/types.ts' // the shape of an honor
import { formatPrice } from '@/shared/format/price.ts' // "RM 20.00"
import { cartCount, estimatedTotalCents, resolveCart } from './cart.ts' // the cart maths
import { useCart } from './use-cart.ts' // the cart

/**
 * Draws the bar; it stays mounted but slides away and goes inert while the cart is empty.
 * @param honors every honor in the data
 * @param currency the currency code from the settings
 * @return the bar element
 */
export function CartBar({ honors, currency }: { honors: Honor[]; currency: string }) {
  const { quantities } = useCart() // the cart
  const { lines } = resolveCart(quantities, honors) // order lines A to Z
  const count = cartCount(lines) // the Item count
  const totalCents = estimatedTotalCents(lines) // the estimated total
  const visible = lines.length > 0 // only with something picked
  const [shown, setShown] = useState({ count, totalCents }) // what the bar draws, kept while it slides away
  if (visible && (shown.count !== count || shown.totalCents !== totalCents)) setShown({ count, totalCents }) // follow the cart, but never to empty
  const itemCountText = `${count} ${count === 1 ? 'item' : 'items'}` // what a screen reader hears
  return (
    <>
      {/* Always in the page and outside the inert bar, so the first add is announced; the bar below is hidden from readers while empty. */}
      <p role="status" className="sr-only">
        {visible ? `${itemCountText}, Estimated total ${formatPrice(totalCents / 100, currency)}` : ''}
      </p>
      {/* Fixed to the bottom at the width of main; slides on transform only. */}
      <div
        data-testid="cart-bar"
        inert={!visible} // out of reach and out of the accessibility tree while hidden
        className={`border-border-subtle bg-bg-surface fixed inset-x-0 bottom-0 z-20 mx-auto flex h-16 max-w-3xl items-center justify-between gap-3 border-t px-4 transition-transform ${
          visible
            ? 'translate-y-0 duration-(--duration-enter) ease-(--ease-out-soft)'
            : 'translate-y-full duration-(--duration-exit) ease-(--ease-in-soft)'
        }`} // enter and exit tokens
      >
        {/* Count and estimated total as last shown; the status above does the announcing. */}
        <div className="min-w-0">
          {/* The Item count, the only place "item" shows. */}
          <p className="font-medium">{`${shown.count} ${shown.count === 1 ? 'item' : 'items'}`}</p>
          {/* The estimated total under it. */}
          <p className="text-text-muted text-sm">{`Estimated total ${formatPrice(shown.totalCents / 100, currency)}`}</p>
        </div>
        {/* The one primary action; it becomes the link to the cart screen. */}
        <span className="bg-accent text-on-accent inline-flex min-h-11 items-center rounded-md px-6 font-medium">
          View cart
        </span>
      </div>
    </>
  ) // the status and the bar
}
