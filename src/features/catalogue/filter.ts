// Search, category filter and A to Z sort for the catalogue, as plain functions so the screen only renders their result.

import type { Honor } from '@/shared/data/types.ts' // the shape of one honor

// What the buyer has typed and picked; a null category is All categories.
export type CatalogueFilter = { query: string; category: string | null }

/**
 * Compares two strings A to Z for display order.
 * @param a first string
 * @param b second string
 * @return negative, zero or positive for sort()
 */
const byText = (a: string, b: string): number => a.localeCompare(b, 'en') // locale-aware A to Z

/**
 * Keeps the switched-on honors that match the search words and the category.
 * @param honors every honor in the file
 * @param filter the typed query and the chosen category (null for All categories)
 * @return the matching switched-on honors in their input order
 */
export function filterHonors(
  honors: Honor[], // every honor in the file
  filter: CatalogueFilter, // the typed query and chosen category
): Honor[] {
  const words = filter.query.toLowerCase().split(/\s+/).filter(Boolean) // blank input gives no words
  return honors.filter(
    (honor) =>
      honor.enabled && // switched-off honors stay hidden
      (filter.category === null || honor.category === filter.category) && // the category
      words.every((word) => honor.name.toLowerCase().includes(word)), // every word somewhere in the name
  )
}

/**
 * Puts honors A to Z by name.
 * @param honors the honors to sort
 * @return a new array, names A to Z; the input is left as it was
 */
export function sortByName(
  honors: Honor[], // the honors to sort
): Honor[] {
  return [...honors].sort((a, b) => byText(a.name, b.name)) // copy first so the caller's array keeps its order
}

/**
 * Lists the categories for the category filter.
 * @param honors every honor in the file
 * @return each category with a switched-on honor, once, A to Z
 */
export function categoryNames(honors: Honor[]): string[] {
  return [
    // the option names
    ...new Set(honors.filter((h) => h.enabled).map((h) => h.category)),
  ].sort(byText) // dedupe, then A to Z
}
