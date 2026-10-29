// The cart screen: order lines A to Z with the estimated total, so a buyer can check and change what they picked.

import { useEffect, useRef, useState } from 'react' // removals and the heading focus
import type { CatalogueLoad } from '@/features/catalogue/use-catalogue-data.ts' // the load the app hands over
import { OrderForm } from '@/features/order/OrderForm.tsx' // the form under the total
import { useOrderForm } from '@/features/order/use-order-form.ts' // whether a send is running
import { formatPrice } from '@/shared/format/price.ts' // "RM 20.00"
import { CATALOGUE_HASH } from '@/shared/routes.ts' // the catalogue's address
import { sortByName } from '@/shared/sort/sort-by-name.ts' // names A to Z
import { HONOR_ROW_BOX, HONOR_ROW_END_BOX } from '@/shared/ui/honor-row-box.ts' // the line box, shared with the loading lines
import { LOAD_ERROR_TEXT } from '@/shared/ui/load-error-text.ts' // the failed-load message
import { estimatedTotalCents, resolveCart } from './cart.ts' // the cart maths
import { CartLine } from './CartLine.tsx' // one order line or its removed note
import { useCart } from './use-cart.ts' // the cart

const SKELETON_LINES = 3 // how many skeleton lines the loading state shows

/**
 * Words the Unavailable notice for honors taken out of the cart.
 * @param names the switched-off honors' names
 * @param unnamed how many gone honors have no name
 * @return the Unavailable notice text, or null when nothing was taken out
 */
function unavailableNotice(names: string[], unnamed: number): string | null {
  const parts = [...names, ...(unnamed > 0 ? [`${unnamed} ${unnamed === 1 ? 'honor' : 'honors'}`] : [])] // a gone honor counts as "1 honor"
  if (parts.length === 0) return null // nothing taken out
  const joined = parts.length === 1 ? parts[0] : `${parts.slice(0, -1).join(', ')} and ${parts[parts.length - 1]}` // names joined
  const single = names.length + unnamed === 1 // one honor, or the "1 honor" count alone
  return `${joined} ${single ? 'is' : 'are'} no longer available and ${single ? 'was' : 'were'} taken out of your cart.` // verb agrees
}

const ACTION_BOX =
  'focus-visible:outline-focus-ring inline-flex min-h-11 items-center rounded-md font-medium transition-transform duration-(--duration-press) focus-visible:outline-2 focus-visible:outline-offset-2 active:scale-[0.97]' // 44 px, press feedback, focus ring

/**
 * Draws the cart screen.
 * @param data the load: state, skeleton gate and retry
 * @param onBack called by Back to honors and Browse honors
 * @return the heading, the order lines with their removed note, and the estimated total
 */
