// Test setup run before every test file: jest-dom matchers and RTL cleanup between tests.

// Adds matchers such as toBeInTheDocument to Vitest's expect.
import '@testing-library/jest-dom/vitest'
// Unmounts rendered components after each test.
import { cleanup } from '@testing-library/react'
// Vitest's per-test hook.
import { afterEach } from 'vitest'

// jsdom does not know the club select's selectedcontent element (Chrome and Safari do), so React would warn about an unknown tag; this makes jsdom treat it as a plain element.
if (typeof window !== 'undefined') {
  const createElement = document.createElement.bind(document) // the real factory
  /**
   * Makes an element like jsdom's createElement, except that selectedcontent reports itself as a plain HTMLElement.
   * @param tag the tag name
   * @param options the element options, passed on unchanged
   * @return the element
   */
  document.createElement = ((tag: string, options?: ElementCreationOptions) => {
    const element = createElement(tag, options) // the element jsdom makes
    if (tag === 'selectedcontent')
      Object.defineProperty(element, Symbol.toStringTag, {
        value: 'HTMLElement', // not "HTMLUnknownElement", which React warns about
      }) // only this tag, so no other warning is hidden
    return element // handed back to React
  }) as typeof document.createElement
}

// Remove anything a test rendered so tests do not leak into each other.
afterEach(() => {
  cleanup() // unmount
  if (typeof window !== 'undefined') window.localStorage.clear() // script tests run without a window; the cart is kept there, so one test's cart must not reach the next
})
