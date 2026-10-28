// One order line on the cart screen, or the removed note that replaces it after removal, so a buyer can change a quantity or take the removal back.

import { useEffect, useRef } from 'react' // handles on the line and its parts
import type { Honor } from '@/shared/data/types.ts' // the shape of an honor
import { formatPrice } from '@/shared/format/price.ts' // "RM 4.00"
import { HONOR_ROW_BOX, HONOR_ROW_END_BOX } from '@/shared/ui/honor-row-box.ts' // the same box as a catalogue line
import { PatchPicture } from '@/shared/ui/PatchPicture.tsx' // picture or category mark
import { lineTotalCents } from './cart.ts' // the line's price
import { QuantityStepper } from './QuantityStepper.tsx' // the quantity control

/**
 * Draws one order line; when `removed` is set it draws the removed note with Undo at the height the line had.
 * @param honor the honor on this line
 * @param quantity the quantity now (0 while removed)
 * @param currency the currency code from the settings
 * @param removed the quantity and line height from before the removal, or null while the line is in the cart
 * @param onChange called with the new quantity and the line's current height in pixels
 * @param onUndo called when the buyer takes the removal back
 * @return an `li` element
 */
export function CartLine({
  honor,
  quantity,
  currency,
  removed,
  onChange,
  onUndo,
}: {
  honor: Honor
  quantity: number
  currency: string
  removed: { quantity: number; height: number } | null
  onChange: (quantity: number, height: number) => void
  onUndo: () => void
}) {
  const lineRef = useRef<HTMLLIElement>(null) // measured on a change, so the removed note can keep its height
  const isRemoved = removed !== null // which of the two shapes to draw
  const lastRemoved = useRef(isRemoved) // the shape drawn before, so only a real swap moves focus

  // After a swap, move focus to where the buyer's hands are (Undo after a removal, the number after Undo), unless they moved it elsewhere.
  useEffect(() => {
    if (lastRemoved.current === isRemoved) return // no swap (also true on mount and on a strict-mode re-run)
    lastRemoved.current = isRemoved // remember the new shape
    // One tick later: a blur commits while the browser is still moving focus to the tapped control, so only then is it known where focus went.
    const timer = window.setTimeout(() => {
      const line = lineRef.current // this line's element
      const active = document.activeElement // where focus is now
      if (active !== null && active !== document.body && !line?.contains(active)) return // the buyer chose another control: leave it
      line?.querySelector(isRemoved ? 'button' : 'input')?.focus() // the removed note's only button is Undo
    }, 0) // after the focus change
    return () => window.clearTimeout(timer) // a swap back or leaving the screen cancels it
  }, [isRemoved])
  return (
    // Same box as a catalogue line; the removed note keeps the line's measured height so the lines below stay put.
    <li
      ref={lineRef} // for measuring and focus
      className={HONOR_ROW_BOX}
      style={isRemoved ? { minHeight: removed.height } : undefined} // measured, so the swap moves nothing
    >
      {isRemoved ? (
        <>
          {/* The removed note, left; Undo, right where the stepper was. */}
          <p className="text-text-muted min-w-0 flex-1 wrap-break-word">{`${honor.name} removed.`}</p>
          <button
            type="button" // not a form submit
            aria-label={`Undo removing ${honor.name}`} // names the honor
            onClick={onUndo} // restore the earlier quantity
            className="border-border-subtle text-accent focus-visible:outline-focus-ring min-h-11 shrink-0 rounded-md border px-4 font-medium transition-transform duration-(--duration-press) focus-visible:outline-2 focus-visible:outline-offset-2 active:scale-[0.97]" // 44 px, press feedback, focus ring
          >
            Undo
          </button>
        </>
      ) : (
        <>
          {/* Picture or category mark, as in the catalogue. */}
          <PatchPicture honor={honor} />
          {/* Name that wraps, the price of one under it. */}
          <div className="flex min-w-0 flex-1 flex-col items-start gap-1">
            <span className="wrap-break-word">{honor.name}</span> {/* the name */}
            <span className="text-text-muted text-sm">{`${formatPrice(honor.price, currency)} each`}</span>{' '}
            {/* one's price */}
          </div>
          {/* The line total over the stepper. */}
          <div className={HONOR_ROW_END_BOX}>
            <span>{formatPrice(lineTotalCents({ honor, quantity }) / 100, currency)}</span> {/* the line total */}
            <QuantityStepper
              honorName={honor.name} // for the labels
              quantity={quantity} // the cart's quantity
              onChange={(next) => onChange(next, lineRef.current?.offsetHeight ?? 0)} // with the height to keep
            />
          </div>
        </>
      )}
    </li>
  )
}
