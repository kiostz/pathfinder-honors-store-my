// The tab pill's Home and Shop icons, drawn as SVG so no icon file or font is fetched; the Cart tab reuses the cart icon.

/**
 * Draws a house.
 * @param className size classes
 * @return a decorative 24 px icon in the current colour
 */
export function HomeIcon({ className = 'size-5.5' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24" // a 24 unit canvas
      fill="none" // outline only
      stroke="currentColor" // the text colour
      strokeWidth="2" // line weight
      strokeLinejoin="round" // round corners
      aria-hidden="true" // decorative: the label names the tab
      className={className} // size from the caller
    >
      <path d="M3 11l9-7 9 7v9h-6v-6H9v6H3z" /> {/* the roof and walls */}
    </svg>
  )
}

/**
 * Draws four tiles, the shop's grid.
 * @param className size classes
 * @return a decorative 24 px icon in the current colour
 */
export function ShopIcon({ className = 'size-5.5' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24" // a 24 unit canvas
      fill="none" // outline only
      stroke="currentColor" // the text colour
      strokeWidth="2" // line weight
      aria-hidden="true" // decorative: the label names the tab
      className={className} // size from the caller
    >
      <rect x="4" y="4" width="7" height="7" rx="1.5" /> {/* top left tile */}
      <rect x="13" y="4" width="7" height="7" rx="1.5" /> {/* top right tile */}
      <rect x="4" y="13" width="7" height="7" rx="1.5" /> {/* bottom left tile */}
      <rect x="13" y="13" width="7" height="7" rx="1.5" /> {/* bottom right tile */}
    </svg>
  )
}
