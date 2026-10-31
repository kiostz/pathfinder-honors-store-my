// Tests for the pure heat functions behind the emblem trace: where the pieces of line are, how hot a piece looks at an age, what the head looks like at a time, and how a colour token is read.

import { describe, expect, it } from 'vitest' // test API
import { headLook, heatLook, PIECE_STEP, tracePieces } from './trace-heat.ts' // code under test
import { rgb } from './trace-heat.ts' // the colour reader under test

/**
 * A fake path of two straight subpaths, 400 long each, with a jump between them (a pen lift).
 * @param length distance along the path
 * @return the point there
 */
const twoLines = (length: number) => (length < 400 ? { x: length, y: 0 } : { x: length - 400, y: 100 })

/**
 * A fake path of two straight subpaths, the first 401 long and the second 400, with the jump at 401, which is not a multiple of the step.
 * @param length distance along the path
 * @return the point there
 */
const offStep = (length: number) => (length < 401 ? { x: length, y: 0 } : { x: length - 401, y: 100 })

const OUTLINE: [number, number, number] = [232, 180, 188] // the resting rose
const ROSE: [number, number, number] = [232, 180, 188] // the glow rose
const WHITE: [number, number, number] = [255, 255, 255] // white-hot

describe('tracePieces', () => {
  it('gives pass times that rise from the start to the ride time', () => {
    // catches: pieces lit out of order, or a ride that ends early or late
    const pieces = tracePieces(twoLines, 800, 4, 2)
    expect(pieces.length).toBeGreaterThan(300)
    for (let i = 1; i < pieces.length; i += 1) expect(pieces[i].passTime).toBeGreaterThanOrEqual(pieces[i - 1].passTime)
    expect(pieces[0].passTime).toBeGreaterThanOrEqual(0)
    expect(pieces[0].passTime).toBeLessThan(0.05)
    expect(pieces[pieces.length - 1].passTime).toBeCloseTo(4, 5)
  })

  it('never makes a piece longer than 2 steps, so no line is drawn across a pen lift', () => {
    // catches: a stroke joining the end of one subpath to the start of the next
    const pieces = tracePieces(twoLines, 800, 4, 2)
    for (const piece of pieces) expect(Math.hypot(piece.x1 - piece.x0, piece.y1 - piece.y0)).toBeLessThanOrEqual(4)
    expect(pieces.some((piece) => piece.y0 !== piece.y1)).toBe(false) // nothing slants between the two lines
  })

  it('puts both ends of every piece on the path', () => {
    // catches: pieces drifting off the outline
    for (const piece of tracePieces(twoLines, 800, 4, 2)) {
      for (const [x, y] of [
        [piece.x0, piece.y0],
        [piece.x1, piece.y1],
      ]) {
        expect(y === 0 || y === 100).toBe(true)
        expect(x).toBeGreaterThanOrEqual(0)
        expect(x).toBeLessThanOrEqual(400)
      }
    }
  })

  it('reads each point of the path once', () => {
    // catches: a path walk per piece end, doubling the readings
    const reads: number[] = []
    tracePieces(
      (length) => {
        reads.push(length)
        return twoLines(length)
      },
      800,
      4,
      2,
    )
    expect(reads.length).toBeLessThanOrEqual(402 + 18) // one reading per sample, plus 16 halvings and the two ends for the one jump
  })

  it('draws each subpath to its true length when the pen lift falls between two samples', () => {
    // catches: the sample pair that straddles a jump being dropped whole, leaving a notch of up to 2 units at each side of every pen lift
    const pieces = tracePieces(offStep, 801, 4, 2)
    const drawn = (y: number) =>
      pieces.filter((piece) => piece.y0 === y).reduce((sum, piece) => sum + Math.hypot(piece.x1 - piece.x0, piece.y1 - piece.y0), 0) // length drawn on that line
    expect(Math.abs(drawn(0) - 401)).toBeLessThan(0.1)
    expect(Math.abs(drawn(100) - 400)).toBeLessThan(0.1)
    expect(pieces.some((piece) => piece.y0 !== piece.y1)).toBe(false) // still nothing slants across the jump
  })

  it('cuts pieces of PIECE_STEP by default', () => {
    // catches: the piece length written in two files, so the head's speed over a piece drifts from the pieces' own
    expect(PIECE_STEP).toBe(2)
    const pieces = tracePieces(twoLines, 800, 4)
    expect(pieces[0].x1 - pieces[0].x0).toBe(PIECE_STEP)
  })
})

