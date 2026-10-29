// Tests for makeOrderNumber: the PF-YYYYMMDD-XXXX format, the buyer's local date and the unbiased random suffix.

import { describe, expect, it } from 'vitest' // test API
import { makeOrderNumber } from './order-number.ts' // code under test

/**
 * Builds a stand-in for crypto.getRandomValues that fills any array by cycling the given bytes.
 * @param bytes the bytes to cycle through
 * @return a function with getRandomValues' shape
 */
function fakeRandom(bytes: number[]) {
  return (array: Uint8Array) => {
    for (let index = 0; index < array.length; index++)
      array[index] = bytes[index % bytes.length] // cycle the bytes
    return array
  }
}

describe('makeOrderNumber', () => {
  it('writes PF, the local date and four characters from the random bytes', () => {
    // catches: a wrong prefix, date layout or alphabet mapping
    const number = makeOrderNumber(
      new Date(2026, 9, 28, 10, 0),
      fakeRandom([0, 1, 2, 30]),
    )
    expect(number).toBe('PF-20261028-234Z')
  })

  it('skips bytes that would bias the alphabet (248 and above)', () => {
    // catches: a modulo over 256 bytes, which makes the first characters likelier
    const number = makeOrderNumber(
      new Date(2026, 9, 28, 10, 0),
      fakeRandom([255, 248, 0, 1, 2, 3]),
    )
    expect(number).toBe('PF-20261028-2345')
  })

  it('uses the buyer local date near midnight, not the UTC date', () => {
    // catches: toISOString for the date, which is a day off for part of the day in any timezone but UTC
    expect(
      makeOrderNumber(new Date(2026, 9, 28, 0, 30), fakeRandom([0])),
    ).toMatch(/^PF-20261028-/)
    expect(
      makeOrderNumber(new Date(2026, 9, 28, 23, 30), fakeRandom([0])),
    ).toMatch(/^PF-20261028-/)
  })

  it('pads a single-digit month and day', () => {
    // catches: PF-2026-1-5 instead of PF-20260105
    expect(
      makeOrderNumber(new Date(2026, 0, 5, 12, 0), fakeRandom([0])),
    ).toMatch(/^PF-20260105-/)
  })

  it('makes 1000 numbers that all match the format, with no look-alike characters', () => {
    // catches: 0, O, 1, I or L slipping into the suffix, or a suffix of the wrong length
    for (let count = 0; count < 1000; count++) {
      expect(makeOrderNumber(new Date(2026, 9, 28, 10, 0))).toMatch(
        /^PF-\d{8}-[2-9A-HJKMNP-Z]{4}$/,
      )
    }
  })
})
