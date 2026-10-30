// Tests for the pure spark function behind the emblem trace: which streaks exist at a time, given where the point was.

import { describe, expect, it } from 'vitest' // test API
import { sparkStreaks } from './spark-streaks.ts' // code under test

const still = () => ({ x: 100, y: 50 }) // a head that never moves
const rideEnd = 4.08 // 85 % of the 4.8 s trace, in seconds

describe('sparkStreaks', () => {
  it('gives the same streaks for the same time', () => {
    // catches: a random number sneaking in, so a redraw at the same time would jump
    expect(sparkStreaks(2.5, still, { birthsUntil: rideEnd })).toEqual(
      sparkStreaks(2.5, still, { birthsUntil: rideEnd }),
    )
  })

  it('throws sparks while the point rides, each within its life of 0.25 to 0.45 s', () => {
    // catches: sparks that never die, or a rate that throws none
    const streaks = sparkStreaks(2.5, still, { birthsUntil: rideEnd })
    expect(streaks.length).toBeGreaterThan(5)
    for (const streak of streaks) {
      expect(streak.age).toBeLessThanOrEqual(streak.life)
      expect(streak.life).toBeGreaterThanOrEqual(0.25)
      expect(streak.life).toBeLessThanOrEqual(0.45)
      expect(streak.alpha).toBeGreaterThanOrEqual(0)
      expect(streak.alpha).toBeLessThanOrEqual(1)
    }
  })

  it('has no streak once the last spark born before the ride ended has died', () => {
    // catches: births continuing after the ride, so something still moves past 5 s
    expect(
      sparkStreaks(rideEnd + 0.46, still, { birthsUntil: rideEnd }),
    ).toEqual([])
    expect(sparkStreaks(5, still, { birthsUntil: rideEnd })).toEqual([])
  })

  it('has no streak where the head has no position', () => {
    // catches: sparks thrown from nowhere when the path cannot be read
    expect(sparkStreaks(2.5, () => null, { birthsUntil: rideEnd })).toEqual([])
  })

  it('starts a fresh spark at the head and cools it from bright to rose as it ages', () => {
    // catches: sparks born away from the point, or that never change colour
    const streaks = sparkStreaks(2.5, still, { birthsUntil: rideEnd })
    const youngest = streaks.reduce((a, b) => (a.age < b.age ? a : b))
    const oldest = streaks.reduce((a, b) =>
      a.age / a.life > b.age / b.life ? a : b,
    )
    expect(Math.hypot(youngest.x1 - 100, youngest.y1 - 50)).toBeLessThan(5)
    expect(youngest.cool).toBeLessThan(oldest.cool)
  })
})
