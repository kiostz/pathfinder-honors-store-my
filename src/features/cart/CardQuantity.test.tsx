// Tests for CardQuantity: Add at 0, the stepper from 1, and where focus goes when the control under it swaps.

import { fireEvent, render, screen, waitFor } from '@testing-library/react' // render, query and wait for the focus tick
import { describe, expect, it, vi } from 'vitest' // test API and mocks
import { useState } from 'react' // a tiny cart for the swap
import { CardQuantity } from './CardQuantity.tsx' // code under test

/**
 * Renders a CardQuantity for Knot Tying that keeps its own quantity, as the cart does.
 * @param start the quantity to start at
 * @return the change spy
 */
function setup(start: number) {
  const onChange = vi.fn() // records every committed quantity
  /** A host that holds the quantity so the control re-renders on a change. */
  function Host() {
    const [quantity, setQuantity] = useState(start) // the cart's quantity for this honor
    return (
      <CardQuantity
        honorName="Knot Tying"
        quantity={quantity}
        onChange={(next) => {
          onChange(next) // record
          setQuantity(next) // and apply
        }}
      />
    )
  }
  render(<Host />)
  return { onChange }
}

describe('CardQuantity', () => {
  it('shows Add and no stepper at 0', () => {
    // catches: a stepper on every card before anything is picked
    setup(0)
    expect(screen.getByRole('button', { name: 'Add Knot Tying' })).toHaveTextContent('Add')
    expect(screen.queryByRole('group')).not.toBeInTheDocument()
  })

  it('turns Add into a stepper at 1 with focus on One more', async () => {
    // catches: focus dropped to the page when the Add button unmounts
    const { onChange } = setup(0)
    fireEvent.click(screen.getByRole('button', { name: 'Add Knot Tying' }))
    expect(onChange).toHaveBeenCalledWith(1)
    expect(screen.queryByRole('button', { name: 'Add Knot Tying' })).not.toBeInTheDocument()
    expect(screen.getByRole('textbox', { name: 'Quantity of Knot Tying' })).toHaveValue('1')
    await waitFor(() => expect(screen.getByRole('button', { name: 'One more Knot Tying' })).toHaveFocus())
  })

  it('does not move focus when it mounts already holding a quantity', () => {
    // catches: a card that steals focus when a search shows it again
    setup(2)
    expect(document.body).toHaveFocus()
  })

  it('brings Add back with focus when minus takes 1 to 0', async () => {
    // catches: focus lost when the stepper unmounts under the buyer's thumb
    const { onChange } = setup(1)
    fireEvent.click(screen.getByRole('button', { name: 'One fewer Knot Tying' }))
    expect(onChange).toHaveBeenCalledWith(0)
    await waitFor(() => expect(screen.getByRole('button', { name: 'Add Knot Tying' })).toHaveFocus())
  })

  it('brings Add back when 0 is typed and Enter pressed', async () => {
    // catches: a stepper stuck showing 0 after the buyer types it
    setup(3)
    const field = screen.getByRole('textbox', { name: 'Quantity of Knot Tying' })
    fireEvent.change(field, { target: { value: '0' } })
    fireEvent.keyDown(field, { key: 'Enter' })
    await waitFor(() => expect(screen.getByRole('button', { name: 'Add Knot Tying' })).toHaveFocus())
  })

  it('keeps the 99 limit', () => {
    // catches: the card letting a quantity pass 99
    setup(99)
    expect(screen.getByRole('button', { name: '99 is the most of Knot Tying' })).toHaveAttribute(
      'aria-disabled',
      'true',
    )
  })

  it('leaves focus where the buyer moved it when 0 is committed by tabbing away', async () => {
    // catches: Add pulling focus back from the control the buyer tabbed to
    render(
      <>
        <button type="button">Elsewhere</button>
        <CardQuantity honorName="Knot Tying" quantity={1} onChange={() => {}} />
      </>,
    )
    const elsewhere = screen.getByRole('button', { name: 'Elsewhere' })
    const field = screen.getByRole('textbox', { name: 'Quantity of Knot Tying' })
    field.focus() // the buyer is in the field
    fireEvent.change(field, { target: { value: '0' } })
    elsewhere.focus() // and tabs to another control, which commits through blur
    await new Promise((resolve) => setTimeout(resolve, 20)) // past the focus tick
    expect(elsewhere).toHaveFocus()
  })
})
