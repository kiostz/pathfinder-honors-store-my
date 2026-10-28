// Tests for formatPrice: the price text shown on every honor row, in the currency set in settings.

import { describe, expect, it } from 'vitest' // test API
import { formatPrice } from './price.ts' // code under test

describe('formatPrice', () => {
  it('writes MYR as "RM 4.00"', () => {
    expect(formatPrice(4, 'MYR')).toMatch(/^RM\s?4\.00$/) // catches a missing symbol or decimals
  })

  it('keeps two decimals for 3.5', () => {
    expect(formatPrice(3.5, 'MYR')).toMatch(/^RM\s?3\.50$/) // catches "3.5"
  })

  it('shows zero as a price', () => {
    expect(formatPrice(0, 'MYR')).toMatch(/^RM\s?0\.00$/) // catches a falsy check hiding zero
  })

  it('writes USD with a dollar sign', () => {
    expect(formatPrice(4, 'USD')).toBe('$4.00') // catches a hard-coded RM
  })

  it('writes a malformed code before the amount', () => {
    expect(formatPrice(4, 'RM')).toBe('RM 4.00') // catches a RangeError from Intl reaching the screen
  })

  it('writes the amount alone for an empty code', () => {
    expect(formatPrice(4, '')).toBe('4.00') // catches a leading space or "undefined"
  })
})
