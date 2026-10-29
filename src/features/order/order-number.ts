// Makes the order number PF-YYYYMMDD-XXXX in the browser: the buyer's local date and four random characters, so no counter is needed.

const ALPHABET = '23456789ABCDEFGHJKMNPQRSTUVWXYZ' // 31 characters, no 0/O or 1/I/L to misread on paper
const SUFFIX_LENGTH = 4 // characters after the date
const UNBIASED_LIMIT = 248 // 31 * 8: bytes below it map to the alphabet evenly

/**
 * Makes an order number.
 * @param now the moment of sending; its local date is used
 * @param randomValues fills a byte array with random bytes; the browser's crypto by default
 * @return the number, e.g. "PF-20261028-4K7Q"
 */
export function makeOrderNumber(
  now: Date = new Date(),
  randomValues: (
    array: Uint8Array<ArrayBuffer>,
  ) => Uint8Array = crypto.getRandomValues.bind(crypto),
): string {
  const date = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}` // local date, zero-padded
  let suffix = '' // grows to four characters
  while (suffix.length < SUFFIX_LENGTH) {
    for (const byte of randomValues(new Uint8Array(new ArrayBuffer(8)))) {
      if (byte >= UNBIASED_LIMIT || suffix.length === SUFFIX_LENGTH) continue // skip the biased bytes, stop at four
      suffix += ALPHABET[byte % ALPHABET.length] // one character
    }
  }
  return `PF-${date}-${suffix}` // the number
}
