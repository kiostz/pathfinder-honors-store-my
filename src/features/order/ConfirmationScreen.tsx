// The confirmation page after a sent order: its heading and order number, or a note when this tab has no order to show.

import { useEffect, useRef } from 'react' // the heading focus
import { CATALOGUE_HASH } from '@/shared/routes.ts' // the catalogue's address
import { readSentOrder } from './sent-order-storage.ts' // the order kept by the send

const ACTION_BOX =
  'bg-accent text-on-accent focus-visible:outline-focus-ring mt-4 inline-flex min-h-11 items-center rounded-md px-6 font-medium transition-transform duration-(--duration-press) focus-visible:outline-2 focus-visible:outline-offset-2 active:scale-[0.97]' // 44 px accent button, press feedback, focus ring

/**
 * Draws the confirmation page.
 * @param onBack called by Browse honors
 * @return the heading and order number, or the empty state
 */
export function ConfirmationScreen({ onBack }: { onBack: () => void }) {
  const order = readSentOrder() // what this tab sent, if anything
  const headingRef = useRef<HTMLHeadingElement>(null) // focused on arrival

  // Arriving keyboard and screen-reader users start at the heading.
  useEffect(() => {
    headingRef.current?.focus() // the heading has tabIndex -1
  }, [])

  if (order === null)
    return (
      <>
        {/* Nothing sent in this tab: say so and lead back. */}
        <h2 ref={headingRef} tabIndex={-1} className="text-xl font-semibold outline-none">
          Your order
        </h2>
        <p className="text-text-muted mt-3">There is no order to show here.</p>
        <a
          href={CATALOGUE_HASH} // a real address for the link; the click is handed to the app
          onClick={(event) => {
            event.preventDefault() // the app decides where home is
            onBack() // to the catalogue
          }}
          className={ACTION_BOX}
        >
          Browse honors
        </a>
      </>
    )
  return (
    <>
      {/* Where focus lands on arrival. */}
      <h2 ref={headingRef} tabIndex={-1} className="text-xl font-semibold outline-none">
        Order sent
      </h2>
      {/* The buyer's only record of the order. */}
      <p className="mt-3 text-3xl font-semibold tracking-wide">{order.number}</p>
    </>
  )
}
