// Tests for App: the count line and its loading, empty and error states, with fetch mocked at the boundary.

import { StrictMode } from 'react' // runs the load effect twice, leaving one stale attempt
import { act, fireEvent, render, screen } from '@testing-library/react' // render and query the page
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest' // test API and mocks
import { App } from './App.tsx' // code under test

/**
 * Builds honors for the fake file.
 * @param enabledCount how many honors are switched on
 * @param disabledCount how many honors are switched off
 * @return a list shaped like honors.json
 */
function honorsFile(enabledCount: number, disabledCount = 0) {
  return Array.from({ length: enabledCount + disabledCount }, (_, index) => ({
    id: `honor-${index}`,
    name: `Honor ${index}`,
    category: 'Test',
    skillLevel: null,
    issuedBy: 'General Conference',
    enabled: index < enabledCount,
    price: 4,
    image: null,
  })) // the first enabledCount honors are on
}

/**
 * Makes the global fetch answer with a list of honors.
 * @param honors the body of honors.json
 */
function serveHonors(honors: unknown) {
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => new Response(JSON.stringify(honors))),
  ) // 200 with the list
}

beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true }) // control the 300 ms loader delay, keep promises moving
})

afterEach(() => {
  vi.useRealTimers() // restore the clock
  vi.unstubAllGlobals() // restore fetch
})

describe('App', () => {
  it('shows the header and the count of switched-on honors', async () => {
    serveHonors(honorsFile(299, 123))
    render(<App />)
    expect(await screen.findByText('299 honors in the catalogue')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Pathfinder Honors' })).toBeInTheDocument()
  })

  it('uses the singular for one honor', async () => {
    serveHonors(honorsFile(1, 5))
    render(<App />)
    expect(await screen.findByText('1 honor in the catalogue')).toBeInTheDocument()
  })

  it('counts only switched-on honors', async () => {
    serveHonors(honorsFile(2, 3))
    render(<App />)
    expect(await screen.findByText('2 honors in the catalogue')).toBeInTheDocument()
  })

  it('says so when no honor is switched on', async () => {
    serveHonors(honorsFile(0, 4))
    render(<App />)
    expect(await screen.findByText('No honors are switched on yet. Check back soon.')).toBeInTheDocument()
  })

  it('shows nothing for 300 ms, then the skeleton', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => new Promise(() => {})),
    ) // a request that never answers
    render(<App />)
    expect(screen.queryByTestId('count-skeleton')).not.toBeInTheDocument()
    act(() => {
      vi.advanceTimersByTime(299)
    })
    expect(screen.queryByTestId('count-skeleton')).not.toBeInTheDocument()
    act(() => {
      vi.advanceTimersByTime(1)
    })
    expect(screen.getByTestId('count-skeleton')).toBeInTheDocument()
  })

  it('shows the error and Try again, and Try again loads the count', async () => {
    const fetchFn = vi
      .fn()
      .mockRejectedValueOnce(new TypeError('Failed to fetch')) // first request fails
      .mockResolvedValue(new Response(JSON.stringify(honorsFile(299)))) // retry succeeds
    vi.stubGlobal('fetch', fetchFn)
    render(<App />)
    expect(
      await screen.findByText("We couldn't load the honors. Check your connection and try again."),
    ).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Try again' })) // press the button
    expect(await screen.findByText('299 honors in the catalogue')).toBeInTheDocument()
    expect(fetchFn).toHaveBeenCalledTimes(2)
  })

  it('waits the loader delay again after Try again', async () => {
    let failFirstRequest: (reason: Error) => void = () => {} // rejects the first request on demand
    const fetchFn = vi
      .fn()
      .mockReturnValueOnce(new Promise((_, reject) => (failFirstRequest = reject))) // slow first request
      .mockReturnValue(new Promise(() => {})) // the retry never answers
    vi.stubGlobal('fetch', fetchFn)
    render(<App />)
    act(() => {
      vi.advanceTimersByTime(300) // the skeleton shows
    })
    expect(screen.getByTestId('count-skeleton')).toBeInTheDocument()
    await act(async () => failFirstRequest(new TypeError('Failed to fetch'))) // the first request fails late
    fireEvent.click(await screen.findByRole('button', { name: 'Try again' })) // press the button
    expect(screen.queryByTestId('count-skeleton')).not.toBeInTheDocument()
    act(() => {
      vi.advanceTimersByTime(299)
    })
    expect(screen.queryByTestId('count-skeleton')).not.toBeInTheDocument()
    act(() => {
      vi.advanceTimersByTime(1)
    })
    expect(screen.getByTestId('count-skeleton')).toBeInTheDocument()
  })

  it('ignores a late answer from an older attempt', async () => {
    let answerFirstRequest: (response: Response) => void = () => {} // answers the older attempt on demand
    const fetchFn = vi
      .fn()
      .mockReturnValueOnce(new Promise((resolve) => (answerFirstRequest = resolve))) // older attempt, slow
      .mockResolvedValue(new Response(JSON.stringify(honorsFile(5)))) // newer attempt, fast
    vi.stubGlobal('fetch', fetchFn)
    render(
      <StrictMode>
        <App />
      </StrictMode>,
    ) // StrictMode runs the effect twice: the first attempt is stale
    expect(await screen.findByText('5 honors in the catalogue')).toBeInTheDocument()
    await act(async () => answerFirstRequest(new Response(JSON.stringify(honorsFile(2))))) // the stale answer arrives last
    expect(screen.getByText('5 honors in the catalogue')).toBeInTheDocument()
    expect(fetchFn).toHaveBeenCalledTimes(2)
  })
})
