// The header's theme control: a 44 px icon button, a sun while the page is light and a moon while it is dark, that flips between light and dark so a buyer can pick how the site looks.

import { useTheme } from './use-theme.ts' // the pick, its setter and what it resolves to

/**
 * Draws the theme control.
 * @return a button named for the current theme and the one it switches to
 */
export function ThemeControl() {
  const { choice, setChoice, resolved } = useTheme() // the shared pick and the light or dark it shows
  const next = resolved === 'dark' ? 'light' : 'dark' // what a tap picks
  const name =
    choice === 'system'
      ? `Theme: following your device, now ${resolved}. Switch to ${next}` // still on the device's setting
      : `Theme: ${resolved}. Switch to ${next}` // a saved pick
  return (
    <button
      type="button" // not a form submit
      aria-label={name} // the icon has no text
      onClick={() => setChoice(next)} // saves the pick; nothing sets System again
      className="border-on-header/40 text-on-header focus-visible:outline-focus-ring rounded-pill flex size-11 items-center justify-center border bg-transparent transition-transform duration-(--duration-press) focus-visible:outline-2 focus-visible:outline-offset-2 active:scale-[0.97] print:hidden" // 44 px outlined circle on the band, press feedback and focus ring
    >
      <svg
        aria-hidden="true" // decorative: the button's label names it
        data-icon={resolved === 'dark' ? 'moon' : 'sun'} // which glyph shows
        viewBox="0 0 24 24" // a 24 unit canvas
        className="size-5" // 20 px glyph
        fill="none" // outline only
        stroke="currentColor" // the band's stone
        strokeWidth="2" // line weight
        strokeLinecap="round" // round ends
        strokeLinejoin="round" // round corners
      >
        {resolved === 'dark' ? (
          <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" /> // the moon
        ) : (
          <>
            <circle cx="12" cy="12" r="4" /> {/* the sun's disc */}
            <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />{' '}
            {/* its rays */}
          </>
        )}
      </svg>
    </button>
  )
}
