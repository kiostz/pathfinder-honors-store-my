// The order form's context and its hook, in their own file so OrderFormProvider.tsx exports only a component.

import { createContext, useContext } from 'react' // context and its reader
import type { OrderField, OrderFormValues } from './order-form.ts' // the form's shapes

// What every reader of the form gets.
export type OrderFormValue = {
  values: OrderFormValues // what the buyer has typed or chosen
  touched: Partial<Record<OrderField, boolean>> // fields the buyer has left, or all after a Send press
  setField: (field: OrderField, value: string) => void // change one field
  touch: (field: OrderField) => void // mark one field as left
  touchAll: () => void // mark every field, so every error shows
  reset: () => void // empty the form
}

export const OrderFormContext = createContext<OrderFormValue | null>(null) // null outside an OrderFormProvider

/**
 * Reads the order form.
 * @return the values, which fields were left, and how to change them
 */
export function useOrderForm(): OrderFormValue {
  const value = useContext(OrderFormContext) // the nearest provider
  if (value === null)
    throw new Error('useOrderForm must be used inside an OrderFormProvider') // a wiring mistake, fail loudly
  return value // the form
}
