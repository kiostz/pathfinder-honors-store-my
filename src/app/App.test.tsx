// Tests for App: the header and the catalogue under it, with fetch mocked at the boundary.

import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react' // render and query the page
import { afterEach, describe, expect, it, vi } from 'vitest' // test API and mocks
import { CART_STORAGE_KEY } from '@/features/cart/cart-storage.ts' // the stored cart's key
import { writeSentOrder } from '@/features/order/sent-order-storage.ts' // fills the stored order
import { App } from './App.tsx' // code under test

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

afterEach(() => {
  window.sessionStorage.clear() // no sent order left
  vi.unstubAllGlobals() // restore fetch
  vi.restoreAllMocks() // a spy left by a failed test must not leak into the next case
  window.location.hash = '' // back to the catalogue address
})

/** Makes the global fetch answer with two honors at RM 4 and the settings. */
function serveTwoHonors() {
  /**
   * Builds one honor at RM 4.
   * @param id the honor id
   * @param name the honor name
   * @return the honor
   */
  const honor = (id: string, name: string) => ({
    id,
    name,
    category: 'Recreation',
    skillLevel: null,
    issuedBy: 'General Conference',
    enabled: true,
    price: 4,
    image: null,
  }) // one honor
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: string) =>
      url.endsWith('clubs.json')
        ? new Response('[]')
        : url.endsWith('settings.json')
          ? new Response(JSON.stringify({ currency: 'MYR', defaultPrice: 4 }))
          : new Response(JSON.stringify([honor('knot-tying', 'Knot Tying'), honor('ants', 'Ants')])),
    ),
  ) // both files answer
}

