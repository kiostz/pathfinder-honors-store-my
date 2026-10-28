// Search, chip filter and grouping for the catalogue, as plain functions so the screen only renders their result.

import type { Honor } from '@/shared/data/types.ts' // the shape of one honor

// What the buyer has typed and picked; a null category is the All chip.
export type CatalogueFilter = { query: string; category: string | null }

/**
 * Compares two strings A to Z for display order.
 * @param a first string
 * @param b second string
 * @return negative, zero or positive for sort()
 */
const byText = (a: string, b: string): number => a.localeCompare(b, 'en') // locale-aware A to Z

/**
 * Keeps the switched-on honors that match the search words and the chip.
 * @param honors every honor in the file
 * @param filter the typed query and the chosen category (null for All)
 * @return the matching switched-on honors in their input order
 */
export function filterHonors(
  honors: Honor[], // every honor in the file
  filter: CatalogueFilter, // the typed query and chosen chip
): Honor[] {
  const words = filter.query.toLowerCase().split(/\s+/).filter(Boolean) // blank input gives no words
  return honors.filter(
    (honor) =>
      honor.enabled && // switched-off honors stay hidden
      (filter.category === null || honor.category === filter.category) && // the chip
      words.every((word) => honor.name.toLowerCase().includes(word)), // every word somewhere in the name
  )
}

/**
 * Groups honors by category, both levels sorted A to Z.
 * @param honors the honors to group
 * @return one group per category that has an honor
 */
export function groupByCategory(
  honors: Honor[], // the honors to group
): { category: string; honors: Honor[] }[] {
  const groups = new Map<string, Honor[]>() // category to its honors
  for (const honor of honors) {
    const group = groups.get(honor.category) ?? [] // the honors seen so far in this category
    group.push(honor) // append in place, no copy
    groups.set(honor.category, group) // store it (a no-op write for an existing group)
  }
  return [...groups.entries()] // pairs of category and honors
    .sort(([a], [b]) => byText(a, b)) // categories A to Z
    .map(([category, list]) => ({
      category, // the group's name
      honors: [...list].sort((a, b) => byText(a.name, b.name)), // names A to Z
    }))
}

/**
 * Lists the categories for the chips.
 * @param honors every honor in the file
 * @return each category with a switched-on honor, once, A to Z
 */
export function categoryNames(honors: Honor[]): string[] {
  return [
    // the chip names
    ...new Set(honors.filter((h) => h.enabled).map((h) => h.category)),
  ].sort(byText) // dedupe, then A to Z
}
