// Tests for the theme control: a labelled select with the three choices that starts on the saved pick.

import { fireEvent, render, screen } from '@testing-library/react' // render and query
import { afterEach, describe, expect, it } from 'vitest' // test API
import { THEME_STORAGE_KEY } from './theme-storage.ts' // the stored pick's key
import { ThemeControl } from './ThemeControl.tsx' // code under test

afterEach(() => {
  document.documentElement.removeAttribute('data-theme') // the next test starts on System
})

describe('ThemeControl', () => {
  it('is labelled Theme and offers System, Light and Dark, starting on System', () => {
    // catches: an unlabelled control, a missing choice, or a wrong start
    render(<ThemeControl />)
    const select = screen.getByRole('combobox', { name: 'Theme' })
    expect(select).toHaveValue('system')
    expect(screen.getAllByRole('option').map((option) => option.textContent)).toEqual(['System', 'Light', 'Dark'])
  })

  it('starts on the saved pick', () => {
    // catches: a reload showing System while the page is dark
    window.localStorage.setItem(THEME_STORAGE_KEY, 'dark')
    render(<ThemeControl />)
    expect(screen.getByRole('combobox', { name: 'Theme' })).toHaveValue('dark')
  })

  it('applies the pick to the page', () => {
    // catches: a control that changes itself but not the page
    render(<ThemeControl />)
    fireEvent.change(screen.getByRole('combobox', { name: 'Theme' }), { target: { value: 'light' } })
    expect(document.documentElement.dataset.theme).toBe('light')
  })
})
