// Tests for CartProvider: start from storage, write each change, take unavailable honors out once honors load.

import { StrictMode } from 'react' // React's double render and double effect run in development
import { act, fireEvent, render, screen } from '@testing-library/react' // render and query
import { beforeEach, describe, expect, it, vi } from 'vitest' // test API and mocks
import type { Honor } from '@/shared/data/types.ts' // the shape of an honor
import { CART_STORAGE_KEY } from './cart-storage.ts' // the key under test
import { CartProvider } from './CartProvider.tsx' // code under test
import { useCart } from './use-cart.ts' // reads the cart

const honors: Honor[] = [
  { id: 'knot-tying', name: 'Knot Tying', enabled: true },
  { id: 'africa-lore', name: 'Africa Lore', enabled: false },
  { id: 'ants', name: 'Ants', enabled: true },
].map((partial) => ({
  ...partial,
  category: 'Nature',
  skillLevel: null,
  issuedBy: 'General Conference',
  price: 4,
  image: null,
})) // Africa Lore is switched off

/**
 * Shows the cart as text and offers one button to change it.
 * @return the quantities, the notice values and a button
 */
function Probe() {
  const { quantities, setQuantity, unavailableNames, unavailableUnnamed } = useCart() // the cart
  return (
    <>
      <p data-testid="quantities">{JSON.stringify(quantities)}</p>
      <p data-testid="names">{unavailableNames.join('|')}</p>
      <p data-testid="unnamed">{unavailableUnnamed}</p>
      <button onClick={() => setQuantity('knot-tying', 5)}>five knots</button>
    </>
  )
}

/**
 * Renders the probe inside a provider.
 * @param honorsNow the honors prop
 * @return RTL's rerender, which keeps the probe
 */
function renderProvider(honorsNow: Honor[] | null) {
  const view = render(
    <CartProvider honors={honorsNow}>
      <Probe />
    </CartProvider>,
  )
  return (next: Honor[] | null) =>
    view.rerender(
      <CartProvider honors={next}>
        <Probe />
      </CartProvider>,
    )
}

describe('CartProvider', () => {
  beforeEach(() => {
    vi.restoreAllMocks() // fresh spies
  })

  it('starts from the stored cart', () => {
    // catches: a reload that forgets the cart
    window.localStorage.setItem(CART_STORAGE_KEY, '{"version":1,"quantities":{"knot-tying":2}}')
    renderProvider(null)
    expect(screen.getByTestId('quantities')).toHaveTextContent('{"knot-tying":2}')
  })

  it('writes each change at once', () => {
    // catches: a save that waits, or a stale value after the last change
    renderProvider(null)
    fireEvent.click(screen.getByText('five knots'))
    expect(window.localStorage.getItem(CART_STORAGE_KEY)).toBe('{"version":1,"quantities":{"knot-tying":5}}')
  })

  it('does not write on start, so a failed load leaves the stored value as it was', () => {
    // catches: a start-up write that replaces a bad or unread stored cart with an empty one
    window.localStorage.setItem(CART_STORAGE_KEY, 'not json')
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    renderProvider(null)
    expect(window.localStorage.getItem(CART_STORAGE_KEY)).toBe('not json')
  })

  it('takes nothing out while honors is null', () => {
    // catches: an emptied cart while the data is still loading or after a failed load
    window.localStorage.setItem(CART_STORAGE_KEY, '{"version":1,"quantities":{"africa-lore":1,"gone":2}}')
    renderProvider(null)
    expect(screen.getByTestId('quantities')).toHaveTextContent('{"africa-lore":1,"gone":2}')
    expect(window.localStorage.getItem(CART_STORAGE_KEY)).toBe('{"version":1,"quantities":{"africa-lore":1,"gone":2}}')
  })

  it('takes out switched-off and missing honors when honors arrive, and writes', () => {
    // catches: a switched-off honor staying in the cart, or the stored cart keeping it
    window.localStorage.setItem(
      CART_STORAGE_KEY,
      '{"version":1,"quantities":{"knot-tying":2,"africa-lore":1,"no-such-honor":3}}',
    )
    const rerender = renderProvider(null)
    act(() => rerender(honors))
    expect(screen.getByTestId('quantities')).toHaveTextContent('{"knot-tying":2}')
    expect(screen.getByTestId('names')).toHaveTextContent('Africa Lore')
    expect(screen.getByTestId('unnamed')).toHaveTextContent('1')
    expect(window.localStorage.getItem(CART_STORAGE_KEY)).toBe('{"version":1,"quantities":{"knot-tying":2}}')
  })

  it('takes out once and writes once under StrictMode, keeping only the kept ids', () => {
    // catches: a render-phase take-out that doubles its notice or its stored write when React renders twice
    window.localStorage.setItem(
      CART_STORAGE_KEY,
      '{"version":1,"quantities":{"knot-tying":2,"africa-lore":1,"no-such-honor":3}}',
    ) // a stored cart with a switched-off and a missing honor
    const setItem = vi.spyOn(Storage.prototype, 'setItem') // counts the writes
    const tree = (honorsNow: Honor[] | null) => (
      <StrictMode>
        <CartProvider honors={honorsNow}>
          <Probe />
        </CartProvider>
      </StrictMode>
    ) // the same provider under StrictMode
    const view = render(tree(null)) // still loading
    act(() => view.rerender(tree(honors))) // honors arrive
    expect(screen.getByTestId('quantities')).toHaveTextContent('{"knot-tying":2}')
    expect(screen.getByTestId('names')).toHaveTextContent(/^Africa Lore$/) // exactly one name, so a doubled notice fails
    expect(screen.getByTestId('unnamed')).toHaveTextContent('1')
    expect(setItem.mock.calls.map(([, value]) => value)).toEqual(['{"version":1,"quantities":{"knot-tying":2}}']) // one write
  })

  it('keeps working in memory when storage throws', () => {
    // catches: blocked storage breaking the cart
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked')
    })
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('full')
    })
    renderProvider(honors)
    fireEvent.click(screen.getByText('five knots'))
    expect(screen.getByTestId('quantities')).toHaveTextContent('{"knot-tying":5}')
  })
})
