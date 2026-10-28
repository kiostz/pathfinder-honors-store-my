// Tests for the cart screen: order lines A to Z, edits, removal with Undo, and its loading, error and empty states.

import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react' // render and query
import { useEffect, useRef } from 'react' // seeds the cart
import { describe, expect, it, vi } from 'vitest' // test API and mocks
import type { CatalogueLoad } from '@/features/catalogue/use-catalogue-data.ts' // the load the screen receives
import type { Honor } from '@/shared/data/types.ts' // the shape of an honor
import { CART_STORAGE_KEY } from './cart-storage.ts' // where the cart is kept
import { OrderFormProvider } from '@/features/order/OrderFormProvider.tsx' // the form state the screen shows
import { CartProvider } from './CartProvider.tsx' // the state the screen edits
import { CartScreen } from './CartScreen.tsx' // code under test
import { useCart } from './use-cart.ts' // sets the starting cart

// The real captcha loads hCaptcha's script, which a test must not do; this stand-in ticks and expires on demand.
vi.mock('@/features/order/Captcha.tsx', () => ({
  Captcha: ({ onToken }: { onToken: (token: string | null) => void }) => (
    <div>
      <button type="button" onClick={() => onToken('token-1')}>
        Tick captcha
      </button>
      <button type="button" onClick={() => onToken(null)}>
        Expire captcha
      </button>
    </div>
  ),
}))

const honors: Honor[] = [
  { id: 'knot-tying', name: 'Knot Tying', price: 4 },
  { id: 'ants', name: 'Ants', price: 3.5 },
].map((partial) => ({
  ...partial,
  category: 'Nature',
  skillLevel: null,
  issuedBy: 'General Conference',
  enabled: true,
  image: null,
})) // Knot Tying RM 4.00, Ants RM 3.50

const ready: CatalogueLoad = {
  state: { status: 'ready', honors, settings: { currency: 'MYR', defaultPrice: 4 }, clubs: [] },
  showSkeleton: false,
  retry: () => {},
} // the load as the app hands it over

/**
 * Puts a starting cart in the provider.
 * @param quantities honor id to quantity
 * @return nothing drawn
 */
function Seed({ quantities }: { quantities: Record<string, number> }) {
  const { setQuantity } = useCart() // the cart
  const seeded = useRef(false) // so a re-render does not seed again
  // Fills the cart once, after the first draw.
  useEffect(() => {
    if (seeded.current) return // once only
    seeded.current = true // never seed twice
    for (const [id, quantity] of Object.entries(quantities)) setQuantity(id, quantity) // fill it
  }, [quantities, setQuantity])
  return null
}

/**
 * Renders the screen over a seeded cart.
 * @param quantities the starting cart
 * @param data the load, ready by default
 * @param onBack called by Back to honors and Browse honors
 */
function renderScreen(quantities: Record<string, number>, data: CatalogueLoad = ready, onBack: () => void = () => {}) {
  render(
    <CartProvider honors={honors}>
      <OrderFormProvider>
        <Seed quantities={quantities} />
        <CartScreen data={data} onBack={onBack} />
      </OrderFormProvider>
    </CartProvider>,
  )
}

