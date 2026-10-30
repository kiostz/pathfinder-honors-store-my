// Tests for the shop address helpers: a category must survive the round trip through the address, whatever characters its name holds.

import { describe, expect, it } from 'vitest' // test API
import {
  HOME_HASH,
  CATALOGUE_HASH,
  readShopCategory,
  shopHash,
} from './routes.ts' // code under test

describe('shop addresses', () => {
  it('names Home #/ and the shop #/shop', () => {
    // catches: the shop keeping the old home address
    expect(HOME_HASH).toBe('#/')
    expect(CATALOGUE_HASH).toBe('#/shop')
  })

  it.each(['Arts and Crafts', 'Fish & Chips', 'What?', 'C#', 'A+B', '100%'])(
    'gives back "%s" after shopHash then readShopCategory',
    (name) => {
      // catches: a category name with a reserved character breaking the address
      expect(readShopCategory(shopHash(name))).toBe(name)
    },
  )

  it('builds #/shop for no category and an encoded query for one', () => {
    // catches: a stray ? on the plain shop address, or a raw space in the query
    expect(shopHash(null)).toBe('#/shop')
    expect(shopHash('Arts and Crafts')).toBe(
      '#/shop?category=Arts%20and%20Crafts',
    )
  })

  it.each([
    '#/shop',
    '#/shop?category=',
    '#/shop?category=%20',
    '#/shop?x=1',
    '#/cart',
    '',
  ])('reads no category from "%s"', (hash) => {
    // catches: a blank or missing category becoming a filter
    expect(readShopCategory(hash)).toBeNull()
  })

  it('reads + as a space', () => {
    // catches: a hand-typed + not decoding
    expect(readShopCategory('#/shop?category=Arts+and+Crafts')).toBe(
      'Arts and Crafts',
    )
  })
})
