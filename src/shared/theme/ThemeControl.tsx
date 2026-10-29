// The header's theme control: a select with System, Light and Dark, an icon and the word at every width, so a buyer can pick how the site looks.

import { useTheme } from './use-theme.ts' // the pick and its setter
import type { ThemeChoice } from './theme-storage.ts' // the three picks

const CHOICES: { value: ThemeChoice; text: string }[] = [
  { value: 'system', text: 'System' }, // follows the device
  { value: 'light', text: 'Light' }, // always light
  { value: 'dark', text: 'Dark' }, // always dark
] // in the order the list shows them

/**
 * Draws the theme control.
 * @return the labelled select with its icon
 */
export function ThemeControl() {
  const { choice, setChoice } = useTheme() // the shared pick
  return (
    <div className="relative inline-flex items-center print:hidden">
      <label htmlFor="theme-control" className="sr-only">
        Theme
      </label>
      {/* A circle half filled, the usual light-and-dark sign; sits over the select's left padding and never takes a tap. */}
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        className="pointer-events-none absolute left-3 size-5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="12" r="9" />
        <path d="M12 3a9 9 0 0 1 0 18z" fill="currentColor" />
      </svg>
      {/* 16 px text stops iOS zooming in on focus; 44 px tall; index.css styles its popup list. */}
      <select
        id="theme-control" // the label points here
        value={choice} // the shared pick
        onChange={(event) => setChoice(event.target.value as ThemeChoice)} // the options are the three choices only
        className="theme-select border-on-header/40 text-on-header focus-visible:outline-focus-ring rounded-pill min-h-11 border bg-transparent pr-3 pl-10 text-base focus-visible:outline-2 focus-visible:outline-offset-2" // the pill outline reads on the navy band
      >
        {/* One option per choice. */}
        {CHOICES.map(({ value, text }) => (
          <option key={value} value={value}>
            {text}
          </option>
        ))}
      </select>
    </div>
  )
}