describe('App', () => {
  it('shows the header with the site name and the theme control, and the catalogue', async () => {
    // catches: the shell rendering without the catalogue, without its header, or without the theme control in it
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string) =>
        url.endsWith('clubs.json')
          ? new Response('[]')
          : url.endsWith('settings.json')
            ? new Response(JSON.stringify({ currency: 'MYR', defaultPrice: 4 }))
            : new Response(
                JSON.stringify([
                  {
                    id: 'knot-tying',
                    name: 'Knot Tying',
                    category: 'Recreation',
                    skillLevel: null,
                    issuedBy: 'General Conference',
                    enabled: true,
                    price: 4,
                    image: null,
                  },
                ]),
              ),
      ),
    ) // one honor
    render(<App />)
    const header = screen.getByRole('banner') // the header band
    expect(within(header).getByRole('heading', { name: 'Pathfinder Honors' })).toBeInTheDocument()
    expect(within(header).getByRole('combobox', { name: 'Theme' })).toHaveValue('system')
    expect(await screen.findByText('Knot Tying')).toBeInTheDocument()
  })

  it('updates the cart bar when + is pressed on a row', async () => {
    // catches: steppers and bar holding separate state, or a bar that never appears
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string) =>
        url.endsWith('clubs.json')
          ? new Response('[]')
          : url.endsWith('settings.json')
            ? new Response(JSON.stringify({ currency: 'MYR', defaultPrice: 4 }))
            : new Response(
                JSON.stringify([
                  {
                    id: 'knot-tying',
                    name: 'Knot Tying',
                    category: 'Recreation',
                    skillLevel: null,
                    issuedBy: 'General Conference',
                    enabled: true,
                    price: 4,
                    image: null,
                  },
                ]),
              ),
      ),
    ) // one honor at RM 4
    render(<App />)
    fireEvent.click(await screen.findByRole('button', { name: 'One more Knot Tying' }))
    fireEvent.click(screen.getByRole('button', { name: 'One more Knot Tying' }))
    expect(screen.getByTestId('cart-bar')).not.toHaveAttribute('inert')
    expect(screen.getByTestId('cart-bar')).toHaveTextContent('2 items')
    expect(screen.getByTestId('cart-bar')).toHaveTextContent(/Estimated total RM\s?8\.00/)
  })

  it('shows no cart bar when the load fails', async () => {
    // catches: a bar over an error screen
    vi.spyOn(console, 'error').mockImplementation(() => {}) // the failed load is logged
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('nope', { status: 500 })),
    ) // every file fails
    render(<App />)
    await screen.findByRole('button', { name: 'Try again' })
    expect(screen.queryByTestId('cart-bar')).not.toBeInTheDocument()
    vi.restoreAllMocks() // put console back
  })

  it('has no footer', async () => {
    // catches: a wiki credit footer coming back
    vi.stubGlobal(
      'fetch',
      vi.fn(() => new Promise(() => {})),
    ) // never answers; the shell alone is checked
    render(<App />)
    expect(screen.queryByRole('contentinfo')).not.toBeInTheDocument()
  })

  it('opens the cart from the bar with its heading focused and the title changed', async () => {
    // catches: a bar that does not lead to the cart, focus left behind, or a stale tab title
    serveTwoHonors()
    render(<App />)
    fireEvent.click(await screen.findByRole('button', { name: 'One more Knot Tying' }))
    expect(document.title).toBe('Pathfinder Honors')
    fireEvent.click(screen.getByRole('link', { name: /View cart/ }))
    const heading = await screen.findByRole('heading', { name: 'Your cart' })
    expect(heading).toHaveFocus()
    expect(document.title).toBe('Your cart · Pathfinder Honors')
    expect(screen.queryByTestId('cart-bar')).not.toBeInTheDocument() // no bar on the cart screen
    expect(screen.getByText('Estimated total')).toBeInTheDocument()
  })

  it('keeps a typed search in the hidden catalogue and focuses the bar on return', async () => {
    // catches: a catalogue that is rebuilt on return and loses the search, or focus dropped on the page
    serveTwoHonors()
    render(<App />)
    fireEvent.change(await screen.findByRole('searchbox', { name: 'Search honors' }), { target: { value: 'knot' } })
    fireEvent.click(screen.getByRole('button', { name: 'One more Knot Tying' }))
    fireEvent.click(screen.getByRole('link', { name: /View cart/ }))
    await screen.findByRole('heading', { name: 'Your cart' })
    fireEvent.click(screen.getByRole('link', { name: 'Back to honors' }))
    await waitFor(() => expect(screen.queryByRole('heading', { name: 'Your cart' })).not.toBeInTheDocument())
    expect(screen.getByRole('searchbox', { name: 'Search honors' })).toHaveValue('knot')
    expect(screen.getByRole('link', { name: /View cart/ })).toHaveFocus()
    expect(document.title).toBe('Pathfinder Honors')
  })

  it('hides the catalogue from readers while the cart shows', async () => {
    // catches: the catalogue staying in the accessibility tree under the cart
    serveTwoHonors()
    render(<App />)
    fireEvent.click(await screen.findByRole('button', { name: 'One more Knot Tying' }))
    fireEvent.click(screen.getByRole('link', { name: /View cart/ }))
    await screen.findByRole('heading', { name: 'Your cart' })
    expect(screen.queryByRole('searchbox', { name: 'Search honors' })).not.toBeInTheDocument()
  })

  it('goes home from a cart opened by address, and focuses main when the cart is empty', async () => {
    // catches: Back to honors that does nothing without history, or focus lost with an empty cart
    serveTwoHonors()
    window.location.hash = '#/cart' // opened by address, not from the catalogue
    render(<App />)
    fireEvent.click(await screen.findByRole('link', { name: 'Browse honors' }))
    expect(await screen.findByRole('searchbox', { name: 'Search honors' })).toBeInTheDocument()
    expect(window.location.hash).toBe('#/')
    expect(screen.getByRole('main')).toHaveFocus()
  })

  it('never leaves the store from Back to honors, even after browser Back into a cart opened by address', async () => {
    // catches: Back to honors calling history.back() for a cart the buyer reached by browser Back, which leaves the site
    serveTwoHonors()
    window.location.hash = '#/cart' // opened by address
    render(<App />)
    fireEvent.click(await screen.findByRole('link', { name: 'Back to honors' }))
    await waitFor(() => expect(screen.queryByRole('heading', { name: 'Your cart' })).not.toBeInTheDocument())
    act(() => window.history.back()) // the buyer presses the browser's Back: the cart again
    await screen.findByRole('heading', { name: 'Your cart' })
    const back = vi.spyOn(window.history, 'back') // from here on, count history moves
    fireEvent.click(screen.getByRole('link', { name: 'Back to honors' }))
    expect(back).not.toHaveBeenCalled()
    expect(await screen.findByRole('searchbox', { name: 'Search honors' })).toBeInTheDocument()
    expect(window.location.hash).toBe('#/')
    back.mockRestore() // put history back
  })

  it.each([
    ['Ctrl click', 'click', { ctrlKey: true }],
    ['Meta click', 'click', { metaKey: true }],
    ['Shift click', 'click', { shiftKey: true }],
    ['Alt click', 'click', { altKey: true }],
    ['middle auxclick', 'auxclick', { button: 1 }],
    ['click with button 1 (defensive: real browsers send auxclick for a middle button)', 'click', { button: 1 }],
  ])(
    'does not mark a cart entry after a %s on View cart that opens another tab',
    async (_label, eventType, eventInit) => {
      // catches: a stale bar-click flag from this click marking a later address-opened cart, so Back to honors leaves the store
      serveTwoHonors() // two honors
      window.location.hash = '#/cart' // opened by address
      render(<App />) // draw the app
      fireEvent.click(await screen.findByRole('link', { name: 'Back to honors' })) // to the catalogue
      fireEvent.click(await screen.findByRole('button', { name: 'One more Knot Tying' })) // pick one
      const bar = screen.getByRole('link', { name: /View cart/ }) // the bar's link
      bar.addEventListener('click', (event) => event.preventDefault()) // a browser opens a new tab: this tab's address stays
      fireEvent(bar, new MouseEvent(eventType, { ...eventInit, bubbles: true, cancelable: true })) // the click under test
      act(() => window.history.back()) // the buyer presses the browser's Back: the address-opened cart
      await screen.findByRole('heading', { name: 'Your cart' }) // the cart shows
      const back = vi.spyOn(window.history, 'back') // count history moves
      fireEvent.click(screen.getByRole('link', { name: 'Back to honors' })) // the link under test
      expect(back).not.toHaveBeenCalled() // went home instead
      expect(await screen.findByRole('searchbox', { name: 'Search honors' })).toBeInTheDocument() // on the catalogue
      back.mockRestore() // put history back
    },
  )

  it('goes back in history from a cart opened by the bar', async () => {
    // catches: Back to honors pushing a new entry when the bar opened the cart, so back and the link disagree
    serveTwoHonors()
    render(<App />)
    fireEvent.click(await screen.findByRole('button', { name: 'One more Knot Tying' }))
    fireEvent.click(screen.getByRole('link', { name: /View cart/ }))
    await screen.findByRole('heading', { name: 'Your cart' })
    const back = vi.spyOn(window.history, 'back') // count history moves
    fireEvent.click(screen.getByRole('link', { name: 'Back to honors' }))
    expect(back).toHaveBeenCalledTimes(1)
    await screen.findByRole('searchbox', { name: 'Search honors' })
    back.mockRestore() // put history back
  })

  it('saves the catalogue scroll on leaving and restores it on return, and the cart opens at the top', async () => {
    // catches: a scroll listener left running on the cart (saving the clamped 0), or no restore on return
    serveTwoHonors()
    const scrollTo = vi.spyOn(window, 'scrollTo').mockImplementation(() => {}) // jsdom does not scroll
    render(<App />)
    fireEvent.click(await screen.findByRole('button', { name: 'One more Knot Tying' }))
    Object.defineProperty(window, 'scrollY', { value: 92, configurable: true })
    fireEvent.scroll(window) // the buyer scrolled to 92
    fireEvent.click(screen.getByRole('link', { name: /View cart/ }))
    await screen.findByRole('heading', { name: 'Your cart' })
    expect(scrollTo).toHaveBeenLastCalledWith(0, 0) // the cart opens at its top
    Object.defineProperty(window, 'scrollY', { value: 0, configurable: true })
    fireEvent.scroll(window) // the hidden catalogue makes the browser clamp to 0; it must not be saved
    fireEvent.click(screen.getByRole('link', { name: 'Back to honors' }))
    await screen.findByRole('searchbox', { name: 'Search honors' })
    expect(scrollTo).toHaveBeenLastCalledWith(0, 92) // back where the buyer was
    delete (window as { scrollY?: number }).scrollY // jsdom's own again
    scrollTo.mockRestore() // put scrollTo back
  })

  it('drops the Unavailable notice when the buyer leaves the cart screen', async () => {
    // catches: a notice kept in the provider that shows again on every later opening of the cart
    const honor = (id: string, name: string, enabled: boolean) => ({
      id,
      name,
      category: 'Recreation',
      skillLevel: null,
      issuedBy: 'General Conference',
      enabled,
      price: 4,
      image: null,
    }) // one honor
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string) =>
        url.endsWith('clubs.json')
          ? new Response('[]')
          : url.endsWith('settings.json')
            ? new Response(JSON.stringify({ currency: 'MYR', defaultPrice: 4 }))
            : new Response(
                JSON.stringify([honor('knot-tying', 'Knot Tying', true), honor('africa-lore', 'Africa Lore', false)]),
              ),
      ),
    ) // Africa Lore is switched off
    window.localStorage.setItem(CART_STORAGE_KEY, '{"version":1,"quantities":{"knot-tying":1,"africa-lore":1}}') // a saved cart holding it
    window.location.hash = '#/cart' // opened by address
    render(<App />)
    expect(await screen.findByText(/Africa Lore is no longer available/)).toBeInTheDocument() // shown once
    fireEvent.click(screen.getByRole('link', { name: 'Back to honors' })) // leave the cart screen
    fireEvent.click(await screen.findByRole('link', { name: /View cart/ })) // open it again
    await screen.findByRole('heading', { name: 'Your cart' })
    expect(screen.queryByText(/no longer available/)).not.toBeInTheDocument() // gone for good
  })

  it('takes over scroll restoration so the saved position wins', () => {
    // catches: the browser restoring the scroll after the app and landing on a clamped value
    serveTwoHonors()
    render(<App />)
    expect(window.history.scrollRestoration).toBe('manual')
  })

  it('keeps a typed name in the order form while the buyer goes back to add an honor and returns', async () => {
    // catches: form values kept inside the cart screen, which unmounts when the buyer goes back to the catalogue
    serveTwoHonors()
    render(<App />)
    fireEvent.click(await screen.findByRole('button', { name: 'One more Knot Tying' }))
    fireEvent.click(screen.getByRole('link', { name: /View cart/ }))
    fireEvent.change(await screen.findByLabelText('Name'), { target: { value: 'Jo Tan' } })
    fireEvent.click(screen.getByRole('link', { name: 'Back to honors' }))
    await waitFor(() => expect(screen.queryByRole('heading', { name: 'Your cart' })).not.toBeInTheDocument())
    fireEvent.click(screen.getByRole('link', { name: /View cart/ }))
    expect(await screen.findByLabelText('Name')).toHaveValue('Jo Tan')
  })

  it('shows the confirmation at #/order-sent with its heading focused, its title and no cart bar or catalogue', async () => {
    // catches: the confirmation address opening the catalogue, a stale title, focus left behind, or a cart bar over the confirmation
    serveTwoHonors()
    window.localStorage.setItem(CART_STORAGE_KEY, '{"version":1,"quantities":{"knot-tying":2}}') // would show a bar on the catalogue
    writeSentOrder({
      number: 'PF-20261028-4K7Q',
      sentAt: '2026-10-28T10:00:00.000Z',
      currency: 'MYR',
      lines: [],
      totalCents: 0,
      name: 'J. Cruz',
      email: 'jc@mail.com',
      phone: '+60 12-345 6789',
      club: { subject: 'Eagles', email: 'Eagles' },
    })
    window.location.hash = '#/order-sent'
    render(<App />)
    const heading = await screen.findByRole('heading', { name: 'Order sent' })
    expect(heading).toHaveFocus()
    expect(document.title).toBe('Order sent · Pathfinder Honors')
    expect(screen.getByText('PF-20261028-4K7Q')).toBeInTheDocument()
    expect(screen.queryByTestId('cart-bar')).not.toBeInTheDocument()
    expect(screen.queryByRole('searchbox', { name: 'Search honors' })).not.toBeInTheDocument()
  })

  it('sends an order from the cart and lands on the confirmation with an empty cart', async () => {
    // catches: pieces that work alone but do not join: the cart not cleared, no confirmation, or the number not shown
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string) =>
        url.includes('web3forms')
          ? new Response(JSON.stringify({ success: true }))
          : url.endsWith('clubs.json')
            ? new Response('[]')
            : url.endsWith('settings.json')
              ? new Response(JSON.stringify({ currency: 'MYR', defaultPrice: 4 }))
              : new Response(
                  JSON.stringify([
                    {
                      id: 'knot-tying',
                      name: 'Knot Tying',
                      category: 'Recreation',
                      skillLevel: null,
                      issuedBy: 'General Conference',
                      enabled: true,
                      price: 4,
                      image: null,
                    },
                  ]),
                ),
      ),
    ) // data files and Web3Forms answer
    render(<App />)
    fireEvent.click(await screen.findByRole('button', { name: 'One more Knot Tying' }))
    fireEvent.click(screen.getByRole('link', { name: /View cart/ }))
    fireEvent.change(await screen.findByLabelText('Name'), { target: { value: 'Jo Tan' } })
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'jc@mail.com' } })
    fireEvent.change(screen.getByLabelText('Phone'), { target: { value: '0312345678' } })
    fireEvent.change(screen.getByLabelText('Club name'), { target: { value: 'Hilltop Club' } })
    fireEvent.click(screen.getByRole('button', { name: 'Tick captcha' }))
    fireEvent.click(screen.getByRole('button', { name: 'Send order' }))
    expect(await screen.findByRole('heading', { name: 'Order sent' })).toHaveFocus()
    expect(screen.getByText(/^PF-\d{8}-[2-9A-HJKMNP-Z]{4}$/)).toBeInTheDocument()
    expect(window.localStorage.getItem(CART_STORAGE_KEY)).toBe('{"version":1,"quantities":{}}')
    expect(screen.queryByTestId('cart-bar')).not.toBeInTheDocument()
  })
})
