// The cart bar fixed to the bottom: Item count and estimated total, so the buyer always sees what is picked and can find the cart.

import { useState, type MouseEvent, type Ref } from 'react' // the last non-empty numbers, and the ref and click types
import type { Honor } from '@/shared/data/types.ts' // the shape of an honor
import { formatPrice } from '@/shared/format/price.ts' // "RM 20.00"
import { CART_HASH } from '@/shared/routes.ts' // the cart screen's address
import { cartCount, estimatedTotalCents, resolveCart } from './cart.ts' // the cart maths
import { useCart } from './use-cart.ts' // the cart

/**
 * Draws the bar; it stays mounted but slides away and goes inert while the cart is empty.
 * @param honors every honor in the data
 * @param currency the currency code from the settings
 * @param linkRef lets the app focus the bar when the buyer comes back from the cart
 * @param onOpen called with the click when the buyer clicks the bar, so the app can mark the cart's history entry
 * @return the bar element
 */
export function CartBar({
  honors,
  currency,
  linkRef, // the link's ref
  onOpen, // the click handler
}: {
  honors: Honor[] // every honor
  currency: string // the currency code
  linkRef?: Ref<HTMLAnchorElement> // for focus on return
  onOpen?: (event: MouseEvent<HTMLAnchorElement>) => void // the click, so the app can tell a plain open from a new-tab one
}) {
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
      {/* The whole bar is one link to the cart; fixed to the bottom at the width of main; slides on transform only. */}
      <a
        ref={linkRef} // for focus on return
        href={CART_HASH} // opens the cart screen
        onClick={onOpen} // tells the app the cart is opened from the catalogue
        data-testid="cart-bar"
        inert={!visible} // out of reach and out of the accessibility tree while hidden
        className={`border-border-subtle bg-bg-surface text-text-default focus-visible:outline-focus-ring fixed inset-x-0 bottom-0 z-20 mx-auto flex h-16 max-w-3xl items-center justify-between gap-3 border-t px-4 transition-transform focus-visible:outline-2 focus-visible:-outline-offset-4 ${
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
        {/* The one primary action, drawn as a button inside the link. */}
        <span className="bg-accent text-on-accent inline-flex min-h-11 items-center rounded-md px-6 font-medium">
          View cart
        </span>
      </a>
    </>
  ) // the status and the bar
}
