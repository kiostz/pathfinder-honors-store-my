// Tests for useTheme: the pick, the attribute on <html>, and the resolved scheme that follows the system.

import { act, renderHook } from '@testing-library/react' // render a hook
import { afterEach, beforeEach, describe, expect, it } from 'vitest' // test API
import { THEME_STORAGE_KEY } from './theme-storage.ts' // the stored pick's key
import { useTheme } from './use-theme.ts' // code under test

const listeners = new Set<() => void>() // the media query's change listeners
let systemDark = false // what the stubbed system setting says

beforeEach(() => {
  systemDark = false // light system unless a test says otherwise
  listeners.clear() // no listener left by the last test
  // jsdom has no matchMedia; this one answers with the current setting and lets a test change it.
  window.matchMedia = ((query: string) => ({
    matches: systemDark, // the current setting
    media: query, // the asked query
    addEventListener: (_type: string, listener: () => void) => listeners.add(listener), // the setting changes
    removeEventListener: (_type: string, listener: () => void) => listeners.delete(listener), // stop listening
  })) as unknown as typeof window.matchMedia
})

afterEach(() => {
  document.documentElement.removeAttribute('data-theme') // the next test starts on System
})

/** Flips the stubbed system setting and tells every listener. */
function flipSystem() {
  systemDark = !systemDark // the new setting
  act(() => listeners.forEach((listener) => listener())) // the browser's change event
}

describe('useTheme', () => {
  it('sets the attribute and saves the pick for Dark', () => {
    // catches: a pick that shows once but is lost on reload, or never reaches the CSS
    const { result } = renderHook(() => useTheme())
    act(() => result.current.setChoice('dark'))
    expect(document.documentElement.dataset.theme).toBe('dark')
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark')
    expect(result.current.choice).toBe('dark')
  })

  it('removes the attribute for System', () => {
    // catches: System leaving the last pick's attribute on <html>
    const { result } = renderHook(() => useTheme())
    act(() => result.current.setChoice('dark'))
    act(() => result.current.setChoice('system'))
    expect(document.documentElement.dataset.theme).toBeUndefined()
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe('system')
  })

  it('resolves to dark with System while the system is dark, and flips with it', () => {
    // catches: resolved ignoring the system, or never hearing its change
    systemDark = true
    const { result } = renderHook(() => useTheme())
    expect(result.current.resolved).toBe('dark')
    flipSystem()
    expect(result.current.resolved).toBe('light')
  })

  it('keeps light with Light while the system turns dark', () => {
    // catches: a picked theme being overridden by the system
    const { result } = renderHook(() => useTheme())
    act(() => result.current.setChoice('light'))
    flipSystem()
    expect(result.current.resolved).toBe('light')
  })

  it('shares one pick between two users of the hook', () => {
    // catches: the control and the captcha each holding their own copy of the pick
    const first = renderHook(() => useTheme())
    const second = renderHook(() => useTheme())
    act(() => first.result.current.setChoice('dark'))
    expect(second.result.current.resolved).toBe('dark')
  })

  it('still switches for the page when storage throws', () => {
    // catches: blocked storage making the control do nothing
    const { result } = renderHook(() => useTheme())
    const original = Storage.prototype.setItem // restored below
    Storage.prototype.setItem = () => {
      throw new Error('blocked')
    }
    try {
      act(() => result.current.setChoice('dark'))
    } finally {
      Storage.prototype.setItem = original // never leak the throwing storage
    }
    expect(result.current.resolved).toBe('dark')
  })

  it('keeps System after Dark when saving fails but reading works', () => {
    // catches: a System pick reading back the old saved Dark, so the control and the page disagree
    window.localStorage.setItem(THEME_STORAGE_KEY, 'dark') // an earlier visit saved Dark
    document.documentElement.dataset.theme = 'dark' // the inline script mirrored it
    const { result } = renderHook(() => useTheme())
    const original = Storage.prototype.setItem // restored below
    Storage.prototype.setItem = () => {
      throw new Error('full')
    }
    try {
      act(() => result.current.setChoice('system'))
    } finally {
      Storage.prototype.setItem = original // never leak the throwing storage
      window.localStorage.removeItem(THEME_STORAGE_KEY) // leave storage clean
    }
    expect(result.current.choice).toBe('system')
    expect(result.current.resolved).toBe('light')
  })
})
