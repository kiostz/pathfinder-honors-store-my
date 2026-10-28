// Reads honors.json at run time, so the honors stay out of the JS bundle and every screen shares one loader.

import type { Honor } from './types.ts' // the shape of one honor

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
