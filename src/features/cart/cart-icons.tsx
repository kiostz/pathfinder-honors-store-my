// The cart screen's small inline icons (trash, cart, info), drawn as SVG so no icon file or font is fetched.

/**
 * Draws a trash can.
 * @param className size and colour classes
 * @return a decorative 24 px icon in the current colour
 */
export function TrashIcon({ className = 'size-5' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24" // a 24 unit canvas
      fill="none" // outline only
      stroke="currentColor" // the text colour
      strokeWidth="2" // line weight
      strokeLinecap="round" // round ends
      strokeLinejoin="round" // round corners
      aria-hidden="true" // decorative
      className={className} // size and colour from the caller
    >
      <path d="M3 6h18" /> {/* the lid */}
      <path d="M8 6V4h8v2" /> {/* the handle */}
      <path d="M6 6l1 14h10l1-14" /> {/* the can */}
      <path d="M10 10v6M14 10v6" /> {/* the slats */}
    </svg>
  )
}

/**
 * Draws a shopping cart.
 * @param className size and colour classes
 * @return a decorative 24 px icon in the current colour
 */
export function CartIcon({ className = 'size-10' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24" // a 24 unit canvas
      fill="none" // outline only
      stroke="currentColor" // the text colour
      strokeWidth="1.75" // line weight
      strokeLinecap="round" // round ends
      strokeLinejoin="round" // round corners
      aria-hidden="true" // decorative
      className={className} // size and colour from the caller
    >
      <path d="M5 8h14l-1 12H6L5 8z" /> {/* the cart body */}
      <path d="M9 8V7a3 3 0 0 1 6 0v1" /> {/* the handle */}
    </svg>
  )
}

/**
 * Draws a circled i.
 * @param className size and colour classes
 * @return a decorative 24 px icon in the current colour
 */
export function InfoIcon({ className = 'size-5' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24" // a 24 unit canvas
      fill="none" // outline only
      stroke="currentColor" // the text colour
      strokeWidth="2" // line weight
      strokeLinecap="round" // round ends
      strokeLinejoin="round" // round corners
      aria-hidden="true" // decorative
      className={className} // size and colour from the caller
    >
      <circle cx="12" cy="12" r="9" /> {/* the ring */}
      <path d="M12 11v5M12 8h.01" /> {/* the i */}
    </svg>
  )
}
