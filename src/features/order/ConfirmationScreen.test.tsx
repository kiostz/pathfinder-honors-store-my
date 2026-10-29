// Tests for the confirmation page's first cut: the heading, the order number from storage, and the empty state.

import { fireEvent, render, screen } from '@testing-library/react' // render and query
import { afterEach, describe, expect, it, vi } from 'vitest' // test API and mocks
import { ConfirmationScreen } from './ConfirmationScreen.tsx' // code under test
import { writeSentOrder } from './sent-order-storage.ts' // fills the stored order

afterEach(() => {
  window.sessionStorage.clear() // nothing left for the next test
})

describe('ConfirmationScreen', () => {
  it('shows the focused Order sent heading and the order number', () => {
    // catches: a confirmation with no number, or focus left behind on arrival
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
    render(<ConfirmationScreen onBack={() => {}} />)
    expect(screen.getByRole('heading', { name: 'Order sent' })).toHaveFocus()
    expect(screen.getByText('PF-20261028-4K7Q')).toBeInTheDocument()
  })

  it('says there is no order when nothing is stored, and leads back to the honors', () => {
    // catches: a blank page for a buyer who opens the address by hand
    const onBack = vi.fn()
    render(<ConfirmationScreen onBack={onBack} />)
    expect(screen.getByText('There is no order to show here.')).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Order sent' })).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('link', { name: 'Browse honors' }))
    expect(onBack).toHaveBeenCalledTimes(1)
  })
})
