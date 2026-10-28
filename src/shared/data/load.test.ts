// Tests for loadHonors, loadSettings and loadClubs: the run-time read of the data files, with fetch mocked at the boundary.

import { describe, expect, it, vi } from 'vitest' // test API and mock helper
import { loadClubs, loadHonors, loadSettings } from './load.ts' // code under test

/**
 * Builds a fake fetch that answers every request with one response.
 * @param body the JSON body to answer with
 * @param status the HTTP status to answer with
 * @return a vi.fn standing in for fetch
 */
function fakeFetch(body: unknown, status = 200) {
  return vi.fn(async () => new Response(JSON.stringify(body), { status })) // one canned response
}

describe('loadHonors', () => {
  it('requests the honors file under the base path', async () => {
    const fetchFn = fakeFetch([])
    await loadHonors(fetchFn)
    expect(fetchFn).toHaveBeenCalledWith('/data/honors.json') // vitest's BASE_URL is "/"
  })

  it('returns the array in the file', async () => {
    const honors = [{ id: 'knot-tying', name: 'Knot Tying' }]
    expect(await loadHonors(fakeFetch(honors))).toEqual(honors)
  })

  it('throws on a 404', async () => {
    await expect(loadHonors(fakeFetch({}, 404))).rejects.toThrow('404')
  })

  it('throws when the body is not an array', async () => {
    await expect(loadHonors(fakeFetch({ honors: [] }))).rejects.toThrow(
      'not a list',
    )
  })

  it('throws on a network error', async () => {
    const fetchFn = vi.fn(async () => {
      throw new TypeError('Failed to fetch') // what fetch does offline
    })
    await expect(loadHonors(fetchFn)).rejects.toThrow('Failed to fetch')
  })

  it('throws a clear error when the body is not valid JSON', async () => {
    const fetchFn = vi.fn(async () => new Response('<html>oops</html>')) // e.g. an HTML error page with status 200
    await expect(loadHonors(fetchFn)).rejects.toThrow(
      'Could not load honors: the file is not valid JSON',
    )
  })
})

describe('loadSettings', () => {
  it('requests the settings file under the base path', async () => {
    const fetchFn = fakeFetch({ currency: 'MYR', defaultPrice: 4 })
    await loadSettings(fetchFn)
    expect(fetchFn).toHaveBeenCalledWith('/data/settings.json') // catches a wrong path or a missing base
  })

  it('returns the object in the file', async () => {
    const settings = { currency: 'MYR', defaultPrice: 4 }
    expect(await loadSettings(fakeFetch(settings))).toEqual(settings) // catches a loader that reshapes the file
  })

  it('throws on a 404', async () => {
    await expect(loadSettings(fakeFetch({}, 404))).rejects.toThrow('404') // catches a missing status check
  })

  it('throws on bad JSON', async () => {
    const fetchFn = vi.fn(async () => new Response('<html>oops</html>')) // an HTML error page with status 200
    await expect(loadSettings(fetchFn)).rejects.toThrow('not valid JSON') // catches a raw SyntaxError reaching the screen
  })

  it.each([
    ['an array', []],
    ['null', null],
    ['a missing currency', { defaultPrice: 4 }],
    ['a string defaultPrice', { currency: 'MYR', defaultPrice: '4' }],
  ])('throws on %s', async (_label, body) => {
    await expect(loadSettings(fakeFetch(body))).rejects.toThrow(
      'not valid settings',
    ) // catches a loader that trusts any JSON and fails later at formatPrice
  })
})

describe('loadClubs', () => {
  const eagles = {
    name: 'Eagles',
    area: null,
    language: null,
    location: null,
    churchName: null,
  } // a valid club
  const gilead = {
    name: 'Gilead',
    area: 'Klang',
    language: 'BM',
    location: 'Hall',
    churchName: 'Klang BM SDA Church',
  } // every field set

  it('requests the clubs file under the base path', async () => {
    // catches: a wrong path or a missing base
    const fetchFn = fakeFetch([])
    await loadClubs(fetchFn)
    expect(fetchFn).toHaveBeenCalledWith('/data/clubs.json')
  })

  it('returns the list in the file', async () => {
    // catches: fields dropped on the way through
    expect(await loadClubs(fakeFetch([eagles, gilead]))).toEqual([
      eagles,
      gilead,
    ])
  })

  it('accepts an empty list', async () => {
    // catches: an empty club file treated as broken, when only Club name should show
    expect(await loadClubs(fakeFetch([]))).toEqual([])
  })

  it('throws on a 404', async () => {
    // catches: a missing file passing as no clubs
    await expect(loadClubs(fakeFetch({}, 404))).rejects.toThrow(
      'Could not load clubs: HTTP 404',
    )
  })

  it('throws a clear error when the body is not valid JSON', async () => {
    // catches: an HTML error page read as data
    const fetchFn = vi.fn(async () => new Response('<html>oops</html>'))
    await expect(loadClubs(fetchFn)).rejects.toThrow(
      'Could not load clubs: the file is not valid JSON',
    )
  })

  it('throws when the body is an object, not a list', async () => {
    // catches: a wrong top-level shape accepted
    await expect(loadClubs(fakeFetch({ clubs: [] }))).rejects.toThrow(
      'Could not load clubs: the file is not a list',
    )
  })

  it.each([
    ['the old string shape', ['Eagles']],
    [
      'a missing key',
      [{ name: 'Eagles', area: null, language: null, location: null }],
    ],
    ['an empty name', [{ ...eagles, name: '' }]],
    ['an empty-string optional field', [{ ...eagles, area: '' }]],
    ['a number in an optional field', [{ ...eagles, language: 5 }]],
    ['a duplicate name', [eagles, eagles]],
    ['an extra key', [{ ...eagles, extra: 1 }]],
    ['a non-string name', [{ ...eagles, name: 5 }]],
  ])('throws on %s', async (_label, body) => {
    // catches: a bad club entry reaching the dropdown
    await expect(loadClubs(fakeFetch(body))).rejects.toThrow(
      'Could not load clubs: the file is not a valid club list',
    )
  })
})
