// Tests for the cart's floating pill: the Estimated total with the item count and Checkout, one press at a time, or Browse more alone when nothing can be ordered.

import { fireEvent, render, screen } from '@testing-library/react' // render and query
import { describe, expect, it, vi } from 'vitest' // test API and mocks
import { PILL_SURFACE } from '@/shared/ui/floating-pill-box.ts' // the pill look
import { CheckoutBar } from './CheckoutBar.tsx' // code under test

describe('CheckoutBar', () => {
  it('shows the Estimated total with the count and a Checkout button that calls onCheckout', () => {
    // catches: a pill without the total or the count, or a Checkout that does nothing
    const onCheckout = vi.fn()
    render(<CheckoutBar totalCents={2000} itemCount={5} currency="MYR" orderable onCheckout={onCheckout} onBrowse={() => {}} />)
    expect(screen.getByText('Estimated total · 5 items')).toBeInTheDocument()
    expect(screen.getByText('RM 20.00')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Checkout' }))
    expect(onCheckout).toHaveBeenCalledTimes(1)
    expect(screen.queryByRole('button', { name: 'Browse more' })).not.toBeInTheDocument()
  })

  it('reads "1 item" for one', () => {
    // catches: "1 items"
    render(<CheckoutBar totalCents={400} itemCount={1} currency="MYR" orderable onCheckout={() => {}} onBrowse={() => {}} />)
    expect(screen.getByText('Estimated total · 1 item')).toBeInTheDocument()
  })

  it('is the floating pill: the pill look, and no flat strip with a top border', () => {
    // catches: the flat bar coming back
    const { container } = render(
      <CheckoutBar totalCents={400} itemCount={1} currency="MYR" orderable onCheckout={() => {}} onBrowse={() => {}} />,
    )
    const pill = screen.getByRole('button', { name: 'Checkout' }).parentElement as HTMLElement
    for (const name of PILL_SURFACE.split(' ')) expect(pill).toHaveClass(name)
    expect(container.querySelector('.border-t')).toBeNull()
  })

  it('names the Checkout button exactly "Checkout", without the arrow', () => {
    // catches: the decorative arrow read as part of the name
    render(<CheckoutBar totalCents={400} itemCount={1} currency="MYR" orderable onCheckout={() => {}} onBrowse={() => {}} />)
    expect(screen.getByRole('button', { name: 'Checkout' })).toBeInTheDocument()
  })

  it('calls onCheckout once for a double tap', () => {
    // catches: two take-outs and two history entries from a fast double tap on Checkout
    const onCheckout = vi.fn()
    render(<CheckoutBar totalCents={400} itemCount={1} currency="MYR" orderable onCheckout={onCheckout} onBrowse={() => {}} />)
    const checkout = screen.getByRole('button', { name: 'Checkout' })
    fireEvent.click(checkout)
    fireEvent.click(checkout)
    expect(onCheckout).toHaveBeenCalledTimes(1)
  })

  it('announces the total politely', () => {
    // catches: a total that changes silently for a screen reader
    render(<CheckoutBar totalCents={400} itemCount={1} currency="MYR" orderable onCheckout={() => {}} onBrowse={() => {}} />)
    expect(screen.getByText('RM 4.00').closest('[aria-live="polite"]')).not.toBeNull()
  })

  it('with orderable false shows one full-width Browse more button and no total', () => {
    // catches: a Checkout that can be pressed with nothing to order, or a Browse more that is not full width
    const onBrowse = vi.fn()
    render(<CheckoutBar totalCents={0} itemCount={0} currency="MYR" orderable={false} onCheckout={() => {}} onBrowse={onBrowse} />)
    expect(screen.queryByRole('button', { name: 'Checkout' })).not.toBeInTheDocument()
    expect(screen.queryByText(/^Estimated total/)).not.toBeInTheDocument()
    expect(screen.getAllByRole('button')).toHaveLength(1)
    const browse = screen.getByRole('button', { name: 'Browse more' })
    expect(browse).toHaveClass('w-full')
    fireEvent.click(browse)
    expect(onBrowse).toHaveBeenCalledTimes(1)
  })
})
