// Reads honors.json at run time, so the honors stay out of the JS bundle and every screen shares one loader.

import type { Honor, Settings } from './types.ts' // the shapes of one honor and of the settings

/**
 * Fetches the honors file that sits next to the built site.
 * @param fetchFn the fetch to use; tests pass a fake
 * @return every honor in the file, switched on or off
 * @throws Error when the request fails, the status is not 2xx, the body is not JSON or it is not a list
 */
export async function loadHonors(
  fetchFn: typeof fetch = fetch,
): Promise<Honor[]> {
  const response = await fetchFn(`${import.meta.env.BASE_URL}data/honors.json`) // GET the file under the base path
  if (!response.ok)
    throw new Error(`Could not load honors: HTTP ${response.status}`) // 404, 500 and so on
  let body: unknown // the parsed file
  try {
    body = await response.json() // parse the JSON
  } catch {
    throw new Error('Could not load honors: the file is not valid JSON') // a half-written file or an HTML error page
  }
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
  const response = await fetchFn(
    `${import.meta.env.BASE_URL}data/settings.json`,
  ) // GET the file under the base path
  if (!response.ok)
    throw new Error(`Could not load settings: HTTP ${response.status}`) // 404, 500 and so on
  let body: unknown // the parsed file
  try {
    body = await response.json() // parse the JSON
  } catch {
    throw new Error('Could not load settings: the file is not valid JSON') // a half-written file or an HTML error page
  }
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
