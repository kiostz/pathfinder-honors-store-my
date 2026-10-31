// The emblem trace: a decorative outline of the club emblem behind Home's welcome band. A white-hot point rides it once, each piece it passes glows and cools to rose with a soft bloom, then the faint outline stays still. The outline is a static SVG (also the geometry); two canvases draw the heat and the bloom for under 5 s.

import { useLayoutEffect, useRef, useState } from 'react' // decide before paint, draw after mount, stop on unmount
import { RIDE_SHARE, sparkStreaks, type SparkPoint } from './spark-streaks.ts' // which spark streaks exist at a time
import { headLook, heatLook, PIECE_STEP, tracePieces, type Rgb, type TracePiece } from './trace-heat.ts' // pieces, heat and head looks

const EMBLEM_PATH =
  'M2 2H164V36L83 161L2 36Z M10 9H156V33H10Z M29 40Q56 50 83 40Q110 50 137 40Q121 100 83 120Q45 100 29 40Z M49 89L145 51 M57 73L68 95 M44 86Q47 92 50 94' // outer triangle, banner box, inner shield, blade, crossguard and pommel; no letters; the one copy, read by the outline and by the canvas

const BOX_CLASSES = 'pointer-events-none relative -mt-14 ml-auto block h-42.5 w-43.5 sm:absolute sm:top-1/2 sm:right-0 sm:mt-0 sm:-translate-y-1/2 print:hidden' // the one box: about 174 x 170 px, under the text on a phone, centred on the right from 640 px, never on paper
const MARGIN = 16 // px the canvases reach beyond the box on every side (classes -top-4, -left-4 and 2rem more height and width): more than the halo's 13 and the rays' 11, so the glow is never cut flat
const COVERED_AFTER = 1.5 // seconds after which a piece's warmth is under 1 % and it joins the one resting stroke
const HALO_SIZE = 26 // the head's halo across, in px
const DISC_SIZE = 12 // the head's rose disc across, in px
const CORE_SIZE = 5 // the head's white core across, in px
const RAY_WIDTH = 1.2 // a ray's width in px
const RAY_START = 3 // where a ray starts from the core, in px
const VIEW = { width: 178, height: 174 } // the SVG's viewBox (-2 -2 178 174)
const GROUP_SCALE = 1.05 // the SVG group's scale

/**
 * Reads a time token such as "4800ms" or "4.8s".
 * @param value the custom property's text
 * @return seconds, or null when the text is not a time
 */
function seconds(value: string): number | null {
  const match = /^\s*([\d.]+)(ms|s)\s*$/.exec(value) // number and unit
  if (!match) return null // not a time
  return match[2] === 'ms' ? Number(match[1]) / 1000 : Number(match[1]) // to seconds
}

/**
 * Reads a #rrggbb colour token.
 * @param value the custom property's text
 * @return red, green and blue from 0 to 255, or null when the text is not a hex colour
 */
function rgb(value: string): Rgb | null {
  const match = /^\s*#([0-9a-f]{6})\s*$/i.exec(value) // six hex digits
  if (!match) return null // not a hex colour
  const n = parseInt(match[1], 16) // the number
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255] // split into channels
}

/**
 * Draws the emblem trace: the static outline, the heat canvas and the bloom canvas. The bloom rule and the Reduce Motion rules live in index.css.
 * @return the outline SVG and two hidden canvases in the same box; the outline alone under Reduce Motion, with no canvas, or after the play
 */