describe('CartScreen', () => {
  it('shows the invoice note and the order form under the estimated total', () => {
    // catches: the form above the total, or the note missing so the buyer does not know an invoice follows
    renderScreen({ 'knot-tying': 1 })
    const total = screen.getByText('Estimated total')
    const note = screen.getByText("Estimated total at today's prices. The treasurer will email you the invoice.")
    const name = screen.getByLabelText('Name')
    expect(total.compareDocumentPosition(note) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(note.compareDocumentPosition(name) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Send order' })).toBeInTheDocument()
  })

  it('shows no note and no form on an empty cart', () => {
    // catches: an order form that can be pressed with nothing to order
    renderScreen({})
    expect(screen.queryByLabelText('Name')).not.toBeInTheDocument()
    expect(screen.queryByText(/The treasurer will email you the invoice/)).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Send order' })).not.toBeInTheDocument()
  })

  it('lists order lines A to Z with price, quantity and line total, and the estimated total', () => {
    // catches: lines in cart order, a wrong line total, or a total that is not the sum of the lines
    renderScreen({ 'knot-tying': 2, ants: 3 })
    const lines = screen.getAllByRole('listitem')
    expect(lines).toHaveLength(2)
    expect(within(lines[0]).getByText('Ants')).toBeInTheDocument()
    expect(within(lines[0]).getByText('RM 3.50 each')).toBeInTheDocument()
    expect(within(lines[0]).getByRole('textbox', { name: 'Quantity of Ants' })).toHaveValue('3')
    expect(within(lines[0]).getByText('RM 10.50')).toBeInTheDocument()
    expect(within(lines[1]).getByText('Knot Tying')).toBeInTheDocument()
    expect(within(lines[1]).getByText('RM 8.00')).toBeInTheDocument()
    expect(screen.getByText('Estimated total')).toBeInTheDocument()
    expect(screen.getByText('RM 18.50')).toBeInTheDocument()
  })

  it('updates the line and the estimated total on a change', () => {
    // catches: a stepper that edits a copy, leaving the totals stale
    renderScreen({ 'knot-tying': 2 })
    fireEvent.click(screen.getByRole('button', { name: 'One more Knot Tying' }))
    expect(screen.getByRole('textbox', { name: 'Quantity of Knot Tying' })).toHaveValue('3')
    expect(screen.getAllByText('RM 12.00')).toHaveLength(2) // the line and the estimated total
  })

  it('swaps a line set to zero for a removed note in the same place, and Undo restores it', async () => {
    // catches: a removed note that vanishes, shifts the lines below it, or comes back with the wrong quantity
    renderScreen({ ants: 3, 'knot-tying': 2 })
    const field = screen.getByRole('textbox', { name: 'Quantity of Ants' })
    field.focus() // the buyer is typing in it
    fireEvent.change(field, { target: { value: '0' } }) // types 0
    fireEvent.keyDown(field, { key: 'Enter' }) // commits: 3 down to 0
    let lines = screen.getAllByRole('listitem') // the removed note and Knot Tying
    expect(lines).toHaveLength(2)
    expect(within(lines[0]).getByText('Ants removed.')).toBeInTheDocument()
    expect(within(lines[1]).getByText('Knot Tying')).toBeInTheDocument()
    expect(screen.getAllByText('RM 8.00')).toHaveLength(2) // the Knot Tying line and the total, which dropped the removed note
    const undo = within(lines[0]).getByRole('button', { name: 'Undo removing Ants' })
    await waitFor(() => expect(undo).toHaveFocus()) // focus did not fall to the page
    fireEvent.click(undo)
    lines = screen.getAllByRole('listitem') // the line is back
    expect(within(lines[0]).getByRole('textbox', { name: 'Quantity of Ants' })).toHaveValue('3')
    expect(screen.getByText('RM 18.50')).toBeInTheDocument()
    expect(screen.queryByText('Ants removed.')).not.toBeInTheDocument()
  })

  it('shows the note and the empty message when the last line is removed, and Browse honors goes back', () => {
    // catches: no way out of an emptied cart, or the Undo note lost with the last line
    const onBack = vi.fn()
    renderScreen({ 'knot-tying': 1 }, ready, onBack)
    fireEvent.click(screen.getByRole('button', { name: 'One fewer Knot Tying' }))
    expect(screen.getByText('Knot Tying removed.')).toBeInTheDocument()
    expect(screen.getByText('Your cart is empty.')).toBeInTheDocument()
    expect(screen.queryByText('Estimated total')).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('link', { name: 'Browse honors' }))
    expect(onBack).toHaveBeenCalledTimes(1)
  })

  it('shows the empty message for a cart that starts empty', () => {
    // catches: a blank screen under the heading
    renderScreen({})
    expect(screen.getByText('Your cart is empty.')).toBeInTheDocument()
  })

  it('focuses its heading when it opens', () => {
    // catches: keyboard focus left on the link that is no longer on screen
    renderScreen({ 'knot-tying': 1 })
    expect(screen.getByRole('heading', { name: 'Your cart' })).toHaveFocus()
  })

  it('has a Back to honors link that calls onBack', () => {
    // catches: a link that changes the address by itself and disagrees with the back button
    const onBack = vi.fn()
    renderScreen({ 'knot-tying': 1 }, ready, onBack)
    const notPrevented = fireEvent.click(screen.getByRole('link', { name: 'Back to honors' }))
    expect(onBack).toHaveBeenCalledTimes(1)
    expect(notPrevented).toBe(false) // the click's own navigation is cancelled
  })

  it('shows nothing under the heading while loading, then 3 skeleton lines', () => {
    // catches: a skeleton flash on a fast load, or the wrong number of skeleton lines
    const loading: CatalogueLoad = { state: { status: 'loading' }, showSkeleton: false, retry: () => {} }
    const { rerender } = render(
      <CartProvider honors={honors}>
        <CartScreen data={loading} onBack={() => {}} />
      </CartProvider>,
    )
    expect(screen.getByRole('heading', { name: 'Your cart' })).toBeInTheDocument()
    expect(screen.queryAllByTestId('cart-skeleton-line')).toHaveLength(0)
    expect(screen.queryByText('Your cart is empty.')).not.toBeInTheDocument() // not empty, only unknown
    rerender(
      <CartProvider honors={honors}>
        <CartScreen data={{ ...loading, showSkeleton: true }} onBack={() => {}} />
      </CartProvider>,
    )
    expect(screen.getAllByTestId('cart-skeleton-line')).toHaveLength(3)
  })

  it('shows the catalogue error copy and Try again when the load failed', () => {
    // catches: a cart screen with no way to recover from a failed load
    const retry = vi.fn()
    renderScreen({ 'knot-tying': 1 }, { state: { status: 'error' }, showSkeleton: false, retry })
    expect(screen.getByText("We couldn't load the honors. Check your connection and try again.")).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }))
    expect(retry).toHaveBeenCalledTimes(1)
  })

  it('moves focus to the number field after Undo', async () => {
    // catches: focus falling to the page when Undo disappears, which strands a keyboard user
    renderScreen({ ants: 3 })
    fireEvent.click(screen.getByRole('button', { name: 'One fewer Ants' })) // 3 down to 2
    const field = screen.getByRole('textbox', { name: 'Quantity of Ants' })
    field.focus() // the buyer is typing in it
    fireEvent.change(field, { target: { value: '0' } })
    fireEvent.keyDown(field, { key: 'Enter' })
    fireEvent.click(screen.getByRole('button', { name: 'Undo removing Ants' }))
    await waitFor(() => expect(screen.getByRole('textbox', { name: 'Quantity of Ants' })).toHaveFocus())
  })

  it('keeps the removed note at the height it had', () => {
    // catches: a removal that collapses the line, so the lines below jump up
    const height = vi.spyOn(HTMLElement.prototype, 'offsetHeight', 'get').mockReturnValue(137) // jsdom has no layout
    renderScreen({ ants: 3, 'knot-tying': 2 })
    const field = screen.getByRole('textbox', { name: 'Quantity of Ants' })
    fireEvent.change(field, { target: { value: '0' } })
    fireEvent.keyDown(field, { key: 'Enter' })
    expect(screen.getAllByRole('listitem')[0]).toHaveStyle({ minHeight: '137px' })
    expect(screen.getAllByRole('listitem')[1].style.minHeight).toBe('') // only the removed note is held
    height.mockRestore() // layout back to jsdom's
  })

  it('leaves focus where the buyer tapped when a zero is committed by moving to another field', async () => {
    // catches: Undo stealing focus from the field the buyer just chose, which closes a phone keyboard
    renderScreen({ ants: 3, 'knot-tying': 2 })
    const ants = screen.getByRole('textbox', { name: 'Quantity of Ants' })
    const knots = screen.getByRole('textbox', { name: 'Quantity of Knot Tying' })
    ants.focus()
    fireEvent.change(ants, { target: { value: '0' } })
    act(() => knots.focus()) // blur commits the zero, focus ends on the other field
    expect(screen.getByText('Ants removed.')).toBeInTheDocument()
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 20)) // longer than the focus move's one tick
    })
    expect(screen.getByRole('textbox', { name: 'Quantity of Knot Tying' })).toHaveFocus()
  })

  it('does not even briefly focus Undo while focus is still on its way to the tapped field', async () => {
    // catches: a focus move that runs in the same tick as the blur, when the browser still reports the page as focused, so Undo steals focus
    renderScreen({ ants: 3, 'knot-tying': 2 }) // two lines
    const ants = screen.getByRole('textbox', { name: 'Quantity of Ants' }) // the field set to zero
    const knots = screen.getByRole('textbox', { name: 'Quantity of Knot Tying' }) // the field the buyer taps next
    const focused: string[] = [] // every element that received focus
    const record = (event: FocusEvent) =>
      focused.push((event.target as HTMLElement).tagName + ':' + (event.target as HTMLElement).textContent) // who got focus
    document.addEventListener('focusin', record) // listen for any focus
    ants.focus() // the buyer is typing
    fireEvent.change(ants, { target: { value: '0' } }) // a zero
    act(() => ants.blur()) // the blur commits the zero; focus is on the page for this moment
    act(() => knots.focus()) // the tapped field takes it, in the same tick
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 20)) // longer than the focus move's one tick
    }) // let the timer run
    document.removeEventListener('focusin', record) // stop listening
    expect(focused.filter((entry) => entry.startsWith('BUTTON:Undo'))).toEqual([]) // Undo never had focus
    expect(knots).toHaveFocus()
  })
})

