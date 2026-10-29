// The confirmation page after a sent order: the whole order for the buyer to keep or print, or a note when this tab has no order to show.

import { useEffect, useRef, useState } from 'react' // the heading focus and the order read once
import { formatPrice } from '@/shared/format/price.ts' // "RM 9.00"
import { CATALOGUE_HASH } from '@/shared/routes.ts' // the catalogue's address
import { readSentOrder } from './sent-order-storage.ts' // the order kept by the send

const ACTION_BOX =
  'bg-accent text-on-accent focus-visible:outline-focus-ring mt-4 inline-flex min-h-11 items-center rounded-md px-6 font-medium transition-transform duration-(--duration-press) focus-visible:outline-2 focus-visible:outline-offset-2 active:scale-[0.97]' // 44 px accent button, press feedback, focus ring

/**
 * Draws the confirmation page.
 * @param onBack called by Browse honors
 * @return the order as sent with its print and back actions, or the empty state
 */
export function ConfirmationScreen({ onBack }: { onBack: () => void }) {
  const [order] = useState(() => readSentOrder()) // what this tab sent, read once so a bad value warns once
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
          className={`${ACTION_BOX} print:hidden`}
        >
          Browse honors
        </a>
      </>
    )
  const sentOn = new Date(order.sentAt).toLocaleDateString('en-GB', { dateStyle: 'medium' }) // "28 Oct 2026", the buyer's own day
  const money = (cents: number) => formatPrice(cents / 100, order.currency) // "RM 9.00"
  return (
    <>
      {/* Where focus lands on arrival. */}
      <h2 ref={headingRef} tabIndex={-1} className="text-xl font-semibold outline-none">
        Order sent
      </h2>
      {/* The buyer's only record of the order, with the day it was sent. */}
      <p className="mt-3 text-2xl font-semibold tracking-wide whitespace-nowrap sm:text-3xl">{order.number}</p>
      <p className="text-text-muted mt-1 text-sm">{sentOn}</p>
      {/* What happens next, with the contact details so a typo shows. */}
      <p className="mt-3 wrap-break-word">
        {`Keep this number. We'll review your order and contact you at ${order.email} or `}
        {/* the number stays on one line */}
        <span className="whitespace-nowrap">{order.phone}</span>
        {' to confirm it. Thank you!'}
      </p>
      {/* The order lines as sent, at the prices of that moment. */}
      <ul className="mt-6">
        {/* one row per order line */}
        {order.lines.map((line) => (
          // the row, keyed by honor, with a rule under it
          <li key={line.honorId} className="border-border-subtle flex items-start justify-between gap-3 border-b py-3">
            {/* the name and the quantity at its price; min-w-0 lets a long name wrap */}
            <div className="min-w-0">
              {/* the honor */}
              <span className="wrap-break-word">{line.name}</span>
              {/* how many, at what price */}
              <span className="text-text-muted block text-sm">{`${line.quantity} × ${money(line.priceCents)}`}</span>
            </div>
            {/* the line total */}
            <span className="shrink-0">{money(line.priceCents * line.quantity)}</span>
          </li>
        ))}
      </ul>
      {/* The estimated total, as in the cart. */}
      <p className="mt-3 flex justify-between gap-3 text-lg font-semibold">
        {/* the label */}
        <span>Estimated total</span>
        {/* the sum */}
        <span>{money(order.totalCents)}</span>
      </p>
      {/* Who the order is for. */}
      <dl className="mt-6 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1">
        {/* label */}
        <dt className="text-text-muted">Name</dt>
        {/* the buyer */}
        <dd className="wrap-break-word">{order.name}</dd>
        {/* label */}
        <dt className="text-text-muted">Phone</dt>
        {/* the buyer's number */}
        <dd className="wrap-break-word">{order.phone}</dd>
        {/* label */}
        <dt className="text-text-muted">Club</dt>
        {/* the club */}
        <dd className="wrap-break-word">{order.club.email}</dd>
      </dl>
      {/* The one primary action, then a quiet way home; neither is printed. */}
      <div className="flex flex-wrap items-center gap-x-6">
        <button
          type="button" // not a form submit
          onClick={() => window.print()} // the browser's print dialog, which also saves a PDF
          className={`${ACTION_BOX} print:hidden`}
        >
          Print / save as PDF
        </button>
        <a
          href={CATALOGUE_HASH} // a real address for the link; the click is handed to the app
          onClick={(event) => {
            event.preventDefault() // the app decides where home is
            onBack() // to the catalogue
          }}
          className="text-accent focus-visible:outline-focus-ring mt-4 inline-flex min-h-11 items-center font-medium underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 print:hidden" // 44 px quiet link, focus ring
        >
          Back to honors
        </a>
      </div>
    </>
  )
}
