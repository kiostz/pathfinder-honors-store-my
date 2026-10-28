// Reads honors.json, settings.json and clubs.json at run time, so the data stays out of the JS bundle and every screen shares one fetch-and-check path.

import type { Club, ClubList, Honor, Settings } from './types.ts' // the shapes of one honor, the settings and the clubs

/**
 * Fetches one data file that sits next to the built site and parses it.
 * @param path the file's path under the base, such as "data/honors.json"
 * @param label the file's plain name for error messages, such as "honors"
 * @param fetchFn the fetch to use; tests pass a fake
 * @return the parsed JSON, not yet checked
 * @throws Error when the request fails, the status is not 2xx or the body is not JSON
 */
export async function fetchJson(
  path: string,
  label: string,
  fetchFn: typeof fetch = fetch,
): Promise<unknown> {
  const response = await fetchFn(`${import.meta.env.BASE_URL}${path}`) // GET the file under the base path
  if (!response.ok)
    throw new Error(`Could not load ${label}: HTTP ${response.status}`) // 404, 500 and so on
  try {
    return await response.json() // parse the JSON
  } catch {
    throw new Error(`Could not load ${label}: the file is not valid JSON`) // a half-written file or an HTML error page
  }
}

/**
 * Fetches the honors file that sits next to the built site.
 * @param fetchFn the fetch to use; tests pass a fake
 * @return every honor in the file, switched on or off
 * @throws Error when the request fails, the status is not 2xx, the body is not JSON or it is not a list
 */
export async function loadHonors(
  fetchFn: typeof fetch = fetch,
): Promise<Honor[]> {
  const body = await fetchJson('data/honors.json', 'honors', fetchFn) // the parsed file
  if (!Array.isArray(body))
    throw new Error('Could not load honors: the file is not a list') // wrong format
  return body as Honor[] // the seed and the admin write this shape
}

/**
 * Fetches the settings file that sits next to the built site.
 * @param fetchFn the fetch to use; tests pass a fake
 * @return the currency and default price
 * @throws Error when the request fails, the status is not 2xx, the body is not JSON or it lacks a string currency and a number defaultPrice
 */
export async function loadSettings(
  fetchFn: typeof fetch = fetch,
): Promise<Settings> {
  const body = await fetchJson('data/settings.json', 'settings', fetchFn) // the parsed file
  const fields = body as Partial<Settings> | null // looked at field by field below
  if (
    typeof fields !== 'object' || // not an object
    fields === null || // JSON null
    Array.isArray(fields) || // a list instead of an object
    typeof fields.currency !== 'string' || // missing currency code
    typeof fields.defaultPrice !== 'number' // missing default price
  )
    // any failed check means the file is wrong
    throw new Error('Could not load settings: the file is not valid settings') // wrong format
  return fields as Settings // checked above
}

const CLUB_KEYS = ['name', 'area', 'language', 'location', 'churchName'] // the five keys every club has

/**
 * Tells whether a value is a well-formed club: the five keys, a non-empty name, the other four a non-empty string or null.
 * @param entry one item of the parsed file
 * @return true when it is a club
 */
function isClub(entry: unknown): entry is Club {
  if (typeof entry !== 'object' || entry === null || Array.isArray(entry))
    return false // an old string entry, null or a list
  const keys = Object.keys(entry) // what the file has
  if (
    keys.length !== CLUB_KEYS.length || // an extra key
    !CLUB_KEYS.every((key) => keys.includes(key)) // a missing key
  )
    return false // a missing or extra key
  const club = entry as Record<string, unknown> // read key by key
  if (typeof club.name !== 'string' || club.name === '') return false // the name is required
  return CLUB_KEYS.slice(1).every(
    (key) =>
      club[key] === null || // no value
      (typeof club[key] === 'string' && club[key] !== ''), // or a non-empty string
  ) // "" must be null
}

/**
 * Fetches the clubs file that sits next to the built site.
 * @param fetchFn the fetch to use; tests pass a fake
 * @return the clubs in file order
 * @throws Error when the request fails, the body is not JSON or a list, or any club is malformed or repeats a name
 */
export async function loadClubs(
  fetchFn: typeof fetch = fetch,
): Promise<ClubList> {
  const body = await fetchJson('data/clubs.json', 'clubs', fetchFn) // the parsed file
  if (!Array.isArray(body))
    throw new Error('Could not load clubs: the file is not a list') // wrong format
  if (
    !body.every(isClub) ||
    new Set(body.map((club) => club.name)).size !== body.length
  )
    throw new Error('Could not load clubs: the file is not a valid club list') // a bad entry or a repeated name
  return body // checked above
}
