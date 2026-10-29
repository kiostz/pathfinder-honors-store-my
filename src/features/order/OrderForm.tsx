// The order form under the cart's estimated total: name, email, phone, club and captcha, with Send order that looks ready only when everything is filled in and sends the order.

import { useEffect, useRef, useState, type FormEvent } from 'react' // the captcha token, the send state and focus
import type { OrderLine } from '@/features/cart/cart.ts' // the order lines being sent
import { useCart } from '@/features/cart/use-cart.ts' // the sent order lines leave it
import type { ClubList } from '@/shared/data/types.ts' // the clubs
import { ORDER_SENT_HASH } from '@/shared/routes.ts' // the confirmation page's address
import { Captcha, type CaptchaHandle } from './Captcha.tsx' // the hCaptcha widget
import { ClubSelect } from './ClubSelect.tsx' // the club field
import { FIELD_BOX, FIELD_ERROR, FIELD_LABEL } from './field-box.ts' // the shared field look
import { toSentOrder } from './order-email.ts' // freezes the order
import { missingText, validateOrderForm, type OrderField } from './order-form.ts' // the form's rules
import { makeOrderNumber } from './order-number.ts' // the order number
import { OrderSendError, sendOrder } from './send-order.ts' // the send and its failures
import { writeSentOrder } from './sent-order-storage.ts' // keeps the order for the confirmation
import { useOrderForm } from './use-order-form.ts' // the form's values

const FAILED_TEXT = 'Your order was not sent. Check your connection, tick the captcha again and press Send order.' // above Send order after a failure
const RATE_LIMITED_TEXT =
  'Too many orders were sent just now. Wait a minute, tick the captcha again and press Send order.' // above Send order after a 429

const TAKE_BACK_MS = 1000 // how long after a failure the widget's own focus grab is handed back to Send order

const FIELD_IDS: Record<OrderField, string> = {
  name: 'order-name',
  email: 'order-email',
  phone: 'order-phone',
  club: 'order-club',
  otherClub: 'order-other-club',
} // the DOM id of each field, in form order, for focusing the first invalid one

/**
 * Draws the order form.
 * @param lines the order lines to send
 * @param currency the ISO code from settings
 * @param clubs the clubs for the dropdown
 * @return the fields, the captcha, Send order and the line saying what is missing
 */
