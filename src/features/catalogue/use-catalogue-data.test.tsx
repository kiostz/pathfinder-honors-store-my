// Tests for useCatalogueData: the honors and settings load, loader delay, retry and stale-attempt guard, with fetch mocked at the boundary.

import { StrictMode } from 'react' // StrictMode runs the load effect twice, leaving one stale attempt
import { act, render, renderHook, screen, waitFor } from '@testing-library/react' // run the hook
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest' // test API and mocks
import { useCatalogueData } from './use-catalogue-data.ts' // code under test

const honorsBody = [
  {
    id: 'knot-tying',
    name: 'Knot Tying',
    category: 'Recreation',
    skillLevel: null,
    issuedBy: 'General Conference',
    enabled: true,
    price: 4,
    image: null,
  },
] // one honor in a fake honors.json
const settingsBody = { currency: 'MYR', defaultPrice: 4 } // a fake settings.json

/**
 * Makes the global fetch answer each data file separately.
 * @param honors response for honors.json
 * @param settings response for settings.json
 * @param clubs response for clubs.json, an empty club list by default
 * @return the fetch mock, to count calls
 */
function serve(
  honors: () => Promise<Response>,
  settings: () => Promise<Response>,
  clubs: () => Promise<Response> = async () => new Response('[]'),
) {
  const fetchFn = vi.fn((url: string) =>
    url.endsWith('clubs.json') ? clubs() : url.endsWith('settings.json') ? settings() : honors(),
  ) // route by file name
  vi.stubGlobal('fetch', fetchFn) // install it
  return fetchFn
}

/**
 * Builds a response function that answers 200 with a JSON body.
 * @param body the value to send as JSON
 * @return a function that returns the response
 */
const ok = (body: unknown) => async () => new Response(JSON.stringify(body)) // a 200 answer

beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true }) // control the 300 ms loader delay, keep promises moving
  vi.spyOn(console, 'error').mockImplementation(() => {}) // the hook logs a failed load; keep test output clean
})

afterEach(() => {
  vi.useRealTimers() // restore the clock
  vi.unstubAllGlobals() // restore fetch
  vi.restoreAllMocks() // restore console
})

describe('useCatalogueData', () => {
  it('becomes ready with honors and settings', async () => {
    // catches: settings dropped from the ready state, so prices have no currency
    serve(ok(honorsBody), ok(settingsBody))
    const { result } = renderHook(() => useCatalogueData())
    await waitFor(() => expect(result.current.state.status).toBe('ready'))
    expect(result.current.state).toEqual({ status: 'ready', honors: honorsBody, settings: settingsBody, clubs: [] })
  })

  it('is an error when honors fail', async () => {
    // catches: an honors outage showing an empty list instead of the error state
    serve(async () => new Response('', { status: 500 }), ok(settingsBody))
    const { result } = renderHook(() => useCatalogueData())
    await waitFor(() => expect(result.current.state.status).toBe('error'))
  })

  it('carries the clubs in the ready state', async () => {
    // catches: clubs.json fetched but dropped, so the order form never gets its dropdown
    const club = { name: 'Eagles', area: null, language: null, location: null, churchName: null }
    serve(ok(honorsBody), ok(settingsBody), ok([club]))
    const { result } = renderHook(() => useCatalogueData())
    await waitFor(() => expect(result.current.state.status).toBe('ready'))
    expect(result.current.state).toMatchObject({ clubs: [club] })
  })

  it('is the one error when clubs.json fails', async () => {
    // catches: a broken club list leaving a half-loaded catalogue instead of the error screen
    serve(ok(honorsBody), ok(settingsBody), async () => new Response('', { status: 500 }))
    const { result } = renderHook(() => useCatalogueData())
    await waitFor(() => expect(result.current.state.status).toBe('error'))
  })

  it('is an error when settings fail', async () => {
    // catches: a settings outage showing the list with prices that have no currency
    serve(ok(honorsBody), async () => new Response('', { status: 404 }))
    const { result } = renderHook(() => useCatalogueData())
    await waitFor(() => expect(result.current.state.status).toBe('error'))
  })

  it('shows the skeleton only from 300 ms', () => {
    // catches: a skeleton flash on fast loads, or one that never appears
    serve(
      () => new Promise(() => {}),
      () => new Promise(() => {}),
    ) // requests that never answer
    const { result } = renderHook(() => useCatalogueData())
    expect(result.current.showSkeleton).toBe(false)
    act(() => {
      vi.advanceTimersByTime(299)
    })
    expect(result.current.showSkeleton).toBe(false)
    act(() => {
      vi.advanceTimersByTime(1)
    })
    expect(result.current.showSkeleton).toBe(true)
  })

  it('waits the loader delay again after retry, then loads', async () => {
    // catches: retry flashing the skeleton at once, or not loading again
    let calls = 0 // counts honors requests
    serve(
      () => (++calls === 1 ? Promise.resolve(new Response('', { status: 500 })) : new Promise(() => {})), // first fails, retry hangs
      ok(settingsBody),
    )
    const { result } = renderHook(() => useCatalogueData())
    await waitFor(() => expect(result.current.state.status).toBe('error'))
    act(() => result.current.retry()) // press Try again
    expect(result.current.state.status).toBe('loading')
    expect(result.current.showSkeleton).toBe(false)
    act(() => {
      vi.advanceTimersByTime(299)
    })
    expect(result.current.showSkeleton).toBe(false)
    act(() => {
      vi.advanceTimersByTime(1)
    })
    expect(result.current.showSkeleton).toBe(true)
    expect(calls).toBe(2)
  })

  it('ignores a late answer from a stale attempt', async () => {
    // catches: an older request overwriting the newer answer
    let answerFirst: (response: Response) => void = () => {} // answers the older attempt on demand
    let calls = 0 // counts honors requests
    serve(
      () =>
        ++calls === 1
          ? new Promise<Response>((resolve) => (answerFirst = resolve)) // older attempt, slow
          : Promise.resolve(new Response(JSON.stringify(honorsBody))), // newer attempt, fast
      ok(settingsBody),
    )
    /**
     * Shows the hook's status and honor count, so a plain render inside StrictMode can read them.
     * @return a line of text
     */
    function Probe() {
      const { state } = useCatalogueData() // the hook under test
      return <p>{state.status === 'ready' ? `ready ${state.honors.length}` : state.status}</p> // status and count
    }
    render(
      <StrictMode>
        <Probe />
      </StrictMode>,
    ) // StrictMode runs the load effect twice: the first attempt is stale
    expect(await screen.findByText('ready 1')).toBeInTheDocument()
    expect(calls).toBe(2) // StrictMode really made a stale first attempt
    await act(async () => answerFirst(new Response(JSON.stringify([])))) // the stale answer arrives last
    expect(screen.getByText('ready 1')).toBeInTheDocument()
  })
})