export function EmblemTrace() {
  const svgRef = useRef<SVGSVGElement>(null) // the outline, also the geometry
  const canvasRef = useRef<HTMLCanvasElement>(null) // the heat canvas, at the device pixel ratio
  const bloomRef = useRef<HTMLCanvasElement>(null) // the bloom canvas, at half that
  const [playing, setPlaying] = useState(false) // true while the canvases draw and the outline is hidden

  useLayoutEffect(() => {
    const canvas = canvasRef.current // the heat canvas
    const bloom = bloomRef.current // the bloom canvas
    const path = svgRef.current?.querySelector('path') as SVGGeometryElement | null // the outline's one path, so it is written once
    if (!canvas || !bloom || !path || typeof path.getPointAtLength !== 'function') return // old browser or jsdom: the still outline, no error
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return // Reduce Motion: the loop never starts
    const root = getComputedStyle(document.documentElement) // the tokens
    const duration = seconds(root.getPropertyValue('--duration-trace')) // the whole play
    const rose = rgb(root.getPropertyValue('--color-trace')) // the glow and the resting outline
    const bright = rgb(root.getPropertyValue('--color-trace-bright')) // the head's bright parts and the spark's birth colour
    const core = rgb(root.getPropertyValue('--color-trace-core')) // the white-hot colour
    const width = canvas.clientWidth // css px, margin included
    const height = canvas.clientHeight // css px, margin included
    if (!duration || !rose || !bright || !core || !(width > 0) || !(height > 0)) return // tokens or box not readable: the still outline
    const context = canvas.getContext('2d') // asked for only now; null with no 2D canvas
    const bloomContext = bloom.getContext('2d') // the bloom's
    if (!context || !bloomContext) return // no canvas context: the still outline, no error
    const ratio = window.devicePixelRatio || 1 // device pixels per css px
    canvas.width = Math.round(width * ratio) // sharp on dense screens
    canvas.height = Math.round(height * ratio) // sharp on dense screens
    bloom.width = Math.max(1, Math.round((width * ratio) / 2)) // half the resolution: it is blurred anyway
    bloom.height = Math.max(1, Math.round((height * ratio) / 2)) // half
    const fit = Math.min((width - 2 * MARGIN) / VIEW.width, (height - 2 * MARGIN) / VIEW.height) // the viewBox fitted into the box, without the margin
    const left = MARGIN + (width - 2 * MARGIN - VIEW.width * fit) / 2 // the margin, then the letterbox as the SVG centres it
    const top = MARGIN + (height - 2 * MARGIN - VIEW.height * fit) / 2 // same
    const rideEnd = duration * RIDE_SHARE // the point stops here
    const total = path.getTotalLength() // the path's length
    const pieces = tracePieces((length) => path.getPointAtLength(length), total, rideEnd, PIECE_STEP) // read once; cut into short pieces
    /**
     * Moves a point from path units to canvas px.
     * @param point the point in path units
     * @return the point in canvas px
     */
    const toCanvas = (point: SparkPoint): SparkPoint => ({
      x: left + (point.x * GROUP_SCALE + 2) * fit, // the group's scale and the viewBox offset
      y: top + (point.y * GROUP_SCALE + 2) * fit, // same
    })
    const birthPoints = new Map<number, SparkPoint | null>() // birth time to point: a spark is born once, so its path is read once
    /**
     * Where the point was, in canvas px: along the path, linear over the ride.
     * @param time seconds since the start
     * @return the position, or null after the ride
     */
    const headAt = (time: number): SparkPoint | null => {
      if (time > rideEnd) return null // the ride is over
      const known = birthPoints.get(time) // read before?
      if (known !== undefined) return known // yes: no second walk along the path
      const mapped = toCanvas(path.getPointAtLength((time / rideEnd) * total)) // on the path
      birthPoints.set(time, mapped) // remember it
      return mapped // the position
    }
    const pieceTime = (rideEnd * PIECE_STEP) / total // seconds the point takes over one piece
    /**
     * Where the point is now, in canvas px, from the piece it is crossing, so no frame reads the path.
     * @param time seconds since the start
     * @return the position, or null once it has passed the last piece
     */
    const headNow = (time: number): SparkPoint | null => {
      const piece = pieces[reached] // the piece being crossed
      if (!piece) return null // the ride is over
      const share = Math.min(1, Math.max(0, 1 - (piece.passTime - time) / pieceTime)) // how far along it
      return toCanvas({ x: piece.x0 + (piece.x1 - piece.x0) * share, y: piece.y0 + (piece.y1 - piece.y0) * share }) // on the piece
    }
    const pathMatrix = [ratio * fit * GROUP_SCALE, 0, 0, ratio * fit * GROUP_SCALE, ratio * (left + 2 * fit), ratio * (top + 2 * fit)] as const // path units to device px
    const cssMatrix = [ratio, 0, 0, ratio, 0, 0] as const // css px to device px
    /**
     * Writes a colour the canvas understands.
     * @param value red, green and blue from 0 to 255
     * @param alpha opacity from 0 to 1
     * @return the colour string
     */
    const colour = (value: Rgb, alpha: number) => `rgb(${value[0]} ${value[1]} ${value[2]} / ${alpha})` // a canvas colour string
    /**
     * Tells whether two pieces are one line, with no pen lift between them.
     * @param before the earlier piece
     * @param after the next piece
     * @return true when the first ends where the second starts
     */
    const joined = (before: TracePiece, after: TracePiece) => before.x1 === after.x0 && before.y1 === after.y0 // the same point
    let start: number | null = null // the first frame's time: the clock starts there
    let frame = 0 // the pending frame
    let reached = 0 // pieces the point has passed
    let covered = 0 // pieces old enough to be drawn as the resting stroke
    setPlaying(true) // the outline hides before the first paint, so the whole of it never flashes before the build

    /**
     * Ends the play: clears both canvases and hands over to the outline.
     * @return nothing
     */
    const finish = () => {
      context.setTransform(...cssMatrix) // css px
      context.clearRect(0, 0, width, height) // nothing left on the band
      bloomContext.setTransform(...cssMatrix) // same, in the bloom's own px
      bloomContext.clearRect(0, 0, bloom.width, bloom.height) // nothing left
      setPlaying(false) // the outline shows
    }

    /**
     * Draws one frame, or ends the play at the full time.
     * @param now the browser's frame time in ms
     * @return nothing
     */
    const draw = (now: number) => {
      start ??= now // the first frame starts the clock
      const time = (now - start) / 1000 // seconds in
      if (time >= duration) {
        finish() // done: clear and hand over
        return // no further frame
      }
      while (reached < pieces.length && pieces[reached].passTime <= time) reached += 1 // the point has passed these
      while (covered < reached && pieces[covered].passTime < time - COVERED_AFTER) covered += 1 // these are cool
      context.setTransform(...cssMatrix) // css px
      context.clearRect(0, 0, width, height) // wipe the last frame
      context.setTransform(...pathMatrix) // path units: widths scale as the SVG's do
      context.globalCompositeOperation = 'source-over' // the covered ground is plain
      context.lineJoin = 'round' // as the SVG
      context.strokeStyle = colour(rose, 0.55) // the resting outline's colour and opacity
      context.fillStyle = colour(rose, 0.55) // the same, for the one round start
      context.lineWidth = 2 // the resting outline's width
      let openStart = covered // where the run that meets the warm pieces begins (none: nothing is open)
      if (covered > 0 && covered < pieces.length && joined(pieces[covered - 1], pieces[covered])) {
        openStart = covered - 1 // the last cool piece continues into a warm one
        while (openStart > 0 && joined(pieces[openStart - 1], pieces[openStart])) openStart -= 1 // back to where that run began
      }
      context.lineCap = 'round' // true ends of finished runs are round, as the SVG
      context.beginPath() // one path for all the finished runs, so joints never double into beads
      for (let i = 0; i < openStart; i += 1) {
        const piece = pieces[i] // this piece
        if (i === 0 || !joined(pieces[i - 1], piece)) context.moveTo(piece.x0, piece.y0) // a pen lift starts a new subpath
        context.lineTo(piece.x1, piece.y1) // along the piece
      }
      context.stroke() // draw the finished runs
      if (openStart < covered) {
        const first = pieces[openStart] // where the open run begins
        const turn = Math.atan2(first.y1 - first.y0, first.x1 - first.x0) // the direction it starts in
        context.lineCap = 'butt' // the open end stops square at the first warm piece, so the two never overlap
        context.beginPath() // the open run
        context.moveTo(first.x0, first.y0) // its start
        for (let i = openStart; i < covered; i += 1) context.lineTo(pieces[i].x1, pieces[i].y1) // along it
        context.stroke() // draw the open run
        context.beginPath() // its round start: a half disc behind the first piece
        context.arc(first.x0, first.y0, 1, turn + Math.PI / 2, turn + (3 * Math.PI) / 2) // radius 1 is half the 2 wide line
        context.fill() // draw it
      }
      context.globalCompositeOperation = 'lighter' // warm pieces and the head add light
      context.lineCap = 'butt' // pieces meet without bulging
      for (let i = covered; i < reached; i += 1) {
        const piece = pieces[i] // this piece
        const look = heatLook(time - piece.passTime, rose, rose, core) // its colour, opacity and width now
        context.strokeStyle = colour(look.rgb, look.alpha) // its colour
        context.lineWidth = look.width // its width
        context.beginPath() // one piece
        context.moveTo(piece.x0, piece.y0) // start
        context.lineTo(piece.x1, piece.y1) // end
        context.stroke() // draw it
      }
      context.setTransform(...cssMatrix) // css px for the head and the sparks
      const head = headNow(time) // the point, until the ride ends
      if (head) {
        const look = headLook(time) // its flicker and rays
        context.fillStyle = colour(rose, 0.35 * look.flicker) // the halo
        context.beginPath() // the halo
        context.arc(head.x, head.y, HALO_SIZE / 2, 0, Math.PI * 2) // a circle
        context.fill() // draw it
        context.fillStyle = colour(rose, 0.8 * look.flicker) // the rose disc
        context.beginPath() // the disc
        context.arc(head.x, head.y, DISC_SIZE / 2, 0, Math.PI * 2) // a circle
        context.fill() // draw it
        context.fillStyle = colour(core, look.flicker) // the white core
        context.beginPath() // the core
        context.arc(head.x, head.y, CORE_SIZE / 2, 0, Math.PI * 2) // a circle
        context.fill() // draw it
        context.strokeStyle = colour(bright, look.flicker) // the rays
        context.lineWidth = RAY_WIDTH // their width
        context.lineCap = 'round' // soft ends
        for (const ray of look.rays) {
          context.beginPath() // one ray
          context.moveTo(head.x + Math.cos(ray.angle) * RAY_START, head.y + Math.sin(ray.angle) * RAY_START) // near the core
          context.lineTo(head.x + Math.cos(ray.angle) * ray.length, head.y + Math.sin(ray.angle) * ray.length) // out
          context.stroke() // draw it
        }
      }
      context.lineCap = 'round' // soft spark ends
      for (const streak of sparkStreaks(time, headAt, { birthsUntil: rideEnd })) {
        /**
         * One channel of the streak's colour.
         * @param i 0 red, 1 green, 2 blue
         * @return the channel, from bright to rose as the streak cools
         */
        const channel = (i: number) => Math.round(bright[i] + (rose[i] - bright[i]) * streak.cool) // bright to rose
        context.strokeStyle = colour([channel(0), channel(1), channel(2)], streak.alpha) // this streak's colour
        context.lineWidth = streak.width // this streak's width
        context.beginPath() // one segment
        context.moveTo(streak.x0, streak.y0) // tail
        context.lineTo(streak.x1, streak.y1) // head
        context.stroke() // draw it
      }
      bloomContext.setTransform(1, 0, 0, 1, 0, 0) // the bloom's own px
      bloomContext.clearRect(0, 0, bloom.width, bloom.height) // wipe the last bloom
      bloomContext.drawImage(canvas, 0, 0, bloom.width, bloom.height) // the same frame at half size; CSS blurs and adds it
      frame = requestAnimationFrame(draw) // next frame
    }
    frame = requestAnimationFrame(draw) // first frame
    return () => {
      cancelAnimationFrame(frame) // leaving Home stops it
      setPlaying(false) // a restart (a second mount) decides again
    }
  }, [])

  return (
    <div
      data-testid="emblem-trace"
      aria-hidden="true" // decoration only
      className={BOX_CLASSES} // the 174 x 170 box; the canvases reach out of it by the margin without changing it
    >
      <svg
        ref={svgRef} // read for the path
        data-testid="emblem-outline"
        viewBox="-2 -2 178 174" // the drawing plus its stroke
        className={`block h-full w-full ${playing ? 'opacity-0' : ''}`} // fills the box; hidden while the canvases play
      >
        {/* Round line ends and corners; 1.05 times the drawn size. */}
        <g fill="none" strokeLinecap="round" strokeLinejoin="round" transform="scale(1.05)">
          <path
            className="stroke-trace" // the rose
            d={EMBLEM_PATH} // the one path
            pathLength="1000" // so every length is in the same units
            strokeOpacity={0.55} // the resting outline: clear but thin
            strokeWidth={2} // 2 px
          />
        </g>
      </svg>
      <canvas
        ref={canvasRef} // the heat, drawn by the effect
        data-testid="emblem-canvas"
        aria-hidden="true" // decoration only
        className="emblem-canvas pointer-events-none absolute -top-4 -left-4 h-[calc(100%+2rem)] w-[calc(100%+2rem)] print:hidden" // 16 px beyond the box on every side; a canvas does not stretch between insets, so its size is stated
      />
      <canvas
        ref={bloomRef} // the half-size copy, blurred by CSS
        data-testid="emblem-bloom"
        aria-hidden="true" // decoration only
        className="emblem-bloom pointer-events-none absolute -top-4 -left-4 h-[calc(100%+2rem)] w-[calc(100%+2rem)] print:hidden" // over the heat canvas, adding light
      />
    </div>
  )
}
