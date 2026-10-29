// Tests for the theme storage: the saved pick survives, and bad or blocked storage never breaks the page.

import { afterEach, describe, expect, it, vi } from 'vitest' // test API and mocks
import {
  readThemeChoice,
  saveThemeChoice,
  THEME_STORAGE_KEY,
  type ThemeChoice,
} from './theme-storage.ts' // code under test

afterEach(() => {
  vi.restoreAllMocks() // a storage spy must not leak into the next case
})

describe('theme storage', () => {
  it.each<ThemeChoice>(['system', 'light', 'dark'])(
    'round-trips %s',
    (choice) => {
      // catches: a choice saved under one spelling and read back as another
      window.localStorage.setItem(THEME_STORAGE_KEY, 'dark') // an old pick already saved, so System must really overwrite it (a pick that never saved would still read System)
      saveThemeChoice(choice) // the pick under test
      expect(readThemeChoice()).toBe(choice) // light and system fail if saving does nothing and the old pick stays
    },
  )

  it.each([[null], ['blue'], ['']])('reads %j as system', (stored) => {
    // catches: an unknown stored value leaking into the page as a theme
    if (stored !== null) window.localStorage.setItem(THEME_STORAGE_KEY, stored) // a bad value, or none at all
    expect(readThemeChoice()).toBe('system')
  })

  it('reads system when getItem throws', () => {
    // catches: blocked storage crashing the first render
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked')
    })
    expect(readThemeChoice()).toBe('system')
  })

  it('does not throw when setItem throws', () => {
    // catches: a full or blocked storage breaking the theme control
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked')
    })
    expect(() => saveThemeChoice('dark')).not.toThrow()
  })
})