export function OrderForm({ lines, currency, clubs }: { lines: OrderLine[]; currency: string; clubs: ClubList }) {
  const {
    values,
    touched,
    setField,
    touch,
    touchAll,
    reset,
    sending,
    sendingRef,
    setSending,
    failure,
    setFailure,
    numberRef,
  } = useOrderForm() // the form's state and the running send, kept above the routes
  const { removeOrderLines } = useCart() // a sent order leaves the cart
  const [token, setToken] = useState<string | null>(null) // the captcha token, until it expires
  const [sentNumber, setSentNumber] = useState<string | null>(null) // set when the order went out but the confirmation page could not open
  const captchaRef = useRef<CaptchaHandle>(null) // reset after every failed send, because Web3Forms spends the token
  const sendRef = useRef<HTMLButtonElement>(null) // focused after a failure
  const missingRef = useRef<HTMLParagraphElement>(null) // focused when only the captcha is missing
  const takeFocusBackRef = useRef(false) // set by a failure, cleared by the buyer's first key or tap, a captcha token or a second's wait: the captcha's reset may then grab focus once
  const errors = validateOrderForm(values, clubs) // what is wrong now
  const complete = Object.keys(errors).length === 0 && token !== null // ready to send
  const missing = missingText(errors, token !== null) // the line under the button
  /**
   * Gives the error text of a field once the buyer has left it.
   * @param field the field
   * @return the text, or undefined while it is untouched or valid
   */
  const shownError = (field: OrderField) => (touched[field] ? errors[field] : undefined)

  // After a failed send the buyer is back at Send order, ready to tick again and retry.
  useEffect(() => {
    if (failure === null) return // nothing failed
    sendRef.current?.focus() // the screen is no longer inert by now
    takeFocusBackRef.current = true // hCaptcha's reset may take focus for its frame soon; the captcha's focus event hands it back
    const timer = window.setTimeout(() => (takeFocusBackRef.current = false), TAKE_BACK_MS) // a tap inside the frame cannot be seen, so the window closes
    return () => window.clearTimeout(timer) // a new failure or leaving the screen
  }, [failure])

  /**
   * Handles Send order: an incomplete form shows what is missing; a complete one sends the order.
   * @param event the form's submit
   */
  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault() // never a page load
    if (sendingRef.current || sentNumber !== null) return // one send at a time, and never a sent order again
    if (!complete || token === null) {
      touchAll() // every error shows
      const first = (Object.keys(FIELD_IDS) as OrderField[]).find((field) => errors[field] !== undefined) // the first invalid field in form order
      if (first)
        document.getElementById(FIELD_IDS[first])?.focus() // the buyer starts there
      else missingRef.current?.focus() // only the captcha is missing: read the line that says so
      return
    }
    setSending(true) // no second press, "Sending…", and the screen freezes
    setFailure(null) // the last failure is old news
    const signature = JSON.stringify([
      lines.map((line) => [line.honor.id, line.quantity, line.honor.price]),
      values,
      currency,
    ]) // what the order is
    if (numberRef.current?.signature !== signature) numberRef.current = { signature, number: makeOrderNumber() } // a retry keeps its number, an edit gets a new one
    const order = toSentOrder(numberRef.current.number, lines, values, currency, new Date()) // prices as shown now
    try {
      await sendOrder(order, token) // Web3Forms, or the fake in dev
    } catch (error) {
      const kind = error instanceof OrderSendError ? error.kind : 'unexpected' // a bug is logged too, never hidden
      const detail = // the safe part of an unexpected error
        error instanceof Error // only an Error has a name and a stack
          ? { name: error.name, stack: (error.stack ?? '').split(`${error.name}: ${error.message}`).join('') } // the stack without the message, which could hold typed text
          : {} // not an Error: nothing safe to add
      console.error('Order send failed', { kind, orderNumber: order.number, ...(kind === 'unexpected' ? detail : {}) }) // no buyer data
      captchaRef.current?.reset() // the spent token cannot be used again
      setToken(null) // Send is incomplete until ticked again
      setFailure({ text: kind === 'rate-limited' ? RATE_LIMITED_TEXT : FAILED_TEXT }) // cart and form stay as they are
      return // the finally below frees the screen
    } finally {
      setSending(false) // the next press may send, the button is itself again and the screen is free
    }
    // The order is sent: nothing below may say it was not.
    try {
      writeSentOrder(order) // for the confirmation page
      window.location.replace(ORDER_SENT_HASH) // the confirmation first, so no empty-cart frame paints; Back leads to the catalogue
      removeOrderLines(order.lines) // only after Web3Forms confirmed, and only what the email listed
      reset() // empty fields
      numberRef.current = null // the next order is a new one
    } catch (error) {
      console.error('Order sent but the screen could not be updated', {
        orderNumber: order.number, // which order
        name: error instanceof Error ? error.name : 'unknown', // the kind of error, never its message
      }) // an error here is logged, and the buyer is not told the order failed
      setSentNumber(order.number) // the buyer is told the order went out, in place of the confirmation page
    }
  }

  return (
    <form
      noValidate
      onSubmit={handleSubmit}
      onKeyDownCapture={() => (takeFocusBackRef.current = false)} // a key press means the buyer is steering, so the widget may keep focus
      onPointerDownCapture={() => (takeFocusBackRef.current = false)} // so does a tap
      className="mt-6 space-y-4"
    >
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
      <div
        onFocus={() => {
          if (!takeFocusBackRef.current) return // the buyer went here on purpose, or nothing failed
          takeFocusBackRef.current = false // once
          sendRef.current?.focus() // the widget's reset grabbed focus; back to Send order
        }} // focus events bubble from the widget's frame
      >
        <Captcha
          onToken={(next) => {
            takeFocusBackRef.current = false // the widget has spoken; its focus is the buyer's own
            setToken(next) // the token, or null when it expires
          }}
          ref={captchaRef}
        />
      </div>
      <div>
        {/* Says the order was not sent, once; read out at once. */}
        {failure && (
          <p role="alert" className="text-danger mb-2 text-sm">
            {failure.text}
          </p>
        )}
        {/* The order went out but the confirmation page could not open. */}
        {sentNumber && (
          <p role="status" className="mb-2 text-sm">
            Order sent. Your order number is {sentNumber}. Do not send it again; the treasurer will email you the
            invoice.
          </p>
        )}
        {/* The screen's one primary action; aria-disabled keeps it focusable so a press can say what is missing. */}
        <button
          ref={sendRef} // focused after a failure
          type="submit" // Enter in a field presses it too
          aria-disabled={!complete || sending} // looks disabled until complete, and while sending
          aria-describedby={missing ? 'order-missing' : undefined} // read what is missing with the button
          className="bg-accent text-on-accent focus-visible:outline-focus-ring inline-flex min-h-11 w-full items-center justify-center rounded-md px-6 font-medium transition-transform duration-(--duration-press) focus-visible:outline-2 focus-visible:outline-offset-2 active:scale-[0.97] aria-disabled:opacity-50"
        >
          {sending ? 'Sending…' : 'Send order'}
          {/* Appears only after the loader delay, so a quick send flashes nothing. */}
          {sending && <span aria-hidden="true" className="send-spinner ml-2" />}
        </button>
        {/* Why the button looks disabled. */}
        {missing && (
          <p ref={missingRef} tabIndex={-1} id="order-missing" className="text-text-muted mt-2 text-sm outline-none">
            {missing}
          </p>
        )}
      </div>
    </form>
  )
}
