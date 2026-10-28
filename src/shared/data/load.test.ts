// Tests for loadHonors: the run-time read of public/data/honors.json, with fetch mocked at the boundary.

import { describe, expect, it, vi } from 'vitest' // test API and mock helper
import { loadHonors } from './load.ts' // code under test

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
