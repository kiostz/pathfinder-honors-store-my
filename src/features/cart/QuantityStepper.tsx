// The quantity stepper [ - n + ] for one honor: 0 to 99 by buttons or a typed number, so a buyer can order fast without a keypad detour.

import { useState } from 'react' // the text being typed
import { TrashIcon } from './cart-icons.tsx' // the trash at 1
import { clampQuantity, MAX_QUANTITY } from './cart.ts' // the 0 to 99 rule

const CONTROL_BOX =
  'size-11 bg-transparent text-center text-lg focus-visible:outline-focus-ring focus-visible:outline-2 focus-visible:-outline-offset-2' // 44 px square inside the pill, ring drawn inside so the pill's edge does not clip it
const BUTTON_BOX = `${CONTROL_BOX} rounded-pill transition-transform duration-(--duration-press) active:scale-[0.97] aria-disabled:opacity-40` // press feedback, dimmed at a limit
const CART_CONTROL_BOX =
  'h-11 w-11 shrink-0 rounded-pill bg-transparent text-center text-lg text-accent focus-visible:outline-focus-ring focus-visible:outline-2 focus-visible:outline-offset-0' // 44 px tap area on a 36 px pill; the ring is drawn round the control, so it sits outside the soft fill
const CART_BUTTON_BOX = `${CART_CONTROL_BOX} flex items-center justify-center transition-transform duration-(--duration-press) active:scale-[0.97] aria-disabled:opacity-40` // press feedback, dimmed at a limit

/**
 * Draws the stepper.
 * @param honorName the honor's name, used in the labels
 * @param quantity the quantity now, 0 to 99
 * @param onChange called with the new quantity when a button or the typed number commits it
 * @param trashAtOne the cart's look and behaviour: a 36 px soft pill, and at 1 the minus is a red trash that calls onChange(0); false keeps the outlined card stepper
 * @return a group with minus, the number field and plus
 */
export function QuantityStepper({
  honorName,
  quantity,
  onChange,
  trashAtOne = false,
}: {
  honorName: string
  quantity: number
  onChange: (quantity: number) => void
  trashAtOne?: boolean
}) {
  const [draft, setDraft] = useState<string | null>(null) // what the buyer is typing, null when not typing

  /** Commits the typed number; empty means 0. */
  const commit = () => {
    if (draft === null) return // nothing typed
    const next = clampQuantity(draft === '' ? 0 : Number(draft)) // 0 to 99
    setDraft(null) // show the real quantity again
    if (next !== quantity) onChange(next) // only a real change
  }

  const control = trashAtOne ? CART_CONTROL_BOX : CONTROL_BOX // the cart's controls or the card's
  const button = trashAtOne ? CART_BUTTON_BOX : BUTTON_BOX // the cart's buttons or the card's
  return (
    // One labelled group so a screen reader names all three controls together.
    <div
      role="group" // one named group
      aria-label={`Quantity of ${honorName}`} // names the honor
      className={`rounded-pill flex shrink-0 items-center ${trashAtOne ? 'bg-bg-soft h-9' : 'border-border-subtle bg-bg-surface border'}`} // the cart's pill is 36 px soft; the card's is outlined
    >
      {/* Minus, or the cart's red trash at 1; aria-disabled at 0 so focus stays. */}
      {trashAtOne && quantity === 1 ? (
        <button
          type="button" // not a form submit
          aria-label={`Remove ${honorName}`} // names the honor
          onClick={() => onChange(0)} // a removal, like a typed 0
          className={`${button} text-trash`} // red, not the pill's navy
        >
          <TrashIcon />
        </button>
      ) : (
        <button
          type="button" // not a form submit
          aria-label={`One fewer ${honorName}`} // names the honor
          aria-disabled={quantity <= 0} // not `disabled`, so focus stays
          onClick={() => quantity > 0 && onChange(quantity - 1)} // does nothing at 0
          className={button}
        >
          −
        </button>
      )}
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
        className={`${control} w-11`}
      />
      {/* Plus: aria-disabled and a new label at 99. */}
      <button
        type="button" // not a form submit
        aria-label={quantity >= MAX_QUANTITY ? `${MAX_QUANTITY} is the most of ${honorName}` : `One more ${honorName}`} // says why it is dead at 99
        aria-disabled={quantity >= MAX_QUANTITY} // not `disabled`, so focus stays
        onClick={() => quantity < MAX_QUANTITY && onChange(quantity + 1)} // does nothing at 99
        className={button}
      >
        +
      </button>
    </div>
  )
}
