// The cart state, shared by the row steppers and the cart bar, so one edit shows everywhere; kept in localStorage across reloads.

import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react' // context and state
import type { Honor } from '@/shared/data/types.ts' // the shape of an honor
import { resolveCart, setQuantity as withQuantity, type CartQuantities } from './cart.ts' // the quantity rules
import { readCart, writeCart } from './cart-storage.ts' // the stored cart
import { CartContext } from './use-cart.ts' // the context this provider fills

const NOTHING_TAKEN = { names: [] as string[], unnamed: 0 } // no Unavailable notice to show

/**
 * Holds the cart for everything below it, starts from storage and saves every change.
 * @param honors the loaded honors, or null while loading or after a failed load (nothing is taken out then)
 * @param children the screens that read or edit the cart
 * @return the provider element
 */
export function CartProvider({ honors, children }: { honors: Honor[] | null; children: ReactNode }) {
  const [initial] = useState(readCart) // read once, at start
  const [quantities, setQuantities] = useState<CartQuantities>(initial) // the cart
  const [taken, setTaken] = useState(NOTHING_TAKEN) // what the last take-out removed, for the Unavailable notice
  // Save each change; the first run is the start, which changes nothing, so a stored value stays untouched until the buyer edits; runs on every cart change.
  useEffect(() => {
    if (quantities === initial) return // nothing changed yet
    writeCart(quantities) // write at once
  }, [quantities, initial]) // rerun when the cart changes

  // Once honors load, take out what is switched off or gone; adjusted while rendering (React's way to derive state), saved by the effect above.
  if (honors !== null) {
    // not while loading, or after a failed load: the cart stays as it is
    const { unavailable } = resolveCart(quantities, honors) // what cannot be ordered
    if (unavailable.length > 0) {
      // nothing to take out otherwise, so no write before honors load or after a failed load
      const next = { ...quantities } // a copy
      for (const { honorId } of unavailable) delete next[honorId] // out of the cart
      setQuantities(next) // the cart without them
      // set with the take-out, in the same pass
      setTaken({
        names: unavailable.flatMap(({ name }) => (name === null ? [] : [name])), // switched-off honors, A to Z
        unnamed: unavailable.filter(({ name }) => name === null).length, // gone honors
      }) // for the cart screen's Unavailable notice
    }
  }

  const clearUnavailable = useCallback(
    () => setTaken((current) => (current.names.length === 0 && current.unnamed === 0 ? current : NOTHING_TAKEN)), // no re-render when already empty
    [], // setTaken never changes
  ) // the Unavailable notice goes when the buyer leaves the cart screen

  const quantityOf = useCallback((honorId: string) => quantities[honorId] ?? 0, [quantities]) // 0 for absent
  const setQuantity = useCallback(
    (honorId: string, quantity: number) => setQuantities((current) => withQuantity(current, honorId, quantity)), // clamp and store
    [], // setQuantities never changes
  ) // one stable setter
  // the object every reader gets
  const value = useMemo(
    () => ({
      quantities,
      quantityOf,
      setQuantity,
      unavailableNames: taken.names,
      unavailableUnnamed: taken.unnamed,
      clearUnavailable,
    }), // the cart and what the Unavailable notice needs
    [quantities, quantityOf, setQuantity, taken, clearUnavailable], // new only when one changes
  ) // stable between renders
  return <CartContext.Provider value={value}>{children}</CartContext.Provider> // everything below reads the cart
}
