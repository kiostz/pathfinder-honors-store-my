// The sent order's snapshot and its email: prices are frozen at the press, and the subject and text are what the order handler reads.

import type { OrderLine } from '@/features/cart/cart.ts' // an order line
import { formatPrice } from '@/shared/format/price.ts' // "RM 9.00"
import { STORE_NAME } from '@/shared/store-name.ts' // the store's name in the subject
import { clubText, type OrderFormValues } from './order-form.ts' // the club's names for the email

// An order as sent: lines in cents with the buyer's details, kept for the confirmation and the email.
export type SentOrder = {
  number: string // PF-YYYYMMDD-XXXX
  sentAt: string // ISO time of the send
  currency: string // ISO code from settings
  lines: Array<{
    honorId: string // which honor
    name: string // as shown at the press
    quantity: number // how many
    priceCents: number // one honor's price in cents
  }> // one per honor, at today's price
  totalCents: number // the estimated total
  name: string // the buyer's name
  email: string // the buyer's email
  phone: string // the buyer's phone
  club: { subject: string; email: string } // the club's name for the subject and for the body
}

/**
 * Collapses line breaks, control characters and the Unicode line and paragraph separators in typed text to spaces, so a field cannot add lines to the email.
 * @param text what the buyer typed
 * @return the text with each run of control characters as one space, trimmed
 */
function oneLine(text: string): string {
  return text.replace(/[\p{Cc}\p{Zl}\p{Zp}]+/gu, ' ').trim() // controls include \r and \n; Zl and Zp are U+2028 and U+2029
}

/**
 * Writes an amount for the email with a plain space, since the browser's money format uses a no-break space.
 * @param cents the amount in cents
 * @param currency the ISO code
 * @return e.g. "RM 9.00"
 */
function money(cents: number, currency: string): string {
  return formatPrice(cents / 100, currency).replace(/\u00a0/g, ' ') // a plain space reads the same in every mail client
}

/**
 * Freezes the cart and the form into an order.
 * @param number the order number
 * @param lines the order lines at today's prices
 * @param values the form
 * @param currency the ISO code from settings
 * @param now the moment of sending
 * @return the order
 */
export function toSentOrder(
  number: string,
  lines: OrderLine[],
  values: OrderFormValues,
  currency: string,
  now: Date,
): SentOrder {
  const sentLines = lines.map((line) => ({
    honorId: line.honor.id, // which honor
    name: line.honor.name, // as shown today
    quantity: line.quantity, // how many
    priceCents: Math.round(line.honor.price * 100), // cents first, so 1.15 stays 115
  })) // the frozen lines
  const club = clubText({ ...values, otherClub: oneLine(values.otherClub) }) // the club's names
  return {
    number, // the order number
    sentAt: now.toISOString(), // an exact moment
    currency, // as settings had it
    lines: sentLines, // the frozen lines
    totalCents: sentLines.reduce(
      (sum, line) => sum + line.priceCents * line.quantity,
      0,
    ), // the sum of the line totals
    name: oneLine(values.name), // one line
    email: oneLine(values.email), // one line
    phone: oneLine(values.phone), // one line
    club: { subject: club.subject, email: club.email }, // names only, never the club's four detail fields
  }
}

/**
 * Words the email subject.
 * @param order the order
 * @return "PEM Pathfinder Store order PF-… — club — name"
 */
export function orderEmailSubject(order: SentOrder): string {
  return `${STORE_NAME} order ${order.number} — ${order.club.subject} — ${order.name}` // number, club, buyer
}

/**
 * Writes the email text, one readable line per honor.
 * @param order the order
 * @return the header, the lines and the estimated total
 */
export function orderEmailText(order: SentOrder): string {
  const lineTexts = order.lines.map(
    (line) =>
      `${line.quantity} × ${line.name} @ ${money(line.priceCents, order.currency)} = ${money(line.priceCents * line.quantity, order.currency)}`,
  ) // "3 × Knot Tying @ RM 3.00 = RM 9.00"
  return [
    `Order: ${order.number}`, // the number the handler pairs by
    `Name:  ${order.name}`, // the buyer
    `Email: ${order.email}`, // where the invoice goes
    `Phone: ${order.phone}`, // the buyer's number
    `Club:  ${order.club.email}`, // the club
    '', // a blank line before the lines
    ...lineTexts, // one per order line
    '', // a blank line before the total
    `Estimated total: ${money(order.totalCents, order.currency)}`, // at today's prices
  ].join('\n') // one block
}