describe('CartScreen notice for honors taken out', () => {
  /**
   * Renders the screen over a stored cart, as a reload does.
   * @param stored honor id to quantity in storage
   * @param honorsNow the honors the load holds
   */
  function renderStored(stored: Record<string, number>, honorsNow: Honor[]) {
    window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify({ version: 1, quantities: stored }))
    render(
      <CartProvider honors={honorsNow}>
        <OrderFormProvider>
          <CartScreen
            data={{
              ...ready,
              state: { status: 'ready', honors: honorsNow, settings: { currency: 'MYR', defaultPrice: 4 }, clubs: [] },
            }}
            onBack={() => {}}
          />
        </OrderFormProvider>
      </CartProvider>,
    )
  }
  const withAfrica = [...honors, { ...honors[0], id: 'africa-lore', name: 'Africa Lore', enabled: false }] // a switched-off honor too

  it('names a switched-off honor taken out', () => {
    // catches: a honor vanishing from the cart with no word
    renderStored({ 'knot-tying': 1, 'africa-lore': 2 }, withAfrica)
    expect(screen.getByText('Africa Lore is no longer available and was taken out of your cart.')).toBeInTheDocument()
  })

  it('joins two names', () => {
    // catches: a notice that shows only the first name, or the wrong verb
    renderStored({ 'knot-tying': 1, 'africa-lore': 2 }, [{ ...honors[0], enabled: false }, honors[1], withAfrica[2]])
    expect(
      screen.getByText('Africa Lore and Knot Tying are no longer available and were taken out of your cart.'),
    ).toBeInTheDocument()
  })

  it('counts a honor missing from the data as 1 honor', () => {
    // catches: a gone honor shown by its id, or not shown
    renderStored({ ants: 1, 'no-such-honor': 2 }, honors)
    expect(screen.getByText('1 honor is no longer available and was taken out of your cart.')).toBeInTheDocument()
  })

  it('shows no notice when nothing was taken out', () => {
    // catches: a notice on every cart screen
    renderStored({ ants: 1 }, honors)
    expect(screen.queryByText(/no longer available/)).not.toBeInTheDocument()
  })
})