describe('heatLook', () => {
  it('is white-hot, opaque and 3.2 wide at age 0', () => {
    // catches: a point that never reaches white, or one without the extra width
    const look = heatLook(0, OUTLINE, ROSE, WHITE)
    expect(look.rgb).toEqual([255, 255, 255])
    expect(look.width).toBeCloseTo(3.2, 5)
    expect(look.alpha).toBe(1)
  })

  it('is rose ahead of white at 0.2 s', () => {
    // catches: the white-hot term not dying faster than the rose glow
    const look = heatLook(0.2, OUTLINE, ROSE, WHITE)
    expect(look.rgb[0] - look.rgb[1]).toBeGreaterThan(10) // red clearly above green: pink, not white
    expect(look.rgb[1]).toBeLessThan(250) // not yet white
    expect(look.alpha).toBeGreaterThan(0.8)
    expect(look.width).toBeGreaterThanOrEqual(2)
    expect(look.width).toBeLessThan(2.05)
  })

  it('settles to the resting outline by 2 s: its colour, 2 wide, 0.55', () => {
    // catches: a resting line that never settles, or one that differs from the SVG's
    for (const age of [2, 3, 10]) {
      const look = heatLook(age, OUTLINE, ROSE, WHITE)
      look.rgb.forEach((channel, i) => expect(Math.abs(channel - OUTLINE[i])).toBeLessThanOrEqual(1))
      expect(look.width).toBeCloseTo(2, 2)
      expect(look.alpha).toBeCloseTo(0.55, 2)
    }
  })

  it('clamps every channel to 0..255', () => {
    // catches: an overflowing channel wrapping to dark in the canvas colour string
    for (const age of [0, 0.01, 0.1, 0.5]) {
      for (const channel of heatLook(age, OUTLINE, ROSE, WHITE).rgb) {
        expect(channel).toBeGreaterThanOrEqual(0)
        expect(channel).toBeLessThanOrEqual(255)
      }
    }
  })
})

describe('headLook', () => {
  it('gives the same rays and flicker for the same time', () => {
    // catches: a random look that differs between calls, so a frame cannot be repeated
    expect(headLook(1.234)).toEqual(headLook(1.234))
  })

  it('keeps the flicker between 0.7 and 1 and always has 4 rays', () => {
    // catches: a head that goes dark or an uneven number of rays
    for (let t = 0; t < 5; t += 0.017) {
      const look = headLook(t)
      expect(look.flicker).toBeGreaterThanOrEqual(0.7)
      expect(look.flicker).toBeLessThanOrEqual(1)
      expect(look.rays).toHaveLength(4)
    }
  })

  it('changes about 30 times a second', () => {
    // catches: a look that never changes (no flicker) or one that changes every frame at 240 Hz
    const looks = new Set<string>()
    for (let i = 0; i < 100; i += 1) looks.add(JSON.stringify(headLook(i / 100))) // one second at 100 samples
    expect(looks.size).toBeGreaterThanOrEqual(25)
    expect(looks.size).toBeLessThanOrEqual(35)
  })
})

describe('rgb', () => {
  it('reads the six-digit hex the CSS source writes', () => {
    // catches: the dev server's unshortened tokens no longer read
    expect(rgb('#e8b4bc')).toEqual([232, 180, 188])
    expect(rgb(' #FFFFFF ')).toEqual([255, 255, 255])
  })

  it('reads the three-digit hex the production build shortens #ffffff to', () => {
    // catches: the deployed site's trace never playing because the minified "#fff" token reads as no colour
    expect(rgb('#fff')).toEqual([255, 255, 255])
    expect(rgb('#e8b')).toEqual([238, 136, 187])
  })

  it('gives null for text that is not a hex colour', () => {
    // catches: a broken token drawn as black instead of falling back to the still outline
    const notHex = ['', 'white', '#ffff', '#gggggg', 'rgb(1 2 3)'] // a name, wrong lengths, bad digits, a function
    for (const value of notHex) expect(rgb(value)).toBeNull()
  })
})
