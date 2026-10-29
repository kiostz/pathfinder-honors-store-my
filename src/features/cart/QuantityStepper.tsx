// The quantity stepper [ - n + ] for one honor: 0 to 99 by buttons or a typed number, so a buyer can order fast without a keypad detour.

import { useState } from 'react' // the text being typed
import { clampQuantity, MAX_QUANTITY } from './cart.ts' // the 0 to 99 rule

const CONTROL_BOX =
  'size-11 bg-transparent text-center text-lg focus-visible:outline-focus-ring focus-visible:outline-2 focus-visible:-outline-offset-2' // 44 px square inside the pill, ring drawn inside so the pill's edge does not clip it
const BUTTON_BOX = `${CONTROL_BOX} rounded-pill transition-transform duration-(--duration-press) active:scale-[0.97] aria-disabled:opacity-40` // press feedback, dimmed at a limit

/**
 * Draws the stepper.
 * @param honorName the honor's name, used in the labels
 * @param quantity the quantity now, 0 to 99
 * @param onChange called with the new quantity when a button or the typed number commits it
 * @return a group with minus, the number field and plus
 */
export function QuantityStepper({
  honorName,
  quantity,
  onChange,
}: {
  honorName: string
  quantity: number
  onChange: (quantity: number) => void
}) {
  const [draft, setDraft] = useState<string | null>(null) // what the buyer is typing, null when not typing

  /** Commits the typed number; empty means 0. */
  const commit = () => {
    if (draft === null) return // nothing typed
    const next = clampQuantity(draft === '' ? 0 : Number(draft)) // 0 to 99
    setDraft(null) // show the real quantity again
    if (next !== quantity) onChange(next) // only a real change
  }

  return (
    // One labelled group so a screen reader names all three controls together.
    <div
      role="group" // one named group
      aria-label={`Quantity of ${honorName}`} // names the honor
      className="border-border-subtle bg-bg-surface rounded-pill flex shrink-0 items-center border"
    >
      {/* Minus: aria-disabled at 0 so focus stays on it. */}
      <button
        type="button" // not a form submit
        aria-label={`One fewer ${honorName}`} // names the honor
        aria-disabled={quantity <= 0} // not `disabled`, so focus stays
        onClick={() => quantity > 0 && onChange(quantity - 1)} // does nothing at 0
        className={BUTTON_BOX}
      >
        −
      </button>
      {/* The number, typed or stepped. */}
      <input
        type="text" // a number input would add spinners and accept "e"
        inputMode="numeric" // number keypad on phones
        aria-label={`Quantity of ${honorName}`} // names the honor
        value={draft ?? String(quantity)} // the typing, or the real quantity
        onFocus={(event) => event.target.select()} // typing replaces the number
        onChange={
          (event) => setDraft(event.target.value.replace(/\D/g, '')) // digits only
        }
        onBlur={commit} // leaving commits
        onKeyDown={(event) => event.key === 'Enter' && commit()} // Enter commits
        className={`${CONTROL_BOX} w-11`}
      />
      {/* Plus: aria-disabled and a new label at 99. */}
      <button
        type="button" // not a form submit
        aria-label={quantity >= MAX_QUANTITY ? `${MAX_QUANTITY} is the most of ${honorName}` : `One more ${honorName}`} // says why it is dead at 99
        aria-disabled={quantity >= MAX_QUANTITY} // not `disabled`, so focus stays
        onClick={() => quantity < MAX_QUANTITY && onChange(quantity + 1)} // does nothing at 99
        className={BUTTON_BOX}
      >
        +
      </button>
    </div>
  )
}
