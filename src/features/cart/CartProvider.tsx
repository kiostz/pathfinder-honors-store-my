// The cart state, shared by the row steppers and the cart bar, so one edit shows everywhere.

import { useCallback, useMemo, useState, type ReactNode } from 'react' // context and state
import { setQuantity as withQuantity, type CartQuantities } from './cart.ts' // the quantity rules
import { CartContext } from './use-cart.ts' // the context this provider fills

/**
 * Holds the cart in memory for everything below it.
 * @param children the screens that read or edit the cart
 * @return the provider element
 */
export function CartProvider({ children }: { children: ReactNode }) {
  const [quantities, setQuantities] = useState<CartQuantities>({}) // the cart
  const quantityOf = useCallback((honorId: string) => quantities[honorId] ?? 0, [quantities]) // 0 for absent
  const setQuantity = useCallback(
    (honorId: string, quantity: number) => setQuantities((current) => withQuantity(current, honorId, quantity)), // clamp and store
    [], // setQuantities never changes
  ) // one stable setter
  const value = useMemo(() => ({ quantities, quantityOf, setQuantity }), [quantities, quantityOf, setQuantity]) // stable between renders
  return <CartContext.Provider value={value}>{children}</CartContext.Provider> // everything below reads the cart
}
