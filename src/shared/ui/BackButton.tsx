// The solid < button in the header of inner screens: one way back, drawn once so cart, details page and confirmation share it and the 44 px target.

/**
 * Draws the back button as a link, so it keeps a real address and works with the app's own back rule.
 * @param href the address of the screen it leads to
 * @param onBack called on a plain click; the link's own navigation is cancelled
 * @return a 44 px stone circle with a chevron, named Back
 */
export function BackButton({ href, onBack }: { href: string; onBack: () => void }) {
  return (
    <a
      href={href} // a real address for the link; the click is handed to the app
      aria-label="Back" // the chevron has no text
      onClick={(event) => {
        event.preventDefault() // the app decides between history back and going to the address
        onBack() // back or there
      }}
      className="bg-on-header text-header focus-visible:outline-focus-ring rounded-pill flex size-11 shrink-0 items-center justify-center transition-transform duration-(--duration-press) focus-visible:outline-2 focus-visible:outline-offset-2 active:scale-[0.97]" // solid stone circle on the band, press feedback and focus ring
    >
      <svg
        viewBox="0 0 24 24" // a 24 unit canvas
        fill="none" // outline only
        stroke="currentColor" // the circle's text colour
        strokeWidth="2.5" // line weight
        strokeLinecap="round" // round ends
        strokeLinejoin="round" // round corner
        aria-hidden="true" // decorative: the link's label names it
        className="size-5" // 20 px glyph in the 44 px target
      >
        <path d="M15 5l-7 7 7 7" /> {/* the chevron */}
      </svg>
    </a>
  )
}
