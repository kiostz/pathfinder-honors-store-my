// Cart maths: quantity rules, the A to Z order lines and exact money in cents, so every screen shows the same numbers.

import type { Honor } from '@/shared/data/types.ts' // the shape of an honor
import { sortByName } from '@/shared/sort/sort-by-name.ts' // names A to Z

export const MAX_QUANTITY = 99 // the most of one honor in a cart

// Honor id to quantity, 1 to 99; 0 is never kept.
export type CartQuantities = Record<string, number>

// One honor and its quantity in the cart.
export type OrderLine = { honor: Honor; quantity: number }

/**
 * Forces a quantity into the whole numbers 0 to 99.
 * @param value any number
 * @return the whole part, never below 0 or above 99; NaN gives 0
 */
export function clampQuantity(value: number): number {
  if (Number.isNaN(value)) return 0 // nothing usable typed
  return Math.min(MAX_QUANTITY, Math.max(0, Math.floor(value))) // whole numbers inside the limits
}

/**
 * Sets one honor's quantity.
 * @param quantities the cart now
 * @param honorId the honor to change
 * @param quantity the new quantity; clamped, and 0 removes the honor
 * @return a new cart; the input is left as it was
 */
export function setQuantity(
  quantities: CartQuantities,
  honorId: string,
  quantity: number,
): CartQuantities {
  const next = { ...quantities } // a copy, so the input stays as it was
  const clamped = clampQuantity(quantity) // 0 to 99
  if (clamped === 0)
    delete next[honorId] // 0 deletes the key
  else next[honorId] = clamped // otherwise store it
  return next // the new cart
}

/**
 * Turns the cart into order lines A to Z.
 * @param quantities the cart
 * @param honors every honor in the data
 * @return the order lines by name, and the cart's ids that are switched off (with their name) or missing from the data (name null)
 */
export function resolveCart(
  quantities: CartQuantities,
  honors: Honor[],
): {
  lines: OrderLine[]
  unavailable: Array<{ honorId: string; name: string | null }>
} {
  const inCart = honors.filter((honor) => quantities[honor.id] !== undefined) // honors the cart names
  const available = inCart.filter((honor) => honor.enabled) // switched on
  const known = new Set(inCart.map((honor) => honor.id)) // ids the data has
  return {
    lines: sortByName(available).map((honor) => ({
      honor, // the honor
      quantity: quantities[honor.id], // how many are in the cart
    })), // A to Z with quantities
    unavailable: [
      ...sortByName(inCart.filter((honor) => !honor.enabled)).map((honor) => ({
        honorId: honor.id, // which honor
        name: honor.name, // what the Unavailable notice calls it
      })), // switched off, by name
      ...Object.keys(quantities)
        .filter((honorId) => !known.has(honorId)) // ids the data lacks
        .map((honorId) => ({ honorId, name: null })), // gone from the data
    ], // everything the cart holds that cannot be ordered
  } // the order lines and what to take out
}

/**
 * Prices one order line in cents.
 * @param line the order line
 * @return price in cents times quantity, a whole number
 */
export function lineTotalCents(line: OrderLine): number {
  return Math.round(line.honor.price * 100) * line.quantity // cents first, so 1.15 stays 115
}

/**
 * Adds the line totals.
 * @param lines the order lines
 * @return the estimated total in cents
 */
export function estimatedTotalCents(lines: OrderLine[]): number {
  return lines.reduce((sum, line) => sum + lineTotalCents(line), 0) // shown lines always add up to this
}

/**
 * Gives the Item count of the cart.
 * @param lines the order lines
 * @return the sum of all quantities
 */
export function cartCount(lines: OrderLine[]): number {
  return lines.reduce((sum, line) => sum + line.quantity, 0) // quantities, not lines
}
