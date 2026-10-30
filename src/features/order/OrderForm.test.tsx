// Tests for the order form: errors once a field is left, Send order's looks and missing line, the Other field, the captcha, and sending with its failure, retry and success.

import { act, fireEvent, render, screen, waitFor } from '@testing-library/react' // render and query
import { useImperativeHandle, useState, type Ref } from 'react' // the stand-in captcha's reset handle
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest' // test API and mocks
import { CART_STORAGE_KEY } from '@/features/cart/cart-storage.ts' // the stored cart
import { CartProvider } from '@/features/cart/CartProvider.tsx' // the cart the form clears
import { useCart } from '@/features/cart/use-cart.ts' // reads the cart
import type { OrderLine } from '@/features/cart/cart.ts' // an order line
import type { Club } from '@/shared/data/types.ts' // the club shape
import { OrderForm } from './OrderForm.tsx' // code under test
import { OrderFormProvider } from './OrderFormProvider.tsx' // the form state
import { SENT_ORDER_STORAGE_KEY } from './sent-order-storage.ts' // where a sent order is kept

const captcha = vi.hoisted(() => ({ reset: vi.fn() })) // counts resets, shared with the mock

// The real captcha loads hCaptcha's script, which a test must not do; this stand-in ticks and expires on demand, and counts resets.
vi.mock('./Captcha.tsx', () => ({
  Captcha: ({ onToken, ref }: { onToken: (token: string | null) => void; ref?: Ref<{ reset: () => void }> }) => {
    useImperativeHandle(ref, () => ({ reset: captcha.reset }), []) // the form's handle
    return (
      <div>
        <button type="button" onClick={() => onToken('token-1')}>
          Tick captcha
        </button>
        <button type="button" onClick={() => onToken(null)}>
          Expire captcha
        </button>
        {/* The widget's frame, which takes focus after a reset. */}
        <iframe title="Captcha frame" />
      </div>
    )
  },
}))

beforeEach(() => {
  captcha.reset.mockClear() // no earlier resets
})

afterEach(() => {
  vi.unstubAllGlobals() // fetch back
  vi.unstubAllEnvs() // the fake-send switch back
  vi.useRealTimers() // a fake clock must not leak
  vi.restoreAllMocks() // spies removed
  window.sessionStorage.clear() // no sent order left
  window.location.hash = '' // back to the catalogue address
})

const clubs: Club[] = [{ name: 'Eagles', area: null, language: null, location: null, churchName: null }] // one club

const honor = {
  id: 'knot-tying',
  name: 'Knot Tying',
  category: 'Nature',
  skillLevel: null,
  issuedBy: 'General Conference',
  enabled: true,
  price: 3,
  image: null,
} as const // one honor at RM 3
const lines: OrderLine[] = [{ honor, quantity: 3 }] // RM 9.00

/**
 * Shows the cart as text and offers the catalogue's edits a buyer can make while an order is sending.
 * @return the quantities and two buttons
 */
function CartProbe() {
  const { quantities, setQuantity } = useCart() // the cart
  return (
    <>
      <p data-testid="cart">{JSON.stringify(quantities)}</p>
      <button onClick={() => setQuantity('ants', 2)}>Add two Ants</button>
      <button onClick={() => setQuantity('knot-tying', 1)}>Lower Knot Tying to one</button>
      <button onClick={() => setQuantity('knot-tying', 5)}>Raise Knot Tying to five</button>
    </>
  )
}

/**
 * Renders the form inside its providers, over a stored cart of three Knot Tying.
 * @param clubList the clubs to offer
 */
function renderForm(clubList: Club[] = clubs) {
  window.localStorage.setItem(CART_STORAGE_KEY, '{"version":1,"quantities":{"knot-tying":3}}') // the cart whose sent lines the form removes
  render(
    <CartProvider honors={null}>
      <OrderFormProvider>
        <CartProbe />
        <OrderForm lines={lines} currency="MYR" clubs={clubList} />
      </OrderFormProvider>
    </CartProvider>,
  )
}

/** Fills every field validly. */
function fillValid() {
  fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Jo Tan' } })
  fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'jc@mail.com' } })
  fireEvent.change(screen.getByLabelText('Phone'), { target: { value: '+60 12-345 6789' } })
  fireEvent.change(screen.getByRole('combobox', { name: 'Club' }), { target: { value: 'Eagles' } })
}

