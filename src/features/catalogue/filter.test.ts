// Tests for the catalogue's search, category filter and category list over plain honor arrays.

import { describe, expect, it } from 'vitest' // test API
import type { Honor } from '@/shared/data/types.ts' // the honor shape
import { categoryNames, filterHonors } from './filter.ts' // code under test

/**
 * Builds an honor with defaults.
 * @param name display name
 * @param category category name
 * @param enabled whether the honor is switched on
 * @return a complete honor
 */
function honor(name: string, category = 'Nature', enabled = true): Honor {
  return {
    id: name.toLowerCase().replace(/\W+/g, '-'),
    name,
    category,
    skillLevel: 1,
    issuedBy: 'General Conference',
    enabled,
    price: 4,
    image: null,
  } // fixed values for the fields the filter ignores
}

const all = { query: '', category: null } // no search, All categories

describe('filterHonors', () => {
  it('drops switched-off honors', () => {
    const list = [honor('Knot Tying'), honor('Hidden', 'Nature', false)]
    expect(filterHonors(list, all).map((h) => h.name)).toEqual(['Knot Tying']) // catches switched-off honors reaching buyers
  })

  it('matches case-insensitively', () => {
    expect(
      filterHonors([honor('Knot Tying')], { ...all, query: 'KNOT' }),
    ).toHaveLength(1) // catches a case-sensitive search
  })

  it('matches every word in any order', () => {
    const list = [honor('Braiding - Advanced'), honor('Braiding')]
    expect(
      filterHonors(list, { ...all, query: 'advanced braiding' }).map(
        (h) => h.name,
      ),
    ).toEqual(['Braiding - Advanced']) // catches whole-phrase matching
  })

  it('treats blank input as no search', () => {
    const list = [honor('A'), honor('B')]
    expect(filterHonors(list, { ...all, query: '  ' })).toHaveLength(2) // catches whitespace matching nothing
    expect(filterHonors(list, all)).toHaveLength(2) // catches an empty query matching nothing
  })

  it('matches punctuation literally', () => {
    const list = [
      honor('Christian Citizenship (Antigua & Barbuda)'),
      honor('Knot Tying'),
    ]
    expect(filterHonors(list, { ...all, query: '&' })).toHaveLength(1) // catches a regex build that chokes on symbols
  })

  it('returns nothing when no name matches', () => {
    expect(
      filterHonors([honor('Knot Tying')], { ...all, query: 'zzz' }),
    ).toEqual([]) // catches a loose match
  })

  it('filters by category alone', () => {
    const list = [honor('A', 'Nature'), honor('B', 'Outreach')]
    expect(
      filterHonors(list, { query: '', category: 'Outreach' }).map(
        (h) => h.name,
      ),
    ).toEqual(['B']) // catches an ignored category
  })

  it('combines category and query', () => {
    const list = [
      honor('Knot A', 'Nature'),
      honor('Knot B', 'Outreach'),
      honor('Other', 'Outreach'),
    ]
    expect(
      filterHonors(list, { query: 'knot', category: 'Outreach' }).map(
        (h) => h.name,
      ),
    ).toEqual(['Knot B']) // catches OR instead of AND
  })

  it('returns nothing for a category without a match', () => {
    expect(
      filterHonors([honor('Knot', 'Nature')], {
        query: 'knot',
        category: 'Outreach',
      }),
    ).toEqual([]) // catches a query that ignores the category
  })
})

describe('categoryNames', () => {
  it('lists each category of a switched-on honor once, A to Z', () => {
    const list = [
      honor('A', 'Recreation'),
      honor('B', 'Nature'),
      honor('C', 'Nature'),
    ]
    expect(categoryNames(list)).toEqual(['Nature', 'Recreation']) // catches duplicates or file order
  })

  it('leaves out a category with only switched-off honors', () => {
    const list = [honor('A', 'Nature'), honor('B', 'Outreach', false)]
    expect(categoryNames(list)).toEqual(['Nature']) // catches an option that leads to an empty list
  })
})
