// Reads which screen the address hash names, so the cart screen has an address that back and reload understand, with no router package.

import { useSyncExternalStore } from 'react' // follows the address
import { CART_HASH } from '@/shared/routes.ts' // the cart screen's address

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
 * @return 'cart' for exactly #/cart, otherwise 'catalogue'
 */
export function useHashRoute(): 'catalogue' | 'cart' {
  const hash = useSyncExternalStore(subscribe, () => window.location.hash) // the live hash
  return hash === CART_HASH ? 'cart' : 'catalogue' // anything else is the catalogue
}
