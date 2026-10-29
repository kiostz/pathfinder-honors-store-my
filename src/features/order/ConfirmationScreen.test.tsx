// Tests for the confirmation page: the whole order read back from storage, the Print action, the empty state, and what stays off the printed page.

import { fireEvent, render, screen, within } from '@testing-library/react' // render and query
import { afterEach, describe, expect, it, vi } from 'vitest' // test API and mocks
import { ConfirmationScreen } from './ConfirmationScreen.tsx' // code under test
import type { SentOrder } from './order-email.ts' // the stored shape
import { writeSentOrder } from './sent-order-storage.ts' // fills the stored order

const order: SentOrder = {
  number: 'PF-20261028-4K7Q',
  sentAt: '2026-10-28T10:00:00.000Z',
  currency: 'MYR',
  lines: [
    { honorId: 'knot-tying', name: 'Knot Tying', quantity: 3, priceCents: 300 },
    { honorId: 'first-aid', name: 'First Aid', quantity: 1, priceCents: 350 },
  ],
  totalCents: 1250,
  name: 'J. Cruz',
  email: 'jc@mail.com',
  phone: '+60 12-345 6789',
  club: { subject: 'Eagles', email: 'Eagles' },
} // an order as sent

afterEach(() => {
  writeSentOrder(order) // a good write forgets any order held in memory
  window.sessionStorage.clear() // nothing left for the next test
  vi.restoreAllMocks() // spies removed
})

