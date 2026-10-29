// The catalogue screen: a sticky search and category toolbar over one A to Z grid of honor cards, plus its loading, error, empty and no-match states.

import { useRef, useState } from 'react' // the filter, and handles on the list and the search box
import { sortByName } from '@/shared/sort/sort-by-name.ts' // names A to Z
import { CategoryFilter } from './CategoryFilter.tsx' // the category filter
import { categoryNames, filterHonors } from './filter.ts' // search and category filter
import { PILL_BOX } from '@/shared/ui/button-box.ts' // the pill shape of the actions
import { LOAD_ERROR_TEXT } from '@/shared/ui/load-error-text.ts' // the failed-load message
import { HonorCard } from './HonorCard.tsx' // one card
import { CARD_BOX, CARD_GRID_BOX } from './honor-card-box.ts' // the grid and card boxes, shared with the skeleton
import { SearchBox } from './SearchBox.tsx' // the labelled search input
import type { CatalogueLoad } from './use-catalogue-data.ts' // the load, made by the app

const SKELETON_ROWS = 6 // how many skeleton cards the loading state shows
const TOOLBAR_BOX = 'border-border-subtle bg-bg-app -mx-4 -mt-6 flex items-start gap-2 border-b px-4 py-2' // the toolbar's box, shared with its skeleton so the list does not jump
const TOOLBAR_ROW = 'h-11' // the one 44 px row the skeleton stands in for
const COUNT_BOX = 'mt-3 min-h-6' // the count line's box, shared by the real line and its skeleton
const LIST_BOX = 'mt-3' // the grid's top, shared by the real list and the skeleton cards

/**
 * The buyer's list of honors.
 * @param data the load: state, skeleton gate and retry
 * @return the toolbar, the status line, the retry or Clear filters button, and the A to Z list
 */
