// The order form under the cart's estimated total: name, email, phone, club and captcha, with Send order that looks ready only when everything is filled in.

import { useState, type FormEvent } from 'react' // the captcha token and the form's submit
import type { ClubList } from '@/shared/data/types.ts' // the clubs
import { Captcha } from './Captcha.tsx' // the hCaptcha widget
import { ClubSelect } from './ClubSelect.tsx' // the club field
import { FIELD_BOX, FIELD_ERROR, FIELD_LABEL } from './field-box.ts' // the shared field look
import { missingText, validateOrderForm, type OrderField } from './order-form.ts' // the form's rules
import { useOrderForm } from './use-order-form.ts' // the form's values

const FIELD_IDS: Record<OrderField, string> = {
  name: 'order-name',
  email: 'order-email',
  phone: 'order-phone',
  club: 'order-club',
  otherClub: 'order-other-club',
} // the DOM id of each field, in form order, for focusing the first invalid one

/**
 * Draws the order form.
 * @param clubs the clubs for the dropdown
 * @return the fields, the captcha, Send order and the line saying what is missing
 */
export function OrderForm({ clubs }: { clubs: ClubList }) {
  const { values, touched, setField, touch, touchAll } = useOrderForm() // the form's state, kept above the routes
  const [token, setToken] = useState<string | null>(null) // the captcha token, until it expires
  const errors = validateOrderForm(values, clubs) // what is wrong now
  const complete = Object.keys(errors).length === 0 && token !== null // ready to send
  const missing = missingText(errors, token !== null) // the line under the button
  /**
   * Gives the error text of a field once the buyer has left it.
   * @param field the field
   * @return the text, or undefined while it is untouched or valid
   */
  const shownError = (field: OrderField) => (touched[field] ? errors[field] : undefined)

  /**
   * Handles Send order: an incomplete form shows every error and focuses the first invalid field.
   * @param event the form's submit
   */
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault() // never a page load
    if (complete) return // a complete form has nothing to do yet
    touchAll() // every error shows
    const first = (Object.keys(FIELD_IDS) as OrderField[]).find((field) => errors[field] !== undefined) // the first invalid field in form order
    if (first) document.getElementById(FIELD_IDS[first])?.focus() // the buyer starts there
  }

  return (
    <form noValidate onSubmit={handleSubmit} className="mt-6 space-y-4">
      {/* Name. */}
      <div>
        <label htmlFor="order-name" className={FIELD_LABEL}>
          Name
        </label>
        <input
          id="order-name" // the label points here
          required // screen readers say it is required; noValidate keeps the browser's own messages off
          type="text" // plain text
          autoComplete="name" // the browser can fill it
          maxLength={100} // the longest name
          value={values.name} // controlled by the form
          onChange={(event) => setField('name', event.target.value)} // report the typing
          onBlur={() => touch('name')} // errors show once the field is left
          aria-invalid={shownError('name') ? true : undefined} // red border with the error text
          aria-describedby={shownError('name') ? 'order-name-error' : undefined} // read the error with the field
          className={FIELD_BOX} // the shared field look
        />
        {shownError('name') && (
          <p id="order-name-error" className={FIELD_ERROR}>
            {shownError('name')}
          </p>
        )}
      </div>
      {/* Email. */}
      <div>
        <label htmlFor="order-email" className={FIELD_LABEL}>
          Email
        </label>
        <input
          id="order-email" // the label points here
          required // screen readers say it is required; noValidate keeps the browser's own messages off
          type="email" // the email keyboard on phones
          autoComplete="email" // the browser can fill it
          maxLength={254} // the longest address
          value={values.email} // controlled by the form
          onChange={(event) => setField('email', event.target.value)} // report the typing
          onBlur={() => touch('email')} // errors show once the field is left
          aria-invalid={shownError('email') ? true : undefined} // red border with the error text
          aria-describedby={shownError('email') ? 'order-email-error' : undefined} // read the error with the field
          className={FIELD_BOX} // the shared field look
        />
        {shownError('email') && (
          <p id="order-email-error" className={FIELD_ERROR}>
            {shownError('email')}
          </p>
        )}
      </div>
      {/* Phone. */}
      <div>
        <label htmlFor="order-phone" className={FIELD_LABEL}>
          Phone
        </label>
        <input
          id="order-phone" // the label points here
          required // screen readers say it is required; noValidate keeps the browser's own messages off
          type="tel" // the number pad on phones
          autoComplete="tel" // the browser can fill it
          maxLength={30} // room for spaces, dashes and brackets round 15 digits
          value={values.phone} // controlled by the form
          onChange={(event) => setField('phone', event.target.value)} // report the typing
          onBlur={() => touch('phone')} // errors show once the field is left
          aria-invalid={shownError('phone') ? true : undefined} // red border with the error text
          aria-describedby={shownError('phone') ? 'order-phone-error' : undefined} // read the error with the field
          className={FIELD_BOX} // the shared field look
        />
        {shownError('phone') && (
          <p id="order-phone-error" className={FIELD_ERROR}>
            {shownError('phone')}
          </p>
        )}
      </div>
      {/* Club: the dropdown and the Other field. */}
      <ClubSelect
        clubs={clubs}
        value={values.club}
        otherValue={values.otherClub}
        error={shownError('club')}
        otherError={shownError('otherClub')}
        onChange={(value) => setField('club', value)}
        onOtherChange={(value) => setField('otherClub', value)}
        onBlur={touch}
      />
      {/* The captcha; its token is what lets Send order look ready. */}
      <Captcha onToken={setToken} />
      <div>
        {/* The screen's one primary action; aria-disabled keeps it focusable so a press can say what is missing. */}
        <button
          type="submit" // Enter in a field presses it too
          aria-disabled={!complete} // looks disabled until complete
          aria-describedby={missing ? 'order-missing' : undefined} // read what is missing with the button
          className="bg-accent text-on-accent focus-visible:outline-focus-ring inline-flex min-h-11 w-full items-center justify-center rounded-md px-6 font-medium transition-transform duration-(--duration-press) focus-visible:outline-2 focus-visible:outline-offset-2 active:scale-[0.97] aria-disabled:opacity-50"
        >
          Send order
        </button>
        {/* Why the button looks disabled. */}
        {missing && (
          <p id="order-missing" className="text-text-muted mt-2 text-sm">
            {missing}
          </p>
        )}
      </div>
    </form>
  )
}
