// Tests for loadHonors: the run-time read of public/data/honors.json, with fetch mocked at the boundary.

import { describe, expect, it, vi } from 'vitest' // test API and mock helper
import { loadHonors, loadSettings } from './load.ts' // code under test

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
