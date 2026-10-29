// Keeps the sent order in sessionStorage so the confirmation survives a reload in the same tab, and goes when the tab closes.

import type { SentOrder } from './order-email.ts' // the stored shape

export const SENT_ORDER_STORAGE_KEY = 'pathfinder-honors-store-my:sent-order' // repo name in the key: the site origin is shared by the account's other sites
const SENT_ORDER_VERSION = 1 // the stored format

/**
 * Reads the stored order.
 * @param storage where to read; the browser's sessionStorage by default
 * @return the order; null when nothing is stored, or when the stored value is unusable (one warning then)
 */
export function readSentOrder(storage?: Storage): SentOrder | null {
  let text: string | null // the stored text
  try {
    text = (storage ?? window.sessionStorage).getItem(SENT_ORDER_STORAGE_KEY) // blocked storage throws here
  } catch {
    console.warn('Sent order storage cannot be read.') // never the error text: it may hold stored content
    return null
  }
  if (text === null) return null // nothing sent in this tab
  let parsed: unknown // whatever the text holds
  try {
    parsed = JSON.parse(text) // bad JSON throws
  } catch {
    console.warn('Stored sent order is not valid JSON.') // no content in the warning
    return null
  }
  const stored = parsed as {
    version?: unknown // the format number
    order?: { number?: unknown } | null // the order, checked below
  } | null
  if (
    typeof parsed !== 'object' || // not an object
    stored === null || // JSON null
    stored.version !== SENT_ORDER_VERSION || // another format
    typeof stored.order !== 'object' || // no order
    stored.order === null || // a null order
    typeof stored.order.number !== 'string' // not an order
  ) {
    console.warn('Stored sent order has an unknown format.') // no content in the warning
    return null
  }
  return stored.order as SentOrder // the order as written
}

/**
 * Stores the order.
 * @param order the sent order
 * @param storage where to write; the browser's sessionStorage by default
 * @return nothing; a failing storage gives a warning, because the order was already sent and must not look failed
 */
export function writeSentOrder(order: SentOrder, storage?: Storage): void {
  try {
    ;(storage ?? window.sessionStorage).setItem(
      SENT_ORDER_STORAGE_KEY,
      JSON.stringify({ version: SENT_ORDER_VERSION, order }), // the versioned format
    ) // blocked or full storage throws
  } catch {
    console.warn(
      `Sent order ${order.number} cannot be kept for the confirmation page.`,
    ) // the number only
  }
}