export function CartScreen({ data, onBack }: { data: CatalogueLoad; onBack: () => void }) {
  const { state, showSkeleton, retry } = data // load state, skeleton gate and retry
  const { quantities, setQuantity, unavailableNames, unavailableUnnamed } = useCart() // the cart and what was taken out
  const headingRef = useRef<HTMLHeadingElement>(null) // focused on arrival
  const { sending } = useOrderForm() // an order is being sent: lines and form wait, even after leaving and coming back
  const [removed, setRemoved] = useState<Record<string, { quantity: number; height: number }>>({}) // lines set to zero on this screen, kept until it closes

  // Arriving keyboard and screen-reader users start at the heading.
  useEffect(() => {
    headingRef.current?.focus() // the heading has tabIndex -1
  }, [])

  /**
   * Draws Back to honors or Browse honors: a link that hands the move to the app.
   * @param label the link text
   * @param primary whether it is the screen's one primary action
   * @return an anchor
   */
  const backLink = (label: string, primary: boolean) => (
    <a
      href={CATALOGUE_HASH} // a real address for the link; the click is handed to the app
      onClick={(event) => {
        event.preventDefault() // the app decides between history back and going home
        onBack() // back or home
      }}
      className={`${ACTION_BOX} ${primary ? 'bg-accent text-on-accent mt-4 px-6' : 'text-accent -ml-2 px-2'}`} // accent button, or a quiet link
    >
      {label}
    </a>
  )

  const currency = state.status === 'ready' ? state.settings.currency : '' // only read once ready
  const honors = state.status === 'ready' ? state.honors : [] // every honor in the file
  const { lines } = resolveCart(quantities, honors) // order lines A to Z
  const shownHonors = sortByName([
    ...lines.map((line) => line.honor),
    ...honors.filter((honor) => removed[honor.id] !== undefined && quantities[honor.id] === undefined),
  ]) // the honors of the lines and of the removed notes in one A to Z list, so a removed note keeps its place
  const notice = unavailableNotice(unavailableNames, unavailableUnnamed) // null when nothing was taken out
  return (
    <div inert={sending} aria-busy={sending}>
      {/* Back to the catalogue, quiet; the heading follows. */}
      {backLink('Back to honors', false)}
      {/* Where focus lands on arrival. */}
      <h2 ref={headingRef} tabIndex={-1} className="mt-2 text-xl font-semibold outline-none">
        Your cart
      </h2>
      {/* Muted, above the lines, until the buyer leaves the screen. */}
      {notice !== null && state.status === 'ready' && <p className="text-text-muted mt-3">{notice}</p>}
      {/* Loading shows nothing for 300 ms, then lines of the same shape. */}
      {showSkeleton && (
        <div aria-hidden="true" className="mt-2">
          {Array.from({ length: SKELETON_LINES }, (_, index) => (
            // A skeleton line has the box of a real line.
            <div key={index} data-testid="cart-skeleton-line" className={HONOR_ROW_BOX}>
              <div className="bg-border-subtle size-14 shrink-0 rounded-md" /> {/* the picture */}
              <div className="bg-border-subtle h-6 w-3/5 flex-1 rounded-sm" /> {/* the name */}
              <div className={HONOR_ROW_END_BOX}>
                <div className="bg-border-subtle h-6 w-14 rounded-sm" /> {/* the line total */}
                <div className="bg-border-subtle h-11 w-33 rounded-md" /> {/* the stepper, 132 px */}
              </div>
            </div>
          ))}
        </div>
      )}
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
      {state.status === 'ready' && (
        <>
          {/* One list: lines, with the removed note where a line was set to zero. */}
          {shownHonors.length > 0 && (
            <ul className="mt-2">
              {shownHonors.map((honor) => (
                // one line per honor, keyed by id so a swap keeps its place
                <CartLine
                  key={honor.id}
                  honor={honor}
                  quantity={quantities[honor.id] ?? 0}
                  currency={currency}
                  removed={quantities[honor.id] === undefined ? (removed[honor.id] ?? null) : null}
                  onChange={(quantity, height) => {
                    if (quantity === 0)
                      // set to zero: a removal
                      setRemoved((current) => ({
                        ...current, // the other removed notes
                        [honor.id]: { quantity: quantities[honor.id] ?? 0, height }, // what to restore and how tall the line was
                      })) // remember this removal
                    setQuantity(honor.id, quantity) // edit the cart
                  }}
                  onUndo={() => {
                    setQuantity(honor.id, removed[honor.id]?.quantity ?? 0) // restore the earlier quantity
                    setRemoved((current) => {
                      const next = { ...current } // a copy
                      delete next[honor.id] // the removed note is done
                      return next // the rest stay
                    }) // forget this removal
                  }}
                />
              ))}
            </ul>
          )}
          {/* The sum of the lines shown; announced politely as it changes. */}
          {lines.length > 0 && (
            <p
              aria-live="polite"
              className="border-border-subtle mt-3 flex justify-between gap-3 text-lg font-semibold"
            >
              <span>Estimated total</span> {/* the label */}
              <span>{formatPrice(estimatedTotalCents(lines) / 100, currency)}</span> {/* the sum */}
            </p>
          )}
          {/* The invoice note and the form, only with something to order. */}
          {lines.length > 0 && (
            <>
              <p className="text-text-muted mt-1 text-sm">
                Estimated total at today&apos;s prices. The treasurer will email you the invoice.
              </p>
              <OrderForm lines={lines} currency={currency} clubs={state.clubs} />
            </>
          )}
          {/* Nothing in the cart: say so and lead back. */}
          {lines.length === 0 && (
            <>
              <p className="text-text-muted mt-3">Your cart is empty.</p>
              {backLink('Browse honors', true)}
            </>
          )}
        </>
      )}
    </div>
  )
}
