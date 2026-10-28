// Holds the order form's values above the routes, in memory only, so a buyer who goes back to add an honor finds the form as they left it.

import { useCallback, useMemo, useState, type ReactNode } from 'react' // state and context
import { EMPTY_ORDER_FORM, type OrderField, type OrderFormValues } from './order-form.ts' // the form's shapes
import { OrderFormContext } from './use-order-form.ts' // the context this provider fills

const ALL_FIELDS: OrderField[] = ['name', 'email', 'phone', 'club', 'otherClub'] // every field of the form

/**
 * Holds the form for everything below it.
 * @param children the screens that read or edit the form
 * @return the provider element
 */
export function OrderFormProvider({ children }: { children: ReactNode }) {
  const [values, setValues] = useState<OrderFormValues>(EMPTY_ORDER_FORM) // what the buyer has typed
  const [touched, setTouched] = useState<Partial<Record<OrderField, boolean>>>({}) // fields the buyer has left

  /**
   * Changes one field's value.
   * @param field the field
   * @param value its new value
   */
  const setField = useCallback(
    (field: OrderField, value: string) => setValues((current) => ({ ...current, [field]: value })),
    [],
  ) // one field changes
  /**
   * Marks one field as left, so its error can show.
   * @param field the field
   */
  const touch = useCallback(
    (field: OrderField) => setTouched((current) => (current[field] ? current : { ...current, [field]: true })),
    [],
  ) // no re-render when already touched
  /** Marks every field as left, so every error shows after a Send press. */
  const touchAll = useCallback(() => setTouched(Object.fromEntries(ALL_FIELDS.map((field) => [field, true]))), []) // a Send press shows every error
  /** Empties the form and hides every error. */
  const reset = useCallback(() => {
    setValues(EMPTY_ORDER_FORM) // empty fields
    setTouched({}) // no errors showing
  }, [])

  const value = useMemo(
    () => ({ values, touched, setField, touch, touchAll, reset }),
    [values, touched, setField, touch, touchAll, reset],
  ) // new only when one changes
  return <OrderFormContext.Provider value={value}>{children}</OrderFormContext.Provider> // everything below reads the form
}
