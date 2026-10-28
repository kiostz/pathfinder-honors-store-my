// The cart context and its hook, in their own file so CartProvider.tsx exports only a component.

import { createContext, useContext } from 'react' // context and its reader
import type { CartQuantities } from './cart.ts' // the cart's shape

// What every reader of the cart gets.
export type CartValue = {
  quantities: CartQuantities // honor id to quantity
  quantityOf: (honorId: string) => number // 0 when the honor is not in the cart
  setQuantity: (honorId: string, quantity: number) => void // change one honor, 0 removes it
}

export const CartContext = createContext<CartValue | null>(null) // null outside a CartProvider

/**
 * Reads the cart.
 * @return the quantities and how to read and change them
 */
export function useCart(): CartValue {
  const value = useContext(CartContext) // the nearest provider
  if (value === null)
    throw new Error('useCart must be used inside a CartProvider') // a wiring mistake, fail loudly
  return value // the quantities and how to change them
}
