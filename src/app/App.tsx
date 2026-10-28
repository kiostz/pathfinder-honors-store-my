// App shell: the site header and one line saying how many honors are in the catalogue, with its loading and error states.

import { useEffect, useState } from 'react' // state and the load effect
import { loadHonors } from '@/shared/data/load.ts' // reads honors.json

const LOADER_DELAY_MS = 300 // how long a load runs before the skeleton may show

// What the page knows about the load.
type LoadState = { status: 'loading' } | { status: 'error' } | { status: 'ready'; switchedOnCount: number }

/**
 * The whole page: header plus the catalogue count.
 * @return the app shell
 */
export function App() {
  const [loadState, setLoadState] = useState<LoadState>({ status: 'loading' }) // loading, error or the count
  const [attempt, setAttempt] = useState(0) // bumped by Try again to run the load again
  const [loaderDelayPassed, setLoaderDelayPassed] = useState(false) // true once the loader delay has passed

  // Load the honors on mount and on every retry.
  useEffect(() => {
    let cancelled = false // ignore an answer that arrives after unmount or a newer attempt
    loadHonors()
      .then((honors) => {
        if (!cancelled)
          setLoadState({ status: 'ready', switchedOnCount: honors.filter((honor) => honor.enabled).length })
      })
      .catch((error: unknown) => {
        console.error('Could not load the honors', error) // visible in the console, no buyer data involved
        if (!cancelled) setLoadState({ status: 'error' })
      })
    return () => {
      cancelled = true // stop this attempt from touching state
    }
  }, [attempt])

  // Start the skeleton only after the loader delay, so a fast load shows no flash.
  useEffect(() => {
    if (loadState.status !== 'loading') return
    const timer = setTimeout(() => setLoaderDelayPassed(true), LOADER_DELAY_MS) // wait the loader delay
    return () => clearTimeout(timer) // a load that ends first cancels the skeleton
  }, [loadState.status, attempt])

  /** Runs the load again from the error state. */
  function tryAgain() {
    setLoaderDelayPassed(false) // a retry also waits the loader delay before the skeleton
    setLoadState({ status: 'loading' }) // leave the error state at once
    setAttempt((previous) => previous + 1) // trigger the load effect
  }

  return (
    <div className="bg-bg-app text-text-default min-h-screen">
      {/* Site name; the only header content. */}
      <header className="border-border-subtle bg-bg-surface border-b">
        <h1 className="mx-auto max-w-3xl px-4 py-4 text-xl font-semibold">Pathfinder Honors</h1>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-8">
        {/* Announced politely when loading gives way to the count or the error. */}
        <div aria-live="polite" className="min-h-7 text-lg">
          {loadState.status === 'loading' && loaderDelayPassed && (
            <div
              data-testid="count-skeleton"
              aria-hidden="true"
              className="bg-border-subtle h-7 w-64 max-w-full rounded-sm"
            />
          )}
          {loadState.status === 'ready' && (
            <p className="motion-safe:animate-fade-in">
              {loadState.switchedOnCount === 0
                ? 'No honors are switched on yet. Check back soon.'
                : `${loadState.switchedOnCount} ${loadState.switchedOnCount === 1 ? 'honor' : 'honors'} in the catalogue`}
            </p>
          )}
          {loadState.status === 'error' && (
            <p className="text-danger">We couldn't load the honors. Check your connection and try again.</p>
          )}
        </div>
        {/* The only action on the page, shown only after a failed load. */}
        {loadState.status === 'error' && (
          <button
            type="button"
            onClick={tryAgain}
            className="bg-accent text-on-accent focus-visible:outline-focus-ring mt-4 min-h-11 rounded-md px-6 font-medium transition-transform duration-(--duration-press) focus-visible:outline-2 focus-visible:outline-offset-2 active:scale-[0.97]"
          >
            Try again
          </button>
        )}
      </main>
    </div>
  )
}
