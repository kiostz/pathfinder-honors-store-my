// The category filter: a native select beside the search box that narrows the list to one category, styled by index.css where the browser supports it so the buyer gets the browser's own keyboard, screen-reader and phone behaviour.

const ALL_VALUE = '' // the value of the All categories option; an empty string cannot be a category name

/**
 * Draws the category filter.
 * @param categories the category names, A to Z
 * @param selected the chosen category, or null for All categories
 * @param onSelect called with the category chosen, or null for All categories
 * @return a visually hidden label and a select with All categories first
 */
export function CategoryFilter({
  categories,
  selected,
  onSelect,
}: {
  categories: string[] // the category names, A to Z
  selected: string | null // the chosen category, null for All categories
  onSelect: (category: string | null) => void // called when a different option is chosen
}) {
  return (
    // Holds the label and the select; the select keeps its natural width so the search box takes the rest.
    <div className="shrink-0">
      {/* The closed control shows the chosen text, so the label stays for screen readers. */}
      <label htmlFor="category-filter" className="sr-only">
        Category
      </label>
      {/* 16 px text stops iOS zooming in on focus; 44 px tall; index.css styles its popup list. */}
      <select
        id="category-filter" // the label points here
        value={selected ?? ALL_VALUE} // controlled by the screen
        onChange={(event) => {
          // a choice in the select
          const value = event.target.value // the option the buyer picked
          if (value === (selected ?? ALL_VALUE)) return // already chosen: nothing to report
          onSelect(value === ALL_VALUE ? null : value) // report the choice, All as null
        }}
        className="category-filter border-border-subtle bg-bg-surface text-text-default focus-visible:outline-focus-ring rounded-pill min-h-11 w-42 border px-4 text-base focus-visible:outline-2 focus-visible:outline-offset-2 sm:w-47" // same box as the search box; a fixed width so choosing a shorter category does not move the search box
      >
        {/* All categories comes first. */}
        <option value={ALL_VALUE}>All categories</option>
        {/* Then each category. */}
        {categories.map((category) => (
          <option key={category} value={category}>
            {category}
          </option>
        ))}
      </select>
    </div>
  )
}
