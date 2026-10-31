// The pure heat functions behind the emblem trace: where the pieces of line are, how hot each looks at an age, and what the head looks like at a time, repeatable so the same input always gives the same picture.

/** Red, green and blue, each 0 to 255. */
export type Rgb = [number, number, number]

/** One short piece of the outline, from (x0, y0) to (x1, y1), and the second the point reached its end. */
export type TracePiece = {
  x0: number // start x in path units
  y0: number // start y in path units
  x1: number // end x in path units
  y1: number // end y in path units
  passTime: number // seconds since the start when the point passed this piece
}

export const PIECE_STEP = 2 // the length of one piece of line in path units, read by the pieces and by the head's glide over one
const JUMP_SEARCH_STEPS = 16 // halvings used to find a pen lift inside one step
const JUMP_SLACK = 0.02 // path units a measured arc may differ from its chord: browsers measure curves approximately
const JUMP_FACTOR = 1.5 // a chord this many steps long or more is a pen lift, not a curve
const HOT_TIME = 0.05 // seconds for the white-hot glow to fall to 1/e
const WARM_TIME = 0.32 // seconds for the rose glow to fall to 1/e
const ROSE_GAIN = 1.5 // how much brighter than the rose the warm glow burns
const WHITE_GAIN = 2.6 // how much the white-hot glow adds, so it clamps to white
const REST_ALPHA = 0.55 // the resting outline's opacity, as the SVG's
const REST_WIDTH = 2 // the resting outline's width, as the SVG's
const ALPHA_BOOST = 0.8 // the extra opacity a fully warm piece has
const HOT_WIDEN = 0.6 // how much wider a fully hot piece is
const HEAD_RATE = 30 // how many times a second the head's flicker and rays change
const FLICKER_MIN = 0.7 // the dimmest the head gets, as a share of full light
const RAY_COUNT = 4 // rays round the head
const RAY_MIN = 6.5 // shortest ray reach from the core in px
const RAY_SPAN = 4.5 // how much longer a ray may reach in px

/**
 * A repeatable pseudo-random number, so the same moment always looks the same.
 * @param n the moment's number
 * @param salt which quality of it (flicker, a ray's angle, a ray's length)
 * @return a number from 0 up to but not including 1
 */
function hash(n: number, salt: number): number {
  const scrambled = Math.sin(n * 91.7 + salt * 173.3) * 43758.5453 // a classic sine hash
  return scrambled - Math.floor(scrambled) // the fraction
}

/**
 * Finds where a pen lift falls inside one sample pair, by halving.
 * @param pointAt where the path is at a length along it
 * @param from the point at the pair's first length
 * @param first the pair's first length
 * @param second the pair's second length
 * @return the last length still on the first subpath and the first length on the next
 */
function findJump(
  pointAt: (length: number) => { x: number; y: number },
  from: { x: number; y: number },
  first: number,
  second: number,
): [number, number] {
  let low = first // known to be on the first subpath
  let high = second // known to be past the jump
  for (let i = 0; i < JUMP_SEARCH_STEPS; i += 1) {
    const middle = (low + high) / 2 // halve the span
    const at = pointAt(middle) // the path there
    if (Math.hypot(at.x - from.x, at.y - from.y) <= middle - first + JUMP_SLACK) low = middle // reachable along the line: still the same subpath
    else high = middle // too far for that: past the jump
  }
  return [low, high] // the two sides of the jump
}

/**
 * Cuts the outline into short pieces and stamps each with the time the point passes it.
 * @param pointAt where the path is at a length along it
 * @param totalLength the path's length
 * @param rideSeconds how long the point takes to ride the whole path
 * @param step the length of one piece in path units
 * @return the pieces in the order the point passes them; a sample pair that holds a pen lift is cut at the jump, so no piece crosses it and no stretch beside it is lost
 */
