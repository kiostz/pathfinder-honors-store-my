// Tests for the Checkout bar: the total and Checkout, one press at a time, or Browse more alone when nothing can be ordered.

import { fireEvent, render, screen } from '@testing-library/react' // render and query
import { describe, expect, it, vi } from 'vitest' // test API and mocks
import { CheckoutBar } from './CheckoutBar.tsx' // code under test

describe('CheckoutBar', () => {
  it('shows the Estimated total and a Checkout button that calls onCheckout', () => {
    // catches: a bar without the total, or a Checkout that does nothing
    const onCheckout = vi.fn()
    render(<CheckoutBar totalCents={1850} currency="MYR" orderable onCheckout={onCheckout} onBrowse={() => {}} />)
    expect(screen.getByText('Estimated total')).toBeInTheDocument()
    expect(screen.getByText('RM 18.50')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Checkout' }))
    expect(onCheckout).toHaveBeenCalledTimes(1)
    expect(screen.queryByRole('button', { name: 'Browse more' })).not.toBeInTheDocument()
  })

  it('calls onCheckout once for a double tap', () => {
    // catches: two take-outs and two history entries from a fast double tap on Checkout
    const onCheckout = vi.fn()
    render(<CheckoutBar totalCents={400} currency="MYR" orderable onCheckout={onCheckout} onBrowse={() => {}} />)
    const checkout = screen.getByRole('button', { name: 'Checkout' })
    fireEvent.click(checkout)
    fireEvent.click(checkout)
    expect(onCheckout).toHaveBeenCalledTimes(1)
  })

  it('announces the total politely', () => {
    // catches: a total that changes silently for a screen reader (the card's old total row announced it)
    render(<CheckoutBar totalCents={400} currency="MYR" orderable onCheckout={() => {}} onBrowse={() => {}} />)
    expect(screen.getByText('RM 4.00').closest('[aria-live="polite"]')).not.toBeNull()
  })

  it('with orderable false shows only Browse more, which calls onBrowse', () => {
    // catches: a Checkout that can be pressed with nothing to order
    const onBrowse = vi.fn()
    render(<CheckoutBar totalCents={0} currency="MYR" orderable={false} onCheckout={() => {}} onBrowse={onBrowse} />)
    expect(screen.queryByRole('button', { name: 'Checkout' })).not.toBeInTheDocument()
    expect(screen.queryByText('Estimated total')).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Browse more' }))
    expect(onBrowse).toHaveBeenCalledTimes(1)
  })
})
