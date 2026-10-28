// Test setup run before every test file: jest-dom matchers and RTL cleanup between tests.

// Adds matchers such as toBeInTheDocument to Vitest's expect.
import '@testing-library/jest-dom/vitest'
// Unmounts rendered components after each test.
import { cleanup } from '@testing-library/react'
// Vitest's per-test hook.
import { afterEach } from 'vitest'

// Remove anything a test rendered so tests do not leak into each other.
afterEach(() => {
  cleanup() // unmount
  if (typeof window !== 'undefined') window.localStorage.clear() // script tests run without a window; the cart is kept there, so one test's cart must not reach the next
})
