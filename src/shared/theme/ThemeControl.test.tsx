// Tests for the theme control: a 44 px button that shows a sun or a moon and flips light and dark, never back to System.

import { fireEvent, render, screen } from '@testing-library/react' // render and query
import { afterEach, describe, expect, it, vi } from 'vitest' // test API
import { THEME_STORAGE_KEY } from './theme-storage.ts' // the stored pick's key
import { ThemeControl } from './ThemeControl.tsx' // code under test

/**
 * Makes the device's colour scheme light or dark.
 * @param dark true for a dark device
 * @return the listeners the page registered, to simulate a device change
 */
function setDevice(dark: boolean) {
  const listeners = new Set<() => void>() // change listeners
  let matches = dark // the live answer
  vi.stubGlobal(
    'matchMedia',
    vi.fn(() => ({
      // a stand-in media query list
      get matches() {
        return matches // the live answer
      },
      addEventListener: (_type: string, listener: () => void) => listeners.add(listener), // the page starts listening
      removeEventListener: (_type: string, listener: () => void) => listeners.delete(listener), // and stops
    })),
  )
  return (nextDark: boolean) => {
    matches = nextDark // the device changed
    listeners.forEach((listener) => listener()) // tell the page
  }
}

afterEach(() => {
  document.documentElement.removeAttribute('data-theme') // the next test starts on System
  vi.unstubAllGlobals() // real matchMedia again
})

describe('ThemeControl', () => {
  it('is a button, not a select, naming the device light and offering dark', () => {
    // catches: the old three-option select surviving, or a wrong first name
    setDevice(false)
    render(<ThemeControl />)
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument()
    const button = screen.getByRole('button', { name: 'Theme: following your device, now light. Switch to dark' })
    expect(button).toHaveAttribute('type', 'button')
    expect(button.querySelector('[data-icon="sun"]')).not.toBeNull()
  })

  it('shows a moon and offers light when the device is dark', () => {
    // catches: the icon ignoring the device
    setDevice(true)
    render(<ThemeControl />)
    const button = screen.getByRole('button', { name: 'Theme: following your device, now dark. Switch to light' })
    expect(button.querySelector('[data-icon="moon"]')).not.toBeNull()
  })

  it('flips to Dark on a tap, saves it, and a second tap picks Light, never System', () => {
    // catches: the button cycling back to System, or a tap that is not saved
    setDevice(false)
    render(<ThemeControl />)
    fireEvent.click(screen.getByRole('button'))
    expect(document.documentElement.dataset.theme).toBe('dark')
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toContain('dark')
    const dark = screen.getByRole('button', { name: 'Theme: dark. Switch to light' })
    expect(dark.querySelector('[data-icon="moon"]')).not.toBeNull()
    fireEvent.click(dark)
    expect(document.documentElement.dataset.theme).toBe('light')
    expect(
      screen.getByRole('button', { name: 'Theme: light. Switch to dark' }).querySelector('[data-icon="sun"]'),
    ).not.toBeNull()
  })

  it.each([
    ['light', 'sun'],
    ['dark', 'moon'],
  ])('starts on a saved %s pick with the %s', (pick, icon) => {
    // catches: a reload showing the device's icon while the page is on the pick
    setDevice(pick === 'light') // the device disagrees with the pick
    window.localStorage.setItem(THEME_STORAGE_KEY, pick)
    render(<ThemeControl />)
    expect(screen.getByRole('button').querySelector(`[data-icon="${icon}"]`)).not.toBeNull()
  })

  it('stops following the device after a pick', () => {
    // catches: a pick that still follows the device
    const changeDevice = setDevice(false)
    render(<ThemeControl />)
    fireEvent.click(screen.getByRole('button')) // Dark
    changeDevice(false)
    expect(screen.getByRole('button', { name: 'Theme: dark. Switch to light' })).toBeInTheDocument()
  })
})