describe('ConfirmationScreen', () => {
  it('shows the focused Order sent heading and the order number', () => {
    // catches: a confirmation with no number, or focus left behind on arrival
    writeSentOrder(order)
    render(<ConfirmationScreen onBack={() => {}} />)
    expect(screen.getByRole('heading', { name: 'Order sent' })).toHaveFocus()
    expect(screen.getByText('PF-20261028-4K7Q')).toBeInTheDocument()
  })

  it('shows each order line with quantity, price and line total, then the estimated total', () => {
    // catches: lines missing or a total that does not match the lines
    writeSentOrder(order)
    render(<ConfirmationScreen onBack={() => {}} />)
    const lines = screen.getAllByRole('listitem')
    expect(lines).toHaveLength(2)
    expect(within(lines[0]).getByText('Knot Tying')).toBeInTheDocument()
    expect(within(lines[0]).getByText(/3 × RM\s3\.00/)).toBeInTheDocument()
    expect(within(lines[0]).getByText(/RM\s9\.00/)).toBeInTheDocument()
    expect(within(lines[1]).getByText('First Aid')).toBeInTheDocument()
    expect(within(lines[1]).getByText(/1 × RM\s3\.50/)).toBeInTheDocument()
    expect(screen.getByText('Estimated total')).toBeInTheDocument()
    expect(screen.getByText(/RM\s12\.50/)).toBeInTheDocument()
  })

  it('shows the buyer, phone, club and the send date', () => {
    // catches: a confirmation that hides who the order was for
    writeSentOrder(order)
    render(<ConfirmationScreen onBack={() => {}} />)
    expect(screen.getByText('J. Cruz')).toBeInTheDocument()
    expect(screen.getByText('+60 12-345 6789', { selector: 'dd' })).toBeInTheDocument()
    expect(screen.getByText('Eagles')).toBeInTheDocument()
    expect(screen.getByText('28 Oct 2026')).toBeInTheDocument()
  })

  it('says the order will be reviewed and where the buyer will be contacted', () => {
    // catches: no word on what happens next, or contact details the buyer cannot check for a typo
    writeSentOrder(order)
    render(<ConfirmationScreen onBack={() => {}} />)
    expect(screen.getByText(/Keep this number/)).toHaveTextContent(
      "Keep this number. We'll review your order and contact you at jc@mail.com or +60 12-345 6789 to confirm it. Thank you!",
    )
  })

  it('keeps the phone number on one line inside the next-step sentence', () => {
    // catches: the number split across two lines at 375 px, where a typo is hardest to spot
    writeSentOrder(order)
    render(<ConfirmationScreen onBack={() => {}} />)
    expect(screen.getByText('+60 12-345 6789', { selector: 'p span' })).toHaveClass('whitespace-nowrap')
  })

  it('warns once about a bad stored order even when the page draws again', () => {
    // catches: the stored value read and warned about on every render
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    window.sessionStorage.setItem(
      'pathfinder-honors-store-my:sent-order',
      JSON.stringify({ version: 1, order: { number: 'x' } }),
    )
    const { rerender } = render(<ConfirmationScreen onBack={() => {}} />)
    rerender(<ConfirmationScreen onBack={() => {}} />)
    expect(warn).toHaveBeenCalledTimes(1)
  })

  it('shows the order from memory when sessionStorage could not be written', () => {
    // catches: a sent order shown as "no order" because storage is blocked
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    const blocked = {
      getItem: () => {
        throw new Error('blocked')
      },
      setItem: () => {
        throw new Error('blocked')
      },
    } as unknown as Storage // storage that refuses every call
    writeSentOrder(order, blocked)
    render(<ConfirmationScreen onBack={() => {}} />)
    expect(screen.getByText('PF-20261028-4K7Q')).toBeInTheDocument()
  })

  it('opens the print dialog from the Print / save as PDF button', () => {
    // catches: a print button wired to nothing
    writeSentOrder(order)
    const print = vi.spyOn(window, 'print').mockImplementation(() => {})
    render(<ConfirmationScreen onBack={() => {}} />)
    fireEvent.click(screen.getByRole('button', { name: 'Print / save as PDF' }))
    expect(print).toHaveBeenCalledTimes(1)
  })

  it('leads back to the honors from the full page too', () => {
    // catches: no way out of the confirmation but the browser back button
    writeSentOrder(order)
    const onBack = vi.fn()
    render(<ConfirmationScreen onBack={onBack} />)
    fireEvent.click(screen.getByRole('link', { name: 'Back to honors' }))
    expect(onBack).toHaveBeenCalledTimes(1)
  })

  it('keeps every button and link off the printed page', () => {
    // catches: a Print button or link printed onto the paper copy
    writeSentOrder(order)
    render(<ConfirmationScreen onBack={() => {}} />)
    for (const control of [...screen.getAllByRole('button'), ...screen.getAllByRole('link')])
      expect(control).toHaveClass('print:hidden')
  })

  it('says there is no order when nothing is stored, and leads back to the honors', () => {
    // catches: a blank page for a buyer who opens the address by hand
    const onBack = vi.fn()
    render(<ConfirmationScreen onBack={onBack} />)
    expect(screen.getByText('There is no order to show here.')).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Order sent' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Print / save as PDF' })).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('link', { name: 'Browse honors' }))
    expect(onBack).toHaveBeenCalledTimes(1)
  })
  it('shows the empty state, not a crash, for a stored value of the right version but the wrong shape', () => {
    // catches: a foreign stored order throwing in the confirmation render
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    window.sessionStorage.setItem(
      'pathfinder-honors-store-my:sent-order',
      JSON.stringify({ version: 1, order: { number: 'PF-20261028-4K7Q' } }),
    )
    render(<ConfirmationScreen onBack={() => {}} />)
    expect(screen.getByText('There is no order to show here.')).toBeInTheDocument()
  })

  it('shows the empty state for bad JSON in the stored order', () => {
    // catches: a parse error reaching the page
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    window.sessionStorage.setItem('pathfinder-honors-store-my:sent-order', '{oops')
    render(<ConfirmationScreen onBack={() => {}} />)
    expect(screen.getByText('There is no order to show here.')).toBeInTheDocument()
  })

  it('shows the empty state when sessionStorage throws on read and nothing is held', () => {
    // catches: a blocked read crashing the confirmation address
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked')
    })
    render(<ConfirmationScreen onBack={() => {}} />)
    expect(screen.getByText('There is no order to show here.')).toBeInTheDocument()
  })

  it('shows the newest order after a second send in the same tab', () => {
    // catches: the page keeping the first order's number, lines or contact line
    writeSentOrder(order)
    writeSentOrder({ ...order, number: 'PF-20261029-ABCD', email: 'new@mail.com' })
    render(<ConfirmationScreen onBack={() => {}} />)
    expect(screen.getByText('PF-20261029-ABCD')).toBeInTheDocument()
    expect(screen.queryByText('PF-20261028-4K7Q')).not.toBeInTheDocument()
    expect(screen.getByText(/contact you at new@mail\.com or/)).toBeInTheDocument()
  })

  it('shows the same order after the page is drawn again, as after a reload or print', () => {
    // catches: a read that empties the store, so a second draw shows "no order"
    writeSentOrder(order)
    const first = render(<ConfirmationScreen onBack={() => {}} />)
    first.unmount()
    render(<ConfirmationScreen onBack={() => {}} />)
    expect(screen.getByText('PF-20261028-4K7Q')).toBeInTheDocument()
    expect(window.sessionStorage.getItem('pathfinder-honors-store-my:sent-order')).not.toBeNull()
  })

  it('shows text typed by the buyer as text, not as markup', () => {
    // catches: a name or club injected as HTML into the page
    writeSentOrder({ ...order, name: '<img src=x onerror=alert(1)>' })
    const { container } = render(<ConfirmationScreen onBack={() => {}} />)
    expect(container.querySelector('img')).toBeNull()
    expect(screen.getByText('<img src=x onerror=alert(1)>')).toBeInTheDocument()
  })
})
