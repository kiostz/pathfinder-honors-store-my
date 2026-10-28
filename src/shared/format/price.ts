// Formats a price for the catalogue, cart and order text in the currency set in settings, so no symbol table is needed.

/**
 * Formats an amount as money, e.g. "RM 4.00".
 * @param amount the price in the currency's main unit
 * @param currency ISO currency code from settings, e.g. "MYR"
 * @return the price text; a malformed code is written before the amount, an empty one is left out
 */
export function formatPrice(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat('en', {
      style: 'currency', // money format
      currency, // the ISO code
      currencyDisplay: 'narrowSymbol', // RM rather than MYR
    }).format(amount) // the browser knows the symbol and the decimals
  } catch {
    // malformed code: write it before the amount
    return `${currency} ${amount.toFixed(2)}`.trim() // Intl throws RangeError on a malformed code
  }
}
