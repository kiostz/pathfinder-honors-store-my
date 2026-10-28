// The catalogue screen: switched-on honors grouped by category with picture and price, plus its loading, error and empty states.

import { filterHonors, groupByCategory } from './filter.ts' // switched-on honors, grouped A to Z
import { HonorRow } from './HonorRow.tsx' // one list row
import { useCatalogueData } from './use-catalogue-data.ts' // the load

const SKELETON_ROWS = 6 // how many skeleton rows the loading state shows

/**
 * The buyer's list of honors.
 * @return the status line, the retry button after an error, and the grouped list
 */
export function Catalogue() {
  const { state, showSkeleton, retry } = useCatalogueData() // load state, skeleton gate and retry
  const switchedOn = state.status === 'ready' ? filterHonors(state.honors, { query: '', category: null }) : [] // what the buyer may see
  const groups = groupByCategory(switchedOn) // categories A to Z, names A to Z
  return (
    <>
      {/* Announced politely when loading gives way to the count, the empty message or the error. */}
      <div aria-live="polite" className="min-h-6">
        {/* Skeleton rows shaped like the final rows, shown only after the loader delay. */}
        {showSkeleton && (
          <div data-testid="catalogue-skeleton" aria-hidden="true">
            {Array.from({ length: SKELETON_ROWS }, (_, index) => (
              // A skeleton row has the same height as an honor row, so the list does not jump when it loads.
              <div key={index} className="border-border-subtle flex min-h-14 items-center gap-3 border-b py-2">
                {/* Stands where the picture will be. */}
                <div className="bg-border-subtle size-14 shrink-0 rounded-md" />
                {/* Stands where the name will be. */}
                <div className="bg-border-subtle h-4 flex-1 rounded-sm" />
              </div>
            ))}
          </div>
        )}
        {/* The count line, or the empty message when nothing is switched on. */}
        {state.status === 'ready' && (
          <p className="text-text-muted motion-safe:animate-fade-in">
            {switchedOn.length === 0
              ? 'No honors are switched on yet. Check back soon.'
              : `${switchedOn.length} ${switchedOn.length === 1 ? 'honor' : 'honors'}`}
          </p>
        )}
        {/* The error copy; the Try again button follows below. */}
        {state.status === 'error' && (
          <p className="text-danger">We couldn't load the honors. Check your connection and try again.</p>
        )}
      </div>
      {/* The only action on the screen, shown only after a failed load. */}
      {state.status === 'error' && (
        <button
          type="button"
          onClick={retry}
          className="bg-accent text-on-accent focus-visible:outline-focus-ring mt-4 min-h-11 rounded-md px-6 font-medium transition-transform duration-(--duration-press) focus-visible:outline-2 focus-visible:outline-offset-2 active:scale-[0.97]"
        >
          Try again
        </button>
      )}
      {state.status === 'ready' && (
        // The list fades in once as a whole; rows do not animate one by one.
        <div className="motion-safe:animate-fade-in">
          {/* One block per category, named by its category so screen readers can jump between them. */}
          {groups.map((group) => (
            <section key={group.category} aria-label={group.category} className="mt-6">
              {/* The category name, a level-2 heading under the page title. */}
              <h2 className="text-lg font-semibold">{group.category}</h2>
              {/* The honors of this category, already A to Z. */}
              <ul>
                {group.honors.map((honor) => (
                  <HonorRow key={honor.id} honor={honor} currency={state.settings.currency} />
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </>
  )
}
