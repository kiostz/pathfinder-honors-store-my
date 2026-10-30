// The emblem trace: a decorative outline of the club emblem drawn once behind Home's welcome band, a faint line that builds while a rose point and a fading trail ride it, then the faint outline stays still.

import type { CSSProperties } from 'react' // the type of a style that carries a custom property

const EMBLEM_PATH =
  'M2 2H164V36L83 161L2 36Z M10 9H156V33H10Z M29 40Q56 50 83 40Q110 50 137 40Q121 100 83 120Q45 100 29 40Z M49 89L145 51 M57 73L68 95 M44 86Q47 92 50 94' // outer triangle, banner box, inner shield, blade, crossguard and pommel; no letters; the one copy, read by the lines and by the rider

/**
 * Draws the emblem trace; the keyframes and the Reduce Motion rules live in index.css.
 * @return a hidden SVG: in the flow under the band's text on a phone, behind it from 640 px
 */
export function EmblemTrace() {
  /**
   * Draws one copy of the path.
   * @param className the trace class that animates it
   * @param stroke the stroke colour class
   * @param opacity the stroke opacity
   * @param width the stroke width
   * @return a path of length 1000
   */
  const line = (className: string, stroke: string, opacity: number, width: number) => (
    <path
      className={`${className} ${stroke}`} // animation, then colour
      d={EMBLEM_PATH} // the one path
      pathLength="1000" // so every dash length is in the same units
      strokeOpacity={opacity} // faint to bright
      strokeWidth={width} // wide to thin
    />
  )
  return (
    <svg
      data-testid="emblem-trace"
      aria-hidden="true" // decoration only
      viewBox="-2 -2 178 174" // the drawing plus its stroke
      className="pointer-events-none relative -mt-14 ml-auto block h-42.5 w-43.5 sm:absolute sm:top-1/2 sm:right-0 sm:mt-0 sm:-translate-y-1/2 print:hidden" // about 174 x 170 px: on a phone it sits under the text, tucked beside Browse the shop; from 640 px behind the text on the right; never on paper
    >
      {/* Round line ends and corners; 1.05 times the drawn size. */}
      <g fill="none" strokeLinecap="round" strokeLinejoin="round" transform="scale(1.05)">
        {line('trace-build', 'stroke-trace', 0.55, 2)}{' '}
        {/* the built line, which stays as the resting outline: clear but thin */}
        {line('trace-tail3', 'stroke-trace', 0.22, 2.5)} {/* faint long tail */}
        {line('trace-tail2', 'stroke-trace-bright', 0.45, 2)} {/* softer middle */}
        {line('trace-tail1', 'stroke-trace-bright', 0.95, 1.6)} {/* bright head */}
        {/* The rider follows the same path through offset-path, set here so the path is written once. */}
        <g className="trace-rider" style={{ '--emblem-path': `path('${EMBLEM_PATH}')` } as CSSProperties}>
          <circle r="8" className="fill-trace" fillOpacity="0.28" /> {/* the glow */}
          <circle r="3" className="fill-trace-bright" /> {/* the point */}
        </g>
      </g>
    </svg>
  )
}
