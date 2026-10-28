// Loads the honors, the settings and the clubs as one load for the catalogue, with the loader delay, retry and stale-attempt guard, so every screen that lists honors shares one pattern.

import { useCallback, useEffect, useState } from 'react' // state and the load effect
import { loadClubs, loadHonors, loadSettings } from '@/shared/data/load.ts' // read the three data files
import type { ClubList, Honor, Settings } from '@/shared/data/types.ts' // the shapes of the three files

const LOADER_DELAY_MS = 300 // how long a load runs before the skeleton may show

// What the page knows about the load.
export type CatalogueData =
  | { status: 'loading' } // the request is running
  | { status: 'error' } // any file failed
  | { status: 'ready'; honors: Honor[]; settings: Settings; clubs: ClubList } // all three files arrived

// What useCatalogueData returns, passed to every screen that lists honors.
export type CatalogueLoad = ReturnType<typeof useCatalogueData>

/**
 * Loads honors, settings and clubs together; any failing is one error.
 * @return the load state, whether the skeleton may show, and retry to load again
 */
export function useCatalogueData(): {
  state: CatalogueData
  showSkeleton: boolean
  retry: () => void
} {
  const [state, setState] = useState<CatalogueData>({ status: 'loading' }) // loading, error or the data
  const [attempt, setAttempt] = useState(0) // bumped by retry to run the load again
  const [loaderDelayPassed, setLoaderDelayPassed] = useState(false) // true once the loader delay has passed

  // Load both files on mount and on every retry.
  useEffect(() => {
    let cancelled = false // ignore an answer that arrives after unmount or a newer attempt
    Promise.all([loadHonors(), loadSettings(), loadClubs()]) // all three files, one result
      .then(([honors, settings, clubs]) => {
        // all three files arrived
        if (!cancelled) setState({ status: 'ready', honors, settings, clubs }) // show the data unless this attempt is stale
      })
      .catch((error: unknown) => {
        // any file failed
        console.error('Could not load the catalogue data', error) // visible in the console, no buyer data involved
        if (!cancelled) setState({ status: 'error' }) // show the error unless this attempt is stale
      })
    return () => {
      // cleanup: runs on unmount and before the next attempt
      cancelled = true // stop this attempt from touching state
    }
  }, [attempt]) // run again on every retry

  // Start the skeleton only after the loader delay, so a fast load shows no flash.
  useEffect(() => {
    if (state.status !== 'loading') return // only a running load needs the delay
    const timer = setTimeout(() => setLoaderDelayPassed(true), LOADER_DELAY_MS) // wait the loader delay
    return () => clearTimeout(timer) // a load that ends first cancels the skeleton
  }, [state.status, attempt]) // restart the delay after a retry

  /** Runs the load again, from the error state. */
  const retry = useCallback(() => {
    setLoaderDelayPassed(false) // a retry also waits the loader delay before the skeleton
    setState({ status: 'loading' }) // leave the error state at once
    setAttempt((previous) => previous + 1) // trigger the load effect
  }, [])

  return {
    state, // loading, error or the data
    showSkeleton: state.status === 'loading' && loaderDelayPassed, // only while loading, after the delay
    retry, // for the Try again button
  }
}
