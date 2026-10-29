// Tests for the sent order's sessionStorage: a round trip, and every bad stored value giving null with a warning.

import { afterEach, describe, expect, it, vi } from 'vitest' // test API and mocks
import {
  readSentOrder,
  SENT_ORDER_STORAGE_KEY,
  writeSentOrder,
} from './sent-order-storage.ts' // code under test
import type { SentOrder } from './order-email.ts' // the stored shape

const order: SentOrder = {
  number: 'PF-20261028-4K7Q',
  sentAt: '2026-10-28T10:00:00.000Z',
  currency: 'MYR',
  lines: [
    { honorId: 'knot-tying', name: 'Knot Tying', quantity: 3, priceCents: 300 },
  ],
  totalCents: 900,
  name: 'J. Cruz',
  email: 'jc@mail.com',
  phone: '+60 12-345 6789',
  club: { subject: 'Eagles', email: 'Eagles' },
} // an order as sent

afterEach(() => {
  window.sessionStorage.clear() // nothing left for the next test
  vi.restoreAllMocks() // spies removed
})

describe('sent order storage', () => {
  it('keeps the order under its key in the versioned format and reads it back', () => {
    // catches: a key or format that differs from what the confirmation page reads
    writeSentOrder(order)
    expect(
      JSON.parse(window.sessionStorage.getItem(SENT_ORDER_STORAGE_KEY) ?? ''),
    ).toEqual({ version: 1, order })
    expect(readSentOrder()).toEqual(order)
  })

  it('reads null when nothing is stored, without a warning', () => {
    // catches: a warning on every visit to the confirmation address
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    expect(readSentOrder()).toBeNull()
    expect(warn).not.toHaveBeenCalled()
  })

  it.each([
    ['bad JSON', 'not json'],
    ['version 2', '{"version":2,"order":{"number":"PF-20261028-4K7Q"}}'],
    ['JSON null', 'null'],
    ['no order', '{"version":1}'],
  ])('reads null with one warning for %s', (_label, text) => {
    // catches: a stale or hand-edited value crashing the confirmation page
    window.sessionStorage.setItem(SENT_ORDER_STORAGE_KEY, text)
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    expect(readSentOrder()).toBeNull()
    expect(warn).toHaveBeenCalledTimes(1)
  })

  it('reads null with a warning when storage throws, and a write that throws does not throw', () => {
    // catches: blocked storage turning a sent order into an error screen
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const broken = {
      getItem: () => {
        throw new Error('blocked')
      },
      setItem: () => {
        throw new Error('blocked')
      },
    } as unknown as Storage
    expect(readSentOrder(broken)).toBeNull()
    expect(() => writeSentOrder(order, broken)).not.toThrow()
    expect(warn).toHaveBeenCalledTimes(2)
  })
})
