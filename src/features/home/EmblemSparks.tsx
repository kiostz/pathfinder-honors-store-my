// The sparks thrown by the emblem trace's rider: a decorative canvas that draws them for the length of the ride, so the point seems to sputter like a lit fuse.

import { useEffect, useRef } from 'react' // draws after mount and stops on unmount
import { RIDE_SHARE, sparkStreaks, type SparkPoint } from './spark-streaks.ts' // which streaks exist at a time

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
function rgb(value: string): [number, number, number] | null {
  const match = /^\s*#([0-9a-f]{6})\s*$/i.exec(value) // six hex digits
  if (!match) return null // not a hex colour
  const n = parseInt(match[1], 16) // the number
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255] // split into channels
}

/**
 * Draws the rider's sparks over the emblem trace for the length of the trace, then clears itself and stops.
 * @return a hidden canvas laid in the same box as the trace SVG; nothing when there is no canvas context or no path reading
 */
export function EmblemSparks() {
  const canvasRef = useRef<HTMLCanvasElement>(null) // the canvas to draw on

  useEffect(() => {
    const canvas = canvasRef.current // the element
    const path = canvas?.parentElement?.querySelector('.trace-build') as SVGGeometryElement | null // the trace's own built line (not the button's chevron or the rays), so the path is written once
    if (!canvas || !path || typeof path.getPointAtLength !== 'function') return // old browser or jsdom: no sparks, no error
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return // Reduce Motion: the loop never starts
    const context = canvas.getContext('2d') // asked for only now; null with no 2D canvas
    if (!context) return // no canvas context: no sparks, no error
    const root = getComputedStyle(document.documentElement) // the tokens
    const duration = seconds(root.getPropertyValue('--duration-trace')) // the trace's time
    const bright = rgb(root.getPropertyValue('--color-trace-bright')) // spark colour when born
    const rose = rgb(root.getPropertyValue('--color-trace')) // spark colour when cooled
    if (!duration || !bright || !rose) return // tokens not readable: draw nothing
    const rideEnd = duration * RIDE_SHARE // the point stops here
    const total = path.getTotalLength() // the path's length
    const width = canvas.clientWidth // css px
    const height = canvas.clientHeight // css px
    const ratio = window.devicePixelRatio || 1 // device pixels per css px
    canvas.width = Math.round(width * ratio) // sharp on dense screens
    canvas.height = Math.round(height * ratio) // sharp on dense screens
    const fit = Math.min(width / 178, height / 174) // the SVG's viewBox (-2 -2 178 174) fitted into the box
    const left = (width - 178 * fit) / 2 // letterbox, as the SVG centres it
    const top = (height - 174 * fit) / 2 // letterbox
    const birthPoints = new Map<number, SparkPoint | null>() // birth time to point: a spark is born once, so its path is read once
    /**
     * Where the point was, in canvas px: along the path as the CSS ride moves, linear over the ride.
     * @param time seconds since the start
     * @return the position, or null after the ride
     */
    const headAt = (time: number): SparkPoint | null => {
      if (time > rideEnd) return null // the ride is over
      const known = birthPoints.get(time) // read before?
      if (known !== undefined) return known // yes: no second walk along the path
      const point = path.getPointAtLength((time / rideEnd) * total) // on the path
      const mapped = { x: left + (point.x * 1.05 + 2) * fit, y: top + (point.y * 1.05 + 2) * fit } // the group's 1.05 scale and the viewBox offset
      birthPoints.set(time, mapped) // remember it
      return mapped // the position
    }
    const rider = canvas.parentElement?.querySelector('.trace-rider') // the point whose CSS ride is the clock
    let start: number | null = null // the first frame's time, the clock where the browser cannot read the ride
    let frame = 0 // the pending frame
    /**
     * Draws one frame, or clears and stops once the trace is over.
     * @return nothing
     */
    const draw = (now: number) => {
      start ??= now // the first frame, which is also when the CSS animation starts drawing
      const ride = rider?.getAnimations?.().find((animation) => 'animationName' in animation) // the CSS ride itself, when readable
      const time = ride?.currentTime == null ? (now - start) / 1000 : Number(ride.currentTime) / 1000 // seconds in, on the ride's own clock
      context.setTransform(ratio, 0, 0, ratio, 0, 0) // css px
      context.clearRect(0, 0, width, height) // wipe the last frame
      if (time >= duration) return // the trace is over: clear and stop
      context.globalCompositeOperation = 'lighter' // sparks add light
      context.lineCap = 'round' // soft ends
      for (const streak of sparkStreaks(time, headAt, { birthsUntil: rideEnd })) {
        const channel = (i: number) => Math.round(bright[i] + (rose[i] - bright[i]) * streak.cool) // bright to rose
        context.strokeStyle = `rgb(${channel(0)} ${channel(1)} ${channel(2)} / ${streak.alpha})` // this streak's colour
        context.lineWidth = streak.width // this streak's width
        context.beginPath() // one segment
        context.moveTo(streak.x0, streak.y0) // tail
        context.lineTo(streak.x1, streak.y1) // head
        context.stroke() // draw it
      }
      frame = requestAnimationFrame(draw) // next frame
    }
    frame = requestAnimationFrame(draw) // first frame
    return () => cancelAnimationFrame(frame) // leaving Home stops it
  }, [])

  return (
    <canvas // one hidden canvas, in the SVG's box
      ref={canvasRef} // read by the effect that draws
      data-testid="emblem-sparks" // for the tests
      aria-hidden="true" // decoration only
      className="emblem-sparks pointer-events-none relative -mt-42.5 ml-auto block h-42.5 w-43.5 sm:absolute sm:top-1/2 sm:right-0 sm:mt-0 sm:-translate-y-1/2 print:hidden" // the SVG's own box: pulled back over it on a phone, centred on the right from 640 px
    />
  )
}
