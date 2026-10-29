// Tests for the inline script in index.html: it must set the saved theme before the first paint, with the same key and attribute the app uses.

import { readFileSync } from 'node:fs' // reads index.html
import { resolve } from 'node:path' // the path to index.html
import { afterEach, describe, expect, it } from 'vitest' // test API
import { THEME_STORAGE_KEY } from './theme-storage.ts' // the key the app saves under

const html = readFileSync(resolve(process.cwd(), 'index.html'), 'utf8') // the page as shipped; vitest runs from the project root
const script = /<script>([\s\S]*?)<\/script>/.exec(html)?.[1] // the one classic inline script

afterEach(() => {
  document.documentElement.removeAttribute('data-theme') // each case starts clean
})

/**
 * Runs the inline script against a stubbed storage.
 * @param storage the stand-in for localStorage
 */
function runScript(storage: { getItem: (key: string) => string | null }) {
  if (script === undefined) throw new Error('index.html has no inline script') // the test's own precondition
  new Function('localStorage', script)(storage) // the script sees this storage and jsdom's document
}

describe('index.html', () => {
  it('names the page AY Store', () => {
    // catches: the old site name left in the tab title before React draws
    expect(/<title>([^<]*)<\/title>/.exec(html)?.[1]).toBe('AY Store')
  })
})

describe('index.html theme script', () => {
  it('sets the attribute for a stored dark pick', () => {
    // catches: the key or attribute name drifting from theme-storage.ts, which brings back the light flash
    runScript({ getItem: (key) => (key === THEME_STORAGE_KEY ? 'dark' : null) })
    expect(document.documentElement.dataset.theme).toBe('dark')
  })

  it.each(['system', 'blue', null])('sets no attribute for %j', (stored) => {
    // catches: an unknown stored value reaching the CSS
    runScript({ getItem: () => stored })
    expect(document.documentElement.dataset.theme).toBeUndefined()
  })

  it('sets no attribute and does not throw when storage throws', () => {
    // catches: blocked storage stopping the page before it paints
    expect(() =>
      runScript({
        getItem: () => {
          throw new Error('blocked')
        },
      }),
    ).not.toThrow()
    expect(document.documentElement.dataset.theme).toBeUndefined()
  })

  it('leaves no global behind', () => {
    // catches: a top-level var making window.theme, which later code could misread
    if (script === undefined) throw new Error('index.html has no inline script') // the test's own precondition
    window.localStorage.setItem(THEME_STORAGE_KEY, 'dark') // a stored pick for the script to read
    ;(0, eval)(script) // indirect eval runs at global scope, as a classic script does
    expect('theme' in globalThis).toBe(false)
    window.localStorage.removeItem(THEME_STORAGE_KEY) // leave storage clean
  })
})
