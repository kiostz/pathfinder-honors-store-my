// Tests for honorId: the slug rule shared by the seed and club-added honors.

import { describe, expect, it } from 'vitest' // test API
import { honorId } from './slug.ts' // code under test

describe('honorId', () => {
  it('lowercases a plain name and joins words with a dash', () => {
    expect(honorId('Knot Tying')).toBe('knot-tying')
  })

  it('turns & and , into single dashes', () => {
    expect(honorId('First Aid, Advanced')).toBe('first-aid-advanced')
    expect(honorId('Arts & Crafts')).toBe('arts-crafts')
  })

  it('drops apostrophes without leaving a dash', () => {
    expect(honorId("Blood and the Body's Defenses")).toBe(
      'blood-and-the-bodys-defenses',
    )
  })

  it('drops diacritics', () => {
    expect(honorId('Paper Maché')).toBe('paper-mache')
  })

  it('handles parentheses', () => {
    expect(honorId('Currency - Advanced (European Union)')).toBe(
      'currency-advanced-european-union',
    )
  })

  it('trims leading and trailing symbols', () => {
    expect(honorId('  --Hiking!! ')).toBe('hiking')
  })
})
