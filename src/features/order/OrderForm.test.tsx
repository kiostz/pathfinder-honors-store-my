// Tests for the order form: errors once a field is left, Send order's looks and missing line, the Other field and the captcha.

import { fireEvent, render, screen, waitFor } from '@testing-library/react' // render and query
import { describe, expect, it, vi } from 'vitest' // test API and mocks
import type { Club } from '@/shared/data/types.ts' // the club shape
import { OrderForm } from './OrderForm.tsx' // code under test
import { OrderFormProvider } from './OrderFormProvider.tsx' // the form state

// The real captcha loads hCaptcha's script, which a test must not do; this stand-in ticks and expires on demand.
vi.mock('./Captcha.tsx', () => ({
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

const clubs: Club[] = [{ name: 'Eagles', area: null, language: null, location: null, churchName: null }] // one club

/**
 * Renders the form inside its provider.
 * @param clubList the clubs to offer
 */
function renderForm(clubList: Club[] = clubs) {
  render(
    <OrderFormProvider>
      <OrderForm clubs={clubList} />
    </OrderFormProvider>,
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
})