export function tracePieces(
  pointAt: (length: number) => { x: number; y: number },
  totalLength: number,
  rideSeconds: number,
  step = PIECE_STEP,
): TracePiece[] {
  const pieces: TracePiece[] = [] // result
  const count = Math.max(1, Math.ceil(totalLength / step)) // how many pieces the path holds
  const timeAt = (length: number) => (length / totalLength) * rideSeconds // the second the point is at a length
  let from = pointAt(0) // where the current piece starts: one reading per sample
  let fromLength = 0 // its length along the path
  for (let i = 1; i <= count; i += 1) {
    const length = Math.min(totalLength, i * step) // the end of this piece along the path
    const to = pointAt(length) // where it ends
    if (Math.hypot(to.x - from.x, to.y - from.y) <= step * JUMP_FACTOR) {
      pieces.push({ x0: from.x, y0: from.y, x1: to.x, y1: to.y, passTime: timeAt(length) }) // lit as the point arrives
    } else {
      // a chord over 1.5 steps is a pen lift: end one piece at the jump and start the next just after it
      const [lastOn, firstOff] = findJump(pointAt, from, fromLength, length) // the jump's two sides
      const before = pointAt(lastOn) // where the first subpath ends
      const after = pointAt(firstOff) // where the next begins
      if (lastOn > fromLength) pieces.push({ x0: from.x, y0: from.y, x1: before.x, y1: before.y, passTime: timeAt(lastOn) }) // the stretch before the jump
      if (length > firstOff) pieces.push({ x0: after.x, y0: after.y, x1: to.x, y1: to.y, passTime: timeAt(length) }) // the stretch after it
    }
    from = to // the next piece starts here
    fromLength = length // and its length
  }
  return pieces // the pieces
}

/**
 * How a piece of line looks a time after the point passed it: white-hot, then a rose glow, then the resting outline.
 * @param age seconds since the point passed
 * @param outline the resting outline's colour
 * @param rose the glow's colour
 * @param white the white-hot colour
 * @return the colour (each channel clamped to 0 to 255), opacity and width
 */
export function heatLook(age: number, outline: Rgb, rose: Rgb, white: Rgb): { rgb: Rgb; alpha: number; width: number } {
  const hot = Math.exp(-age / HOT_TIME) // 1 at the pass, fading fast
  const warm = Math.exp(-age / WARM_TIME) // 1 at the pass, fading slowly
  /**
   * One colour channel of the glow.
   * @param i 0 red, 1 green, 2 blue
   * @return the blended channel, clamped to 0 to 255
   */
  const channel = (i: number) =>
    Math.round(Math.min(255, Math.max(0, outline[i] * (1 - warm) + rose[i] * ROSE_GAIN * warm + white[i] * WHITE_GAIN * hot))) // blended and clamped
  return {
    rgb: [channel(0), channel(1), channel(2)], // the colour
    alpha: Math.min(1, REST_ALPHA + ALPHA_BOOST * warm), // opaque when hot, the outline's opacity at rest
    width: REST_WIDTH * (1 + HOT_WIDEN * hot), // thicker when hot
  }
}

/**
 * How the head looks at a time: its flicker and its rays, which change about 30 times a second.
 * @param t seconds since the start
 * @return the flicker from 0.7 to 1 and four rays, each with an angle in radians and a reach from the core in px
 */
export function headLook(t: number): { flicker: number; rays: { angle: number; length: number }[] } {
  const n = Math.floor(t * HEAD_RATE) // the look's number: it holds for 1/30 s
  const rays = Array.from({ length: RAY_COUNT }, (_, k) => ({
    angle: (k * Math.PI) / 2 + hash(n, 1) * Math.PI * 2, // a quarter turn apart, the set turning at random
    length: RAY_MIN + RAY_SPAN * hash(n, 2 + k), // each its own reach
  }))
  return { flicker: FLICKER_MIN + (1 - FLICKER_MIN) * hash(n, 0), rays } // the look
}
