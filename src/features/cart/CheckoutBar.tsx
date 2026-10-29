// The Checkout bar at the foot of the cart screen: Estimated total and Checkout, or one Browse more when nothing can be ordered, so the next step is always one tap away.

import { useRef } from 'react' // the double-tap guard
import { formatPrice } from '@/shared/format/price.ts' // "RM 20.00"
import { PILL_BOX } from '@/shared/ui/button-box.ts' // the pill shape

const BAR_BUTTON =
  'bg-accent text-on-accent focus-visible:outline-focus-ring transition-transform duration-(--duration-press) focus-visible:outline-2 focus-visible:outline-offset-2 active:scale-[0.97]' // the primary pill: colours, press feedback and ring

/**
 * Draws the bar.
 * @param totalCents the Estimated total of the orderable lines, in cents
 * @param currency the currency code from the settings
 * @param orderable false when no line can be ordered: the bar then holds Browse more alone
 * @param onCheckout called once when Checkout is pressed (a second press is ignored)
 * @param onBrowse called when Browse more is pressed
 * @return the bar
 */
export function CheckoutBar({
  totalCents,
  currency,
  orderable,
  onCheckout,
  onBrowse,
}: {
  totalCents: number
  currency: string
  orderable: boolean
  onCheckout: () => void
  onBrowse: () => void
}) {
  const pressed = useRef(false) // set by the first Checkout press, so a double tap goes once
  return (
    // White strip with a hairline over the page, the width of the cart column inside.
    <div className="bg-bg-surface border-border-subtle border-t print:hidden">
      {/* The cart column: total left, action right. */}
      <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-3">
        {orderable ? (
          <>
            {/* The total, announced politely as it changes. */}
            <p aria-live="polite" className="min-w-0">
              <span className="text-text-muted block text-sm">Estimated total</span> {/* the label */}
              <span className="block text-lg font-bold tabular-nums">
                {formatPrice(totalCents / 100, currency)}
              </span>{' '}
              {/* the sum */}
            </p>
            <button
              type="button" // not a form submit
              onClick={() => {
                if (pressed.current) return // a double tap goes once
                pressed.current = true // the first press
                onCheckout() // take out the unavailable lines and open the details page
              }}
              className={`${PILL_BOX} ${BAR_BUTTON} shrink-0`} // the primary pill
            >
              Checkout
            </button>
          </>
        ) : (
          <button
            type="button" // not a form submit
            onClick={onBrowse} // back to the shop
            className={`${PILL_BOX} ${BAR_BUTTON} w-full`} // one full-width action
          >
            Browse more
          </button>
        )}
      </div>
    </div>
  )
}
