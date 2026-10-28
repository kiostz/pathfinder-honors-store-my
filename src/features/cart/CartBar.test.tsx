// Tests for the cart bar: hidden while empty, then the item count and estimated total, through a provider.

import { fireEvent, render, screen } from '@testing-library/react' // render and query
import { describe, expect, it } from 'vitest' // test API
import type { Honor } from '@/shared/data/types.ts' // the shape of an honor
import { CartBar } from './CartBar.tsx' // code under test
import { CartProvider } from './CartProvider.tsx' // the state the bar reads
import { useCart } from './use-cart.ts' // reads the cart

const honors: Honor[] = ['knot-tying', 'ants'].map((id) => ({
  id,
  name: id === 'ants' ? 'Ants' : 'Knot Tying',
  category: 'Nature',
  skillLevel: null,
  issuedBy: 'General Conference',
  enabled: true,
  price: 4,
  image: null,
})) // two honors at RM 4

/**
 * Renders the bar with buttons that set quantities.
 * @return nothing; query the screen
 */
function renderBar() {
  /**
   * Test buttons that stand in for the steppers.
   * @return one button per quantity change
   */
  function Controls() {
    const { setQuantity } = useCart() // the same state the bar reads
    return (
      <>
        <button onClick={() => setQuantity('knot-tying', 2)}>two knots</button>
        <button onClick={() => setQuantity('ants', 3)}>three ants</button>
        <button onClick={() => setQuantity('knot-tying', 0)}>no knots</button>
        <button onClick={() => setQuantity('ants', 0)}>no ants</button>
        <button onClick={() => setQuantity('ants', 1)}>one ant</button>
      </>
    )
  }
  render(
    <CartProvider>
      <CartBar honors={honors} currency="MYR" />
      <Controls />
    </CartProvider>,
  )
}

describe('CartBar', () => {
  it('is hidden and inert while the cart is empty', () => {
    // catches: an empty bar visible or focusable at the bottom of the page
    renderBar()
    expect(screen.getByTestId('cart-bar')).toHaveAttribute('inert')
  })

  it('shows 5 items and RM 20.00 for 2 x Knot Tying and 3 x another', () => {
    // catches: counting lines instead of quantities, or a wrong estimated total
    renderBar()
    fireEvent.click(screen.getByText('two knots'))
    fireEvent.click(screen.getByText('three ants'))
    const bar = screen.getByTestId('cart-bar')
    expect(bar).not.toHaveAttribute('inert')
    expect(bar).toHaveTextContent('5 items')
    expect(bar).toHaveTextContent(/Estimated total RM\s?20\.00/)
  })

  it('says "1 item" for one', () => {
    // catches: "1 items"
    renderBar()
    fireEvent.click(screen.getByText('one ant'))
    expect(screen.getByTestId('cart-bar')).toHaveTextContent('1 item')
    expect(screen.getByTestId('cart-bar')).not.toHaveTextContent('1 items')
  })

  it('is hidden again when every quantity is 0', () => {
    // catches: a bar left over an empty cart
    renderBar()
    fireEvent.click(screen.getByText('two knots'))
    fireEvent.click(screen.getByText('no knots'))
    expect(screen.getByTestId('cart-bar')).toHaveAttribute('inert')
  })

  it('announces the count in a polite live region', () => {
    // catches: a screen reader user never hearing that the cart changed
    renderBar()
    fireEvent.click(screen.getByText('two knots'))
    expect(screen.getByRole('status')).toHaveTextContent('2 items')
  })

  it('has the live region before the first add, outside the inert bar, and fills that same element', () => {
    // catches: the first add going unannounced because the region entered the accessibility tree in the same render as its text
    renderBar()
    const region = screen.getByRole('status') // present while the cart is empty
    expect(region.closest('[inert]')).toBeNull()
    expect(region).toBeEmptyDOMElement()
    fireEvent.click(screen.getByText('one ant'))
    expect(screen.getByRole('status')).toBe(region)
    expect(region).toHaveTextContent('1 item')
    expect(region.closest('[inert]')).toBeNull()
  })

  it('keeps the last count and total in the bar while it slides away', () => {
    // catches: a flash of "0 items" and "RM 0.00" during the exit transition
    renderBar()
    fireEvent.click(screen.getByText('two knots'))
    fireEvent.click(screen.getByText('no knots'))
    const bar = screen.getByTestId('cart-bar')
    expect(bar).toHaveAttribute('inert')
    expect(bar).toHaveTextContent('2 items')
    expect(bar).toHaveTextContent(/Estimated total RM\s?8\.00/)
    expect(bar).not.toHaveTextContent('0 items')
  })
})
