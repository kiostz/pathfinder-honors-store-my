// The honor id rule: turns a name into a stable slug, shared by the seed and club-added honors.

/**
 * Makes the id of an honor from its name: diacritics and apostrophes dropped, lowercase, every other
 * run of non-letters/digits becomes one dash, no leading or trailing dash.
 * @param name the honor's display name
 * @return the slug, e.g. "paper-mache"
 */
export function honorId(name: string): string {
  return name
    .normalize('NFKD') // split letters from their accents
    .replace(/\p{M}/gu, '') // drop the accents
    .toLowerCase() // lowercase
    .replace(/['’]/g, '') // apostrophes vanish, they do not split words
    .replace(/[^a-z0-9]+/g, '-') // any other run of symbols is one dash
    .replace(/^-+|-+$/g, '') // trim dashes at both ends
}
