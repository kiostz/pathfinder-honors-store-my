// Reads which screen the address hash names, so the cart screen has an address that back and reload understand, with no router package.

import { useSyncExternalStore } from 'react' // follows the address
import { CART_HASH, DETAILS_HASH, ORDER_SENT_HASH } from '@/shared/routes.ts' // the cart screen's, details page's and confirmation page's addresses

/**
 * Tells React when the hash changes.
 * @param onChange called on every hashchange
 * @return the function that stops listening
 */
function subscribe(onChange: () => void): () => void {
  window.addEventListener('hashchange', onChange) // back, forward, links and typing all fire it
  return () => window.removeEventListener('hashchange', onChange) // stop on unmount
}

/**
 * Names the screen for the current address.
 * @return 'cart' for exactly #/cart, 'details' for exactly #/details, 'order-sent' for exactly #/order-sent, otherwise 'catalogue'
 */
export function useHashRoute():
  'catalogue' | 'cart' | 'details' | 'order-sent' {
  const hash = useSyncExternalStore(subscribe, () => window.location.hash) // the live hash
  if (hash === CART_HASH) return 'cart' // the cart screen
  if (hash === DETAILS_HASH) return 'details' // the details page
  return hash === ORDER_SENT_HASH ? 'order-sent' : 'catalogue' // anything else is the catalogue
}
