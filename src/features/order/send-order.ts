// Sends an order to Web3Forms and says how it failed; in dev's fake-send mode it waits and logs instead, so the flow can be tried without a real send.

import {
  orderEmailSubject,
  orderEmailText,
  type SentOrder,
} from './order-email.ts' // the email

const SUBMIT_URL = 'https://api.web3forms.com/submit' // Web3Forms' JSON endpoint
const TIMEOUT_MS = 20_000 // a send that takes longer counts as failed
const FAKE_DELAY_MS = 800 // how long the fake send takes

// How a send failed: no connection, too slow, too many orders, or refused.
export type OrderSendKind = 'network' | 'timeout' | 'rate-limited' | 'rejected'

// The error a failed send throws; its message carries no buyer data.
export class OrderSendError extends Error {
  readonly kind: OrderSendKind // what went wrong

  /**
   * @param kind what went wrong
   */
  constructor(kind: OrderSendKind) {
    super(`Order send failed: ${kind}`) // kind only
    this.name = 'OrderSendError' // for logs and tests
    this.kind = kind // what the form words its message from
  }
}

/**
 * Sends the order; resolves only on HTTP 200 with success true.
 * @param order the order
 * @param captchaToken the solved hCaptcha token
 * @param fetchFn the fetch to use; the browser's by default
 * @return nothing when Web3Forms accepted the order
 * @throws OrderSendError for every other outcome
 */
export async function sendOrder(
  order: SentOrder,
  captchaToken: string,
  fetchFn: typeof fetch = fetch,
): Promise<void> {
  const subject = orderEmailSubject(order) // the email subject
  const message = orderEmailText(order) // the email text
  if (import.meta.env.DEV && import.meta.env.VITE_ORDER_SEND === 'fake') {
    // dev only: the build drops this branch, so the live site cannot fake a send
    await new Promise((resolve) => setTimeout(resolve, FAKE_DELAY_MS)) // long enough to see "Sending…"
    console.info(subject, message) // what the order handler would read
    return
  }
  let response: Response // Web3Forms' answer
  try {
    response = await fetchFn(SUBMIT_URL, {
      method: 'POST', // a submission
      headers: {
        'Content-Type': 'application/json', // the body is JSON
        Accept: 'application/json', // and so is the answer
      }, // JSON in and out
      body: JSON.stringify({
        access_key: import.meta.env.VITE_WEB3FORMS_ACCESS_KEY, // public by design
        subject, // "Honor order PF-… — club — name"
        from_name: 'Pathfinder Honors', // the sender name in the inbox
        replyto: order.email, // so the handler can reply to the buyer
        message, // the order text
        'h-captcha-response': captchaToken, // Web3Forms checks it
      }),
      signal: AbortSignal.timeout(TIMEOUT_MS), // never wait forever
    })
  } catch (error) {
    const timedOut = // the timeout signal fired
      error instanceof DOMException && // an abort is a DOMException
      (error.name === 'TimeoutError' || error.name === 'AbortError') // by either name
    throw new OrderSendError(timedOut ? 'timeout' : 'network') // no connection, or too slow
  }
  if (response.status === 429) throw new OrderSendError('rate-limited') // Web3Forms asks to wait
  let body: unknown // the JSON answer, if it is JSON
  try {
    body = await response.json() // a 500 page may not be JSON
  } catch {
    throw new OrderSendError('rejected') // not an answer we can trust
  }
  if (!response.ok || (body as { success?: unknown } | null)?.success !== true)
    throw new OrderSendError('rejected') // 4xx, 5xx or success false
}
