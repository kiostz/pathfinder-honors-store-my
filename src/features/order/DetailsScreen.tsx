// The details page: the order form for the cart's orderable lines, so a buyer who pressed Checkout can leave their details and send; it sends them back to the cart when an order could not be right.

import { useEffect, useRef } from 'react' // the redirect and the heading focus
import { resolveCart } from '@/features/cart/cart.ts' // orderable lines and what cannot be ordered
import { useCart } from '@/features/cart/use-cart.ts' // the cart
import type { CatalogueLoad } from '@/features/catalogue/use-catalogue-data.ts' // the load the app hands over
import { CART_HASH, DETAILS_HASH } from '@/shared/routes.ts' // the cart's and this page's addresses
import { ACTION_BOX } from '@/shared/ui/button-box.ts' // the retry button
import { LOAD_ERROR_TEXT } from '@/shared/ui/load-error-text.ts' // the failed-load message
import { OrderForm } from './OrderForm.tsx' // the form
import { useOrderForm } from './use-order-form.ts' // whether a send is running

/**
 * Draws the details page.
 * @param data the load: state and retry
 * @return the heading and the order form; nothing but the heading while the data loads
 */
export function DetailsScreen({ data }: { data: CatalogueLoad }) {
  const { state, retry } = data // load state and retry
  const { quantities } = useCart() // the cart
  const { sending } = useOrderForm() // an order is being sent: the page waits
  const headingRef = useRef<HTMLHeadingElement>(null) // focused on arrival
  const ready = state.status === 'ready' // the honors are known
  const { lines, unavailable } = resolveCart(quantities, ready ? state.honors : []) // what can be ordered, what cannot
  const mustLeave = ready && (lines.length === 0 || unavailable.length > 0) // nothing to order, or a line that cannot be ordered is still in the cart

  // Arriving keyboard and screen-reader users start at the heading.
  useEffect(() => {
    headingRef.current?.focus() // the heading has tabIndex -1
  }, [])

  // A page that cannot lead to a right order goes back to the cart (a typed address, a reload, an honor switched off since).
  useEffect(() => {
    if (!mustLeave) return // an order can be sent from here
    if (window.location.hash !== DETAILS_HASH) return // already leaving (a sent order opened the confirmation)
    window.location.replace(CART_HASH) // replace, so Back does not return to a page that bounces
  }, [mustLeave])

  return (
    // A 768 px centred column like the cart's; inert and busy while an order sends.
    <div inert={sending} aria-busy={sending} className="mx-auto max-w-3xl pb-6">
      {/* Where focus lands on arrival. */}
      <h2 ref={headingRef} tabIndex={-1} className="sm:text-title mt-2 text-xl font-bold outline-none">
        Your details
      </h2>
      {/* The same copy as the catalogue, and the way to retry. */}
      {state.status === 'error' && (
        <>
          <p className="text-danger mt-3 min-h-6">{LOAD_ERROR_TEXT}</p>
          <button
            type="button" // not a form submit
            onClick={retry} // run the load again
            className={`${ACTION_BOX} bg-accent text-on-accent mt-4 px-6`}
          >
            Try again
          </button>
        </>
      )}
      {/* Only with orderable lines and nothing unavailable; otherwise the redirect above is under way. */}
      {ready && !mustLeave && <OrderForm lines={lines} currency={state.settings.currency} clubs={state.clubs} />}
    </div>
  )
}
