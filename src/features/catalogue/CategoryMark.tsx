// The category mark: a square in the category's patch colour with its icon, shown where an honor has no picture, so every row has the same 56 px lead.

import { categoryMark } from './category-mark.ts' // colours and icon of a category
import { CategoryIcon } from './CategoryIcon.tsx' // draws the icon

/**
 * Draws the mark of one category.
 * @param category exact category name; an unknown one gets the default mark
 * @return a 56 px square with a hairline border and a 28 px icon
 */
export function CategoryMark({ category }: { category: string }) {
  const { icon, background, foreground } = categoryMark(category) // hex colours from the one map
  return (
    // Inline style because the colours are data, the same in light and dark mode; the border token changes with the mode.
    <div
      data-testid="category-mark"
      aria-hidden="true"
      style={{ backgroundColor: background, color: foreground }}
      className="border-category-mark-border flex size-14 shrink-0 items-center justify-center rounded-md border"
    >
      <CategoryIcon name={icon} className="size-7" />
    </div>
  )
}