export function Catalogue({ data }: { data: CatalogueLoad }) {
  const { state, showSkeleton, retry } = data // load state, skeleton gate and retry
  const [query, setQuery] = useState('') // what the buyer typed
  const [category, setCategory] = useState<string | null>(null) // the chosen category, null for All categories
  const searchRef = useRef<HTMLInputElement>(null) // the search box, focused by Clear filters
  const listRef = useRef<HTMLDivElement>(null) // the list, scrolled to its top on a category change
  const toolbarRef = useRef<HTMLDivElement>(null) // the sticky toolbar, measured so the list top can clear it
  const allHonors = state.status === 'ready' ? state.honors : [] // every honor in the file
  const switchedOn = filterHonors(allHonors, { query: '', category: null }) // what the buyer may see at all
  const matches = filterHonors(allHonors, { query, category }) // what the search and the category leave
  const sorted = sortByName(matches) // names A to Z
  const filtering = query.trim() !== '' || category !== null // whether any filter is active
  const countText = `${matches.length} ${matches.length === 1 ? 'honor' : 'honors'}${filtering ? (matches.length === 1 ? ' matches' : ' match') : ''}` // "299 honors", "12 honors match", "1 honor matches"

  /**
   * Chooses a category and returns the list to its top.
   * @param next the category chosen, or null for All categories
   */
  const selectCategory = (next: string | null) => {
    setCategory(next) // filter by the category
    const list = listRef.current // the list element, if it is on screen
    const toolbarHeight = toolbarRef.current?.getBoundingClientRect().height ?? 0 // measured, so any root font size works
    if (list && list.getBoundingClientRect().top < toolbarHeight) {
      // the list top is hidden under the toolbar
      list.style.scrollMarginTop = `${toolbarHeight}px` // stop the list top just below the toolbar
      list.scrollIntoView() // only when the top is hidden under the toolbar
    }
  }

  /** Empties the search, selects All categories and puts the cursor in the search box. */
  const clearFilters = () => {
    setQuery('') // empty the box
    setCategory(null) // All categories
    searchRef.current?.focus() // ready to type again
  }
  return (
    <>
      {/* Search and category stay at the top while the list scrolls; shown once there is something to filter. */}
      {state.status === 'ready' && switchedOn.length > 0 && (
        <div
          ref={toolbarRef} // measured on a category choice
          className={`${TOOLBAR_BOX} sticky top-0 z-10`} // pinned to the top, full width
        >
          {/* The search box takes the width the category filter leaves. */}
          <div className="min-w-0 flex-1">
            <SearchBox value={query} onChange={setQuery} ref={searchRef} /> {/* the typed query */}
          </div>
          <CategoryFilter
            categories={categoryNames(allHonors)} // All categories plus these
            selected={category} // the chosen category
            onSelect={selectCategory} // filter and scroll
          />
        </div>
      )}
      {/* On the error and empty states the toolbar's box stays as an empty band, so the message lands where the skeleton stood. */}
      {(state.status === 'error' || (state.status === 'ready' && switchedOn.length === 0)) && (
        <div data-testid="catalogue-toolbar-space" aria-hidden="true" className={TOOLBAR_BOX}>
          {/* The one 44 px row the toolbar would fill. */}
          <div className={`${TOOLBAR_ROW} w-full`} />
        </div>
      )}
      {/* Skeleton shaped like the final toolbar, count line and rows, shown only after the loader delay. */}
      {showSkeleton && (
        <div data-testid="catalogue-skeleton" aria-hidden="true">
          {/* Stands where the toolbar will be: the same box, one 44 px row. */}
          <div data-testid="catalogue-skeleton-toolbar" className={TOOLBAR_BOX}>
            {/* Stands where the search box and the category filter will be. */}
            <div className={`${TOOLBAR_ROW} w-full`} />
          </div>
          {/* Stands where the count line will be. */}
          <div data-testid="catalogue-skeleton-count" className={COUNT_BOX} />
          {/* The cards sit where the grid will be. */}
          <div data-testid="catalogue-skeleton-grid" className={`${LIST_BOX} ${CARD_GRID_BOX}`}>
            {Array.from({ length: SKELETON_ROWS }, (_, index) => (
              // A skeleton card has the same box as an honor card, so the grid does not jump when it loads.
              <div key={index} data-testid="catalogue-skeleton-row" className={CARD_BOX}>
                {/* Stands where the picture will be: 112 px. */}
                <div data-skeleton-part="picture" className="bg-border-subtle size-28 shrink-0 rounded-md" />
                {/* Stands where the name will be. */}
                <div data-skeleton-part="name" className="bg-border-subtle h-6 w-4/5 rounded-sm" />
                {/* Stands where the Category label will be. */}
                <div data-skeleton-part="label" className="bg-border-subtle h-4 w-20 rounded-sm" />
                {/* Stands where the price will be. */}
                <div data-skeleton-part="price" className="bg-border-subtle h-6 w-14 rounded-sm" />
                {/* Stands where Add will be: a 44 px pill. */}
                <div data-skeleton-part="button" className="bg-border-subtle rounded-pill h-11 w-full" />
              </div>
            ))}
          </div>
        </div>
      )}
      {/* Announced politely when loading gives way to the count, the empty message or the error. */}
      <div aria-live="polite">
        {/* The count line, the empty message when nothing is switched on, or the no-match message. */}
        {state.status === 'ready' && (
          <p className={`${COUNT_BOX} text-text-muted animate-fade-in`}>
            {/* The three messages share one line so the live region announces whichever applies. */}
            {switchedOn.length === 0
              ? 'No honors are switched on yet. Check back soon.'
              : matches.length === 0
                ? `No honors match "${query.trim()}"${category !== null ? ` in ${category}` : ''}.`
                : countText}
          </p>
        )}
        {/* The error copy; the Try again button follows below. */}
        {state.status === 'error' && <p className={`${COUNT_BOX} text-danger`}>{LOAD_ERROR_TEXT}</p>}
      </div>
      {/* The only action on the screen, shown only after a failed load. */}
      {state.status === 'error' && (
        <button
          type="button" // not a form submit
          onClick={retry} // run the load again
          className={`${PILL_BOX} bg-accent text-on-accent focus-visible:outline-focus-ring mt-4 transition-transform duration-(--duration-press) focus-visible:outline-2 focus-visible:outline-offset-2 active:scale-[0.97]`} // oxblood pill, press feedback, focus ring
        >
          Try again
        </button>
      )}
      {/* The one way back from no match. */}
      {state.status === 'ready' && switchedOn.length > 0 && matches.length === 0 && (
        <button
          type="button" // not a form submit
          onClick={clearFilters} // back to the full list
          className={`${PILL_BOX} bg-accent text-on-accent focus-visible:outline-focus-ring mt-4 transition-transform duration-(--duration-press) focus-visible:outline-2 focus-visible:outline-offset-2 active:scale-[0.97]`} // oxblood pill, press feedback, focus ring
        >
          Clear filters
        </button>
      )}
      {state.status === 'ready' && (
        // The grid fades in once as a whole; cards do not animate one by one.
        <div ref={listRef} className="animate-fade-in">
          {/* All switched-on honors at once, A to Z. */}
          <ul className={`${LIST_BOX} ${CARD_GRID_BOX}`}>
            {sorted.map((honor) => (
              // one card per honor
              <HonorCard key={honor.id} honor={honor} currency={state.settings.currency} /> // key by id; price in the settings currency
            ))}
          </ul>
        </div>
      )}
    </>
  )
}