describe('OrderForm', () => {
  it('marks every field required for screen readers while the form stays unvalidated by the browser', () => {
    // catches: a field read out as optional until an error shows, or native validation bubbles replacing the site's errors
    renderForm()
    fireEvent.change(screen.getByRole('combobox', { name: 'Club' }), { target: { value: 'other' } }) // reveals Club name
    for (const label of ['Name', 'Email', 'Phone', 'Club name']) {
      expect(screen.getByLabelText(label)).toBeRequired()
    }
    const club = screen.getByRole('combobox', { name: 'Club' })
    expect(club).toBeRequired()
    expect(club.closest('form')).toHaveAttribute('novalidate')
  })

  it('shows no error before a field is left and one after', () => {
    // catches: errors shouting at the buyer before they have typed
    renderForm()
    expect(screen.queryByText('Enter your name, up to 100 characters.')).not.toBeInTheDocument()
    fireEvent.blur(screen.getByLabelText('Name'))
    expect(screen.getByText('Enter your name, up to 100 characters.')).toBeInTheDocument()
  })

  it('shows the phone rule under the phone field once it is left', () => {
    // catches: a phone error that is missing or worded differently from the spec
    renderForm()
    fireEvent.change(screen.getByLabelText('Phone'), { target: { value: '12345' } })
    fireEvent.blur(screen.getByLabelText('Phone'))
    expect(screen.getByText('Enter a phone number with 7 to 15 digits.')).toBeInTheDocument()
  })

  it('shows every error and focuses Name when Send order is pressed on an empty form', () => {
    // catches: a press that does nothing, or focus left on the button
    renderForm()
    fireEvent.click(screen.getByRole('button', { name: 'Send order' }))
    expect(screen.getByText('Enter your name, up to 100 characters.')).toBeInTheDocument()
    expect(screen.getByText('Enter an email like name@example.com.')).toBeInTheDocument()
    expect(screen.getByText('Enter a phone number with 7 to 15 digits.')).toBeInTheDocument()
    expect(screen.getByText('Choose your club.')).toBeInTheDocument()
    expect(screen.getByLabelText('Name')).toHaveFocus()
  })

  it('stays aria-disabled, with the missing line, until the fields are valid and the captcha ticked', () => {
    // catches: a real disabled button that cannot say why, or one that looks ready too early
    renderForm()
    const send = screen.getByRole('button', { name: 'Send order' })
    expect(send).toHaveAttribute('aria-disabled', 'true')
    expect(send).not.toBeDisabled()
    expect(
      screen.getByText('Fill in your name, email, phone and club and tick the captcha to send.'),
    ).toBeInTheDocument()
    fillValid()
    expect(send).toHaveAttribute('aria-disabled', 'true')
    expect(screen.getByText('Tick the captcha to send.')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Tick captcha' }))
    expect(send).toHaveAttribute('aria-disabled', 'false')
    expect(screen.queryByText(/to send\./)).not.toBeInTheDocument()
  })

  it('goes back to incomplete when the captcha expires', () => {
    // catches: an expired token still counted, so Send would go with a dead token
    renderForm()
    fillValid()
    fireEvent.click(screen.getByRole('button', { name: 'Tick captcha' }))
    fireEvent.click(screen.getByRole('button', { name: 'Expire captcha' }))
    expect(screen.getByRole('button', { name: 'Send order' })).toHaveAttribute('aria-disabled', 'true')
    expect(screen.getByText('Tick the captcha to send.')).toBeInTheDocument()
  })

  it('shows and focuses Club name for Other, and hides it again for a club', async () => {
    // catches: the Other field that never appears, appears unfocused or stays after a club is chosen
    renderForm()
    const select = screen.getByRole('combobox', { name: 'Club' })
    fireEvent.change(select, { target: { value: 'other' } })
    await waitFor(() => expect(screen.getByLabelText('Club name')).toHaveFocus())
    fireEvent.change(select, { target: { value: 'Eagles' } })
    expect(screen.queryByLabelText('Club name')).not.toBeInTheDocument()
  })

  it('shows no select and only Club name when there are no clubs', () => {
    // catches: a required dropdown with nothing to choose
    renderForm([])
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument()
    expect(screen.getByLabelText('Club name')).toBeInTheDocument()
  })

  it('sets the field types and limits that give phones the right keyboard and browsers autofill', () => {
    // catches: a plain text email or phone field, or no length limit
    renderForm()
    expect(screen.getByLabelText('Email')).toHaveAttribute('type', 'email')
    expect(screen.getByLabelText('Phone')).toHaveAttribute('type', 'tel')
    expect(screen.getByLabelText('Name')).toHaveAttribute('autocomplete', 'name')
    expect(screen.getByLabelText('Name')).toHaveAttribute('maxlength', '100')
    expect(screen.getByLabelText('Email')).toHaveAttribute('maxlength', '254')
  })

  it('focuses the missing line when only the captcha is missing', () => {
    // catches: a Send press with a valid form and no captcha that gives no feedback at all
    renderForm()
    fillValid()
    fireEvent.click(screen.getByRole('button', { name: 'Send order' }))
    expect(screen.getByText('Tick the captcha to send.')).toHaveFocus()
  })
})

/**
 * Stubs fetch with answers handed out one per call.
 * @param answers what each call gives: a response, or a function that gives one later
 * @return the stub, to read its calls
 */
function stubFetch(...answers: Array<Response | (() => Promise<Response>)>) {
  const fetchFn = vi.fn(async () => {
    const answer = answers.shift() ?? new Response('{}', { status: 500 }) // 500 when the test gave no more
    return typeof answer === 'function' ? answer() : answer
  })
  vi.stubGlobal('fetch', fetchFn)
  return fetchFn
}

/** @return a response of Web3Forms' success */
const sent = () => new Response(JSON.stringify({ success: true }))

/**
 * Reads the order number out of a call's subject.
 * @param fetchFn the fetch stub
 * @param call the call index
 * @return the order number
 */
function numberOfCall(fetchFn: ReturnType<typeof stubFetch>, call: number): string {
  const body = JSON.parse((fetchFn.mock.calls[call] as unknown as [string, RequestInit])[1].body as string) as {
    subject: string
  }
  return /PF-\d{8}-[A-Z0-9]{4}/.exec(body.subject)?.[0] ?? '' // the number inside "AY Store order PF-… — club — name"
}

/** Fills the form validly, ticks the captcha and presses Send order. */
function fillTickAndSend() {
  fillValid()
  fireEvent.click(screen.getByRole('button', { name: 'Tick captcha' }))
  fireEvent.click(screen.getByRole('button', { name: 'Send order' }))
}

describe('OrderForm look', () => {
  it('draws the fields and Send order as 44 px pills with 16 px text', () => {
    // catches: square fields and a rounded-rectangle Send order beside the pill search box and bars
    renderForm()
    for (const label of ['Name', 'Email', 'Phone']) {
      const field = screen.getByLabelText(label)
      expect(field).toHaveClass('rounded-pill', 'min-h-11', 'text-base')
    }
    expect(screen.getByRole('combobox', { name: 'Club' })).toHaveClass('rounded-pill', 'min-h-11')
    expect(screen.getByRole('button', { name: 'Send order' })).toHaveClass('rounded-pill', 'min-h-11', 'w-full')
  })

  it('puts a field error as text under the field and not in the label', () => {
    // catches: red used as the only sign of an error, or an error away from its field
    renderForm()
    fireEvent.blur(screen.getByLabelText('Name'))
    const error = screen.getByText('Enter your name, up to 100 characters.')
    expect(error).toHaveClass('text-danger')
    expect(screen.getByLabelText('Name')).toHaveAttribute('aria-describedby', error.id)
    expect(screen.getByLabelText('Name').parentElement?.lastElementChild).toBe(error)
  })
})

describe('OrderForm sending', () => {
  it('on a failure keeps the cart and form, shows the alert, resets the captcha and keeps focus on Send', async () => {
    // catches: a failed send that empties the cart, loses the typing, reuses a spent captcha token or leaves focus nowhere
    vi.spyOn(console, 'error').mockImplementation(() => {})
    stubFetch(new Response('{}', { status: 500 }))
    renderForm()
    fillTickAndSend()
    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent(
      'Your order was not sent. Check your connection, tick the captcha again and press Send order.',
    )
    expect(screen.getByTestId('cart')).toHaveTextContent('{"knot-tying":3}')
    expect(screen.getByLabelText('Name')).toHaveValue('Jo Tan')
    expect(captcha.reset).toHaveBeenCalledTimes(1)
    expect(screen.getByRole('button', { name: 'Send order' })).toHaveAttribute('aria-disabled', 'true') // token gone
    expect(screen.getByRole('button', { name: 'Send order' })).toHaveFocus()
    expect(window.location.hash).toBe('')
  })

  it('takes focus back to Send order when the captcha widget grabs it just after a failure', async () => {
    // catches: hCaptcha's reset moving focus into its frame a moment after the failure, so a keyboard buyer lands in the widget
    vi.spyOn(console, 'error').mockImplementation(() => {})
    stubFetch(new Response('{}', { status: 500 }))
    renderForm()
    fillTickAndSend()
    await screen.findByRole('alert')
    screen.getByRole('button', { name: 'Tick captcha' }).focus() // the widget takes focus
    await waitFor(() => expect(screen.getByRole('button', { name: 'Send order' })).toHaveFocus())
  })

  it('takes focus back to Send order when the captcha widget grabs it long after a failure', async () => {
    // catches: a refocus on a fixed timer, so a slow device's late grab leaves a keyboard buyer inside the widget
    vi.spyOn(console, 'error').mockImplementation(() => {})
    stubFetch(new Response('{}', { status: 500 }))
    renderForm()
    fillTickAndSend()
    await screen.findByRole('alert')
    await new Promise((resolve) => setTimeout(resolve, 400)) // far past any fixed delay
    screen.getByRole('button', { name: 'Tick captcha' }).focus() // the widget takes focus late
    await waitFor(() => expect(screen.getByRole('button', { name: 'Send order' })).toHaveFocus())
  })

  it('leaves focus in the captcha when the buyer moves there on purpose after a failure', async () => {
    // catches: a refocus that fights a keyboard buyer tabbing into the widget to tick it again
    vi.spyOn(console, 'error').mockImplementation(() => {})
    stubFetch(new Response('{}', { status: 500 }))
    renderForm()
    fillTickAndSend()
    await screen.findByRole('alert')
    fireEvent.keyDown(screen.getByRole('button', { name: 'Send order' }), { key: 'Tab' }) // the buyer tabs on
    const tick = screen.getByRole('button', { name: 'Tick captcha' })
    tick.focus() // and arrives in the widget
    expect(tick).toHaveFocus()
  })

  it('stops taking focus back once a second has passed, as a tap inside the captcha frame cannot be seen', async () => {
    // catches: a screen-reader tap on the captcha tick long after a failure being pulled back to Send order
    vi.spyOn(console, 'error').mockImplementation(() => {})
    stubFetch(new Response('{}', { status: 500 }))
    renderForm()
    fillTickAndSend()
    await screen.findByRole('alert')
    await new Promise((resolve) => setTimeout(resolve, 1100)) // past the window for the widget's own grab
    const tick = screen.getByRole('button', { name: 'Tick captcha' })
    tick.focus() // the buyer's tap inside the frame
    expect(tick).toHaveFocus()
  })

  it('stops taking focus back once the captcha reports a token', async () => {
    // catches: a tick on the captcha followed by a stray focus event that jumps the buyer back to Send order
    vi.spyOn(console, 'error').mockImplementation(() => {})
    stubFetch(new Response('{}', { status: 500 }))
    renderForm()
    fillTickAndSend()
    await screen.findByRole('alert')
    const tick = screen.getByRole('button', { name: 'Tick captcha' })
    fireEvent.click(tick) // the widget reports a token
    tick.focus()
    expect(tick).toHaveFocus()
  })

  it('takes focus back to Send order when the widget frame takes focus with only a window blur and no focus event on the page', async () => {
    // catches: the real browser's hCaptcha reset, which moves focus into its frame without a focusin reaching the form, leaving a keyboard buyer inside the widget after a failed send
    vi.spyOn(console, 'error').mockImplementation(() => {})
    stubFetch(new Response('{}', { status: 500 }))
    renderForm()
    fillTickAndSend()
    await screen.findByRole('alert')
    screen.getByLabelText('Name').focus() // focus is away from Send order, as it is the instant the frame takes it
    const frame = screen.getByTitle('Captcha frame')
    const active = vi.spyOn(document, 'activeElement', 'get').mockReturnValue(frame) // the page now reports the frame as focused
    act(() => void fireEvent.blur(window)) // the only event the page gets
    active.mockRestore() // the page's own focus tracking again
    await waitFor(() => expect(screen.getByRole('button', { name: 'Send order' })).toHaveFocus())
  })

  it('leaves focus alone on a window blur that is not the captcha frame', async () => {
    // catches: a refocus on every window blur, so switching tabs right after a failure pulls the buyer to Send order
    vi.spyOn(console, 'error').mockImplementation(() => {})
    stubFetch(new Response('{}', { status: 500 }))
    renderForm()
    fillTickAndSend()
    await screen.findByRole('alert')
    const name = screen.getByLabelText('Name')
    name.focus() // the buyer is in a field
    act(() => void fireEvent.blur(window)) // the window loses focus to another tab
    expect(name).toHaveFocus()
  })

  it('logs an unexpected error by name and stack, never its message', async () => {
    // catches: a bug in the send that leaves only "unexpected" in the console, or a message that holds typed text
    vi.stubEnv('VITE_ORDER_SEND', 'fake') // dev-only fake send, which logs through console.info
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.spyOn(console, 'info').mockImplementation(() => {
      throw new RangeError('typed text Jo Tan') // a bug inside the send
    })
    renderForm()
    fillTickAndSend()
    await screen.findByRole('alert')
    const logged = JSON.stringify(error.mock.calls)
    expect(logged).toContain('RangeError')
    expect(logged).toContain('unexpected')
    expect(logged).not.toContain('typed text')
    expect(logged).not.toContain('Jo Tan')
  })

  it('does not say the order was not sent when work after a successful send throws', async () => {
    // catches: a sent order shown as failed, which the buyer would send again as a duplicate
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})
    stubFetch(sent())
    const replace = vi.fn(() => {
      throw new Error('blocked') // the address cannot be replaced
    })
    vi.stubGlobal('location', { ...window.location, replace })
    renderForm()
    fillTickAndSend()
    await waitFor(() => expect(replace).toHaveBeenCalledTimes(1))
    await waitFor(() => expect(error).toHaveBeenCalled()) // the failure is logged, not swallowed
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(captcha.reset).not.toHaveBeenCalled()
    expect(screen.getByRole('status')).toHaveTextContent(/Order sent\. Your order number is PF-\d{8}-[A-Z0-9]{4}\./) // the buyer is told
    fireEvent.click(screen.getByRole('button', { name: 'Send order' }))
    expect(fetch).toHaveBeenCalledTimes(1) // and cannot send it twice
  })

  it('words a rate limit differently', async () => {
    // catches: a buyer told to check their connection when Web3Forms asked them to wait
    vi.spyOn(console, 'error').mockImplementation(() => {})
    stubFetch(new Response('{}', { status: 429 }))
    renderForm()
    fillTickAndSend()
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Too many orders were sent just now. Wait a minute, tick the captcha again and press Send order.',
    )
  })

  it('logs the failure kind and order number but never the buyer', async () => {
    // catches: a name, email or phone in the console (rule: ids and counts only)
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})
    const fetchFn = stubFetch(new Response('{}', { status: 500 }))
    renderForm()
    fillTickAndSend()
    await screen.findByRole('alert')
    const logged = JSON.stringify(error.mock.calls)
    expect(logged).toContain('rejected')
    expect(logged).toContain(numberOfCall(fetchFn, 0))
    for (const secret of ['Jo Tan', 'jc@mail.com', '6789']) expect(logged).not.toContain(secret)
  })

  it('keeps the order number for a retry and makes a new one after an edit', async () => {
    // catches: a retry that gives the handler two numbers for one order, or an edited order reusing the old number
    vi.spyOn(console, 'error').mockImplementation(() => {})
    let next = 0 // a counter that stands in for randomness
    vi.spyOn(crypto, 'getRandomValues').mockImplementation(((array: Uint8Array) => {
      for (let index = 0; index < array.length; index++) array[index] = next++ % 200 // every call differs
      return array
    }) as never)
    const fetchFn = stubFetch(
      new Response('{}', { status: 500 }),
      new Response('{}', { status: 500 }),
      new Response('{}', { status: 500 }),
    )
    renderForm()
    fillTickAndSend()
    await screen.findByRole('alert')
    fireEvent.click(screen.getByRole('button', { name: 'Tick captcha' }))
    fireEvent.click(screen.getByRole('button', { name: 'Send order' }))
    await waitFor(() => expect(fetchFn).toHaveBeenCalledTimes(2))
    expect(numberOfCall(fetchFn, 1)).toBe(numberOfCall(fetchFn, 0))
    await screen.findByRole('alert')
    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Jo Tan Jr' } })
    fireEvent.click(screen.getByRole('button', { name: 'Tick captcha' }))
    fireEvent.click(screen.getByRole('button', { name: 'Send order' }))
    await waitFor(() => expect(fetchFn).toHaveBeenCalledTimes(3))
    expect(numberOfCall(fetchFn, 2)).not.toBe(numberOfCall(fetchFn, 0))
  })

  it('sends once when Send order is pressed twice, and shows the sending state', async () => {
    // catches: a double press that posts the order twice
    let finish: (response: Response) => void = () => {}
    const fetchFn = stubFetch(() => new Promise<Response>((resolve) => (finish = resolve)))
    renderForm()
    fillValid()
    fireEvent.click(screen.getByRole('button', { name: 'Tick captcha' }))
    const send = screen.getByRole('button', { name: 'Send order' })
    fireEvent.click(send)
    fireEvent.click(send)
    expect(send).toHaveTextContent('Sending…')
    expect(fetchFn).toHaveBeenCalledTimes(1)
    await act(async () => finish(sent()))
    expect(window.location.hash).toBe('#/order-sent')
  })

  it('keeps the send and its number when the form is left and opened again mid-send', async () => {
    // catches: Back during "Sending…" unmounting the form, so a return shows a ready button and a second send goes out under a new number
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})
    let finish: (response: Response) => void = () => {}
    const fetchFn = stubFetch(
      () => new Promise<Response>((resolve) => (finish = resolve)),
      new Response('{}', { status: 500 }),
    )
    window.localStorage.setItem(CART_STORAGE_KEY, '{"version":1,"quantities":{"knot-tying":3}}') // the stored cart
    /** @return the form behind a Leave button, so a test can unmount and remount it */
    const Screen = () => {
      const [shown, setShown] = useState(true) // the cart screen is showing
      return (
        <>
          <button onClick={() => setShown(!shown)}>Leave or return</button>
          {shown && <OrderForm lines={lines} currency="MYR" clubs={clubs} />}
        </>
      )
    }
    render(
      <CartProvider honors={null}>
        <OrderFormProvider>
          <Screen />
        </OrderFormProvider>
      </CartProvider>,
    )
    fillTickAndSend()
    fireEvent.click(screen.getByText('Leave or return')) // browser Back
    fireEvent.click(screen.getByText('Leave or return')) // and forward to the cart again
    const send = screen.getByRole('button', { name: 'Sending…' }) // still in progress
    expect(send).toHaveAttribute('aria-disabled', 'true')
    fireEvent.click(send)
    expect(fetchFn).toHaveBeenCalledTimes(1) // no second send
    await act(async () => finish(new Response('{}', { status: 500 }))) // the first one fails while the form is back
    expect(await screen.findByRole('alert')).toHaveTextContent('Your order was not sent.')
    fireEvent.click(screen.getByRole('button', { name: 'Tick captcha' }))
    fireEvent.click(screen.getByRole('button', { name: 'Send order' }))
    await waitFor(() => expect(fetchFn).toHaveBeenCalledTimes(2))
    expect(numberOfCall(fetchFn, 1)).toBe(numberOfCall(fetchFn, 0)) // the retry reuses the number
    expect(error).toHaveBeenCalledTimes(2) // the failed send, then the failed retry
  })

  it('on success empties the cart and the form, keeps the order for the confirmation and replaces the address', async () => {
    // catches: a cart that survives a sent order, an order the confirmation cannot find, or a Back button that leads to an empty cart
    vi.useFakeTimers({ toFake: ['Date'], now: new Date(2026, 9, 28, 10, 0) })
    stubFetch(sent())
    const historyLength = window.history.length
    renderForm()
    fillTickAndSend()
    await waitFor(() => expect(window.location.hash).toBe('#/order-sent'))
    await waitFor(() => expect(screen.getByTestId('cart')).toHaveTextContent('{}')) // the cart's save runs after the render
    await waitFor(() => expect(window.localStorage.getItem(CART_STORAGE_KEY)).toBe('{"version":1,"quantities":{}}'))
    expect(screen.getByLabelText('Name')).toHaveValue('')
    expect(window.history.length).toBe(historyLength) // replaced, not pushed
    const stored = JSON.parse(window.sessionStorage.getItem(SENT_ORDER_STORAGE_KEY) ?? '{}') as {
      order: { number: string; totalCents: number }
    }
    expect(stored.order.number).toMatch(/^PF-20261028-[2-9A-HJKMNP-Z]{4}$/)
    expect(stored.order.totalCents).toBe(900)
  })

  it('on success with sessionStorage refusing the write still replaces the address and clears the cart', async () => {
    // catches: a sent order shown as failed, or a cart left full, because the stored order could not be saved
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    stubFetch(sent())
    renderForm()
    const real = Storage.prototype.setItem // the working save
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(function (this: Storage, key: string, value: string) {
      if (this === window.sessionStorage) throw new Error('blocked') // only the sent order's store refuses
      real.call(this, key, value) // the cart still saves
    })
    fillTickAndSend()
    await waitFor(() => expect(window.location.hash).toBe('#/order-sent'))
    await waitFor(() => expect(screen.getByTestId('cart')).toHaveTextContent('{}'))
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('on success removes a line whose quantity was lowered below the sent amount during the send', async () => {
    // catches: a lowered line that survives a sent order as a negative or leftover quantity
    let finish: (response: Response) => void = () => {}
    stubFetch(() => new Promise<Response>((resolve) => (finish = resolve)))
    renderForm()
    fillTickAndSend()
    fireEvent.click(screen.getByText('Lower Knot Tying to one')) // from three sent to one during "Sending…"
    await act(async () => finish(sent()))
    await waitFor(() => expect(window.location.hash).toBe('#/order-sent'))
    await waitFor(() => expect(screen.getByTestId('cart')).toHaveTextContent('{}'))
    await waitFor(() => expect(window.localStorage.getItem(CART_STORAGE_KEY)).toBe('{"version":1,"quantities":{}}'))
  })

  it('on success keeps an honor the buyer added while the order was sending', async () => {
    // catches: a successful send that empties the whole cart, so an honor added from the catalogue mid-send is lost unordered
    let finish: (response: Response) => void = () => {}
    stubFetch(() => new Promise<Response>((resolve) => (finish = resolve)))
    renderForm()
    fillTickAndSend()
    fireEvent.click(screen.getByText('Add two Ants')) // added from the catalogue during "Sending…"
    await act(async () => finish(sent()))
    await waitFor(() => expect(window.location.hash).toBe('#/order-sent'))
    await waitFor(() => expect(screen.getByTestId('cart')).toHaveTextContent('{"ants":2}'))
    await waitFor(() =>
      expect(window.localStorage.getItem(CART_STORAGE_KEY)).toBe('{"version":1,"quantities":{"ants":2}}'),
    )
  })

  it('on success removes only the sent quantity of an honor raised while the order was sending', async () => {
    // catches: a successful send that drops the extra two Knot Tying the buyer added mid-send
    let finish: (response: Response) => void = () => {}
    stubFetch(() => new Promise<Response>((resolve) => (finish = resolve)))
    renderForm()
    fillTickAndSend()
    fireEvent.click(screen.getByText('Raise Knot Tying to five')) // three were sent, two more added
    await act(async () => finish(sent()))
    await waitFor(() => expect(window.location.hash).toBe('#/order-sent'))
    await waitFor(() => expect(screen.getByTestId('cart')).toHaveTextContent('{"knot-tying":2}'))
  })

  it('clears the failure alert once the cart changes', async () => {
    // catches: "Your order was not sent" showing above a changed cart the buyer has not sent yet
    vi.spyOn(console, 'error').mockImplementation(() => {})
    stubFetch(new Response('{}', { status: 500 }))
    renderForm()
    fillTickAndSend()
    await screen.findByRole('alert')
    fireEvent.click(screen.getByText('Add two Ants')) // a new order takes shape
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it.each([
    ['a dropped connection', () => Promise.reject(new TypeError('Failed to fetch'))],
    ['a timeout', () => Promise.reject(new DOMException('timed out', 'TimeoutError'))],
    ['a refusal with success false', () => Promise.resolve(new Response(JSON.stringify({ success: false })))],
    ['an HTTP 400', () => Promise.resolve(new Response(JSON.stringify({ success: false }), { status: 400 }))],
    ['a rate limit', () => Promise.resolve(new Response('{}', { status: 429 }))],
    ['a page that is not JSON', () => Promise.resolve(new Response('<html>', { status: 502 }))],
  ])(
    'keeps the cart, the form and the sent-order store untouched after %s, and clears the captcha',
    async (_label, answer) => {
      // catches: any one failure kind that empties the cart, clears the typing, stores an order or keeps the spent token
      vi.spyOn(console, 'error').mockImplementation(() => {}) // the failure log
      stubFetch(answer as () => Promise<Response>) // the failing answer
      renderForm() // three Knot Tying in the cart
      fillTickAndSend() // press Send
      await screen.findByRole('alert') // the failure shows
      expect(screen.getByTestId('cart')).toHaveTextContent('{"knot-tying":3}') // cart kept
      expect(window.localStorage.getItem(CART_STORAGE_KEY)).toBe('{"version":1,"quantities":{"knot-tying":3}}') // stored cart kept
      expect(screen.getByLabelText('Email')).toHaveValue('jc@mail.com') // form kept
      expect(screen.getByLabelText('Phone')).toHaveValue('+60 12-345 6789') // form kept
      expect(screen.getByRole('combobox', { name: 'Club' })).toHaveValue('Eagles') // form kept
      expect(window.sessionStorage.getItem(SENT_ORDER_STORAGE_KEY)).toBeNull() // no confirmation for an unsent order
      expect(window.location.hash).toBe('') // still on the cart
      expect(captcha.reset).toHaveBeenCalledTimes(1) // the spent token is dropped
      expect(screen.getByRole('button', { name: 'Send order' })).toHaveAttribute('aria-disabled', 'true') // needs a new tick
    },
  )

  it('keeps the order number across a rate-limited retry and then sends successfully under it', async () => {
    // catches: a retry after a 429 that renumbers the order, or a retry that cannot send once the captcha is ticked again
    vi.spyOn(console, 'error').mockImplementation(() => {}) // the failure log
    const fetchFn = stubFetch(new Response('{}', { status: 429 }), sent()) // refused once, then accepted
    renderForm() // the cart
    fillTickAndSend() // first press
    await screen.findByRole('alert') // refused
    fireEvent.click(screen.getByRole('button', { name: 'Tick captcha' })) // tick again
    fireEvent.click(screen.getByRole('button', { name: 'Send order' })) // retry
    await waitFor(() => expect(window.location.hash).toBe('#/order-sent')) // accepted
    expect(numberOfCall(fetchFn, 1)).toBe(numberOfCall(fetchFn, 0)) // one number
    const stored = JSON.parse(window.sessionStorage.getItem(SENT_ORDER_STORAGE_KEY) ?? '{}') as {
      order: { number: string }
    } // the confirmation's order
    expect(stored.order.number).toBe(numberOfCall(fetchFn, 0)) // the confirmation shows the number the handler got
  })

  it('makes a new order number when the club changes after a failure', async () => {
    // catches: a number signature that ignores the club, so a different order reuses the old number
    vi.spyOn(console, 'error').mockImplementation(() => {}) // the failure log
    const two: Club[] = [...clubs, { name: 'Falcons', area: null, language: null, location: null, churchName: null }] // a second club
    let next = 0 // stands in for randomness
    vi.spyOn(crypto, 'getRandomValues').mockImplementation(((array: Uint8Array) => {
      for (let index = 0; index < array.length; index++) array[index] = next++ % 200 // every call differs
      return array
    }) as never)
    const fetchFn = stubFetch(new Response('{}', { status: 500 }), new Response('{}', { status: 500 })) // two failures
    renderForm(two) // two clubs
    fillTickAndSend() // first press
    await screen.findByRole('alert') // failed
    fireEvent.change(screen.getByRole('combobox', { name: 'Club' }), { target: { value: 'Falcons' } }) // another club
    fireEvent.click(screen.getByRole('button', { name: 'Tick captcha' })) // tick
    fireEvent.click(screen.getByRole('button', { name: 'Send order' })) // press again
    await waitFor(() => expect(fetchFn).toHaveBeenCalledTimes(2)) // sent again
    expect(numberOfCall(fetchFn, 1)).not.toBe(numberOfCall(fetchFn, 0)) // a new number
  })

  it('keeps club detail fields out of the whole request body', async () => {
    // catches: area, language, location or church name leaking into the order email through the form
    const gilead: Club = {
      name: 'Gilead Pathfinder Club',
      area: 'Klang',
      language: 'Malay',
      location: 'Hall 3',
      churchName: 'Klang BM SDA Church',
    } // every detail set
    const fetchFn = stubFetch(sent()) // accepted
    renderForm([gilead]) // that club
    fillValid() // fills the Eagles value, so pick Gilead below
    fireEvent.change(screen.getByRole('combobox', { name: 'Club' }), { target: { value: 'Gilead Pathfinder Club' } }) // choose it
    fireEvent.click(screen.getByRole('button', { name: 'Tick captcha' })) // tick
    fireEvent.click(screen.getByRole('button', { name: 'Send order' })) // send
    await waitFor(() => expect(fetchFn).toHaveBeenCalledTimes(1)) // posted
    const body = (fetchFn.mock.calls[0] as unknown as [string, RequestInit])[1].body as string // the JSON
    expect(body).toContain('Gilead Pathfinder Club') // the name is there
    for (const detail of ['Klang', 'Malay', 'Hall 3']) expect(body).not.toContain(detail) // no detail field, church name included
  })

  it('a double press while sending then a retry after failure sends exactly twice in total', async () => {
    // catches: the send guard never released after a failure, or released too early
    vi.spyOn(console, 'error').mockImplementation(() => {}) // the failure log
    let fail: (response: Response) => void = () => {} // ends the first send
    const fetchFn = stubFetch(() => new Promise<Response>((resolve) => (fail = resolve)), sent()) // slow failure, then success
    renderForm() // the cart
    fillValid() // the fields
    fireEvent.click(screen.getByRole('button', { name: 'Tick captcha' })) // tick
    const send = screen.getByRole('button', { name: 'Send order' }) // the button
    fireEvent.click(send) // first press
    fireEvent.click(send) // second press, ignored
    await act(async () => fail(new Response('{}', { status: 500 }))) // the first send fails
    await screen.findByRole('alert') // alert shown
    fireEvent.click(screen.getByRole('button', { name: 'Tick captcha' })) // tick again
    fireEvent.click(screen.getByRole('button', { name: 'Send order' })) // retry
    await waitFor(() => expect(window.location.hash).toBe('#/order-sent')) // sent
    expect(fetchFn).toHaveBeenCalledTimes(2) // one failed send and one retry, no extras
  })
})
