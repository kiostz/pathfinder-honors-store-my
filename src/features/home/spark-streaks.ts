// The pure spark function behind the emblem trace: which short streaks exist at a time, given where the rider was, repeatable so the same time always gives the same sparks.

/** One short streak: from its tail (x0, y0) to its head (x1, y1). */
export type SparkStreak = {
  x0: number // tail x in px
  y0: number // tail y in px
  x1: number // head x in px
  y1: number // head y in px
  width: number // line width in px
  cool: number // 0 when born (trace-bright) to 1 at its death (trace)
  alpha: number // 1 when born to 0 at its death
  age: number // seconds since it was born
  life: number // seconds it lives
}

/** Where the rider was, in canvas px. */
export type SparkPoint = { x: number; y: number }

const RATE = 40 // sparks born per second
const LIFE_MIN = 0.25 // shortest life in seconds
const LIFE_MAX = 0.45 // longest life in seconds
const SPEED_MIN = 30 // slowest launch in px/s
const SPEED_MAX = 80 // fastest launch in px/s
const LIFT = 15 // the slight upward bias on every launch in px/s
const GRAVITY = 140 // downward pull in px/s squared
const TAIL_TIME = 0.06 // how far back in time a streak's tail reaches, in seconds
export const RIDE_SHARE = 0.85 // the share of the trace's duration the point rides, as in the CSS keyframes

/**
 * A repeatable pseudo-random number, so the same spark always flies the same way.
 * @param n the spark's number
 * @param salt which quality of the spark (angle, speed, life)
 * @return a number from 0 up to but not including 1
 */
function hash(n: number, salt: number): number {
  const scrambled = Math.sin(n * 127.1 + salt * 311.7) * 43758.5453 // a classic sine hash
  return scrambled - Math.floor(scrambled) // the fraction
}

/**
 * Works out the streaks alive at a time. Sparks are born on a fixed clock, so a spark keeps its look whatever time it is asked at.
 * @param t seconds since the trace began
 * @param headAt where the point was at a time in seconds, or null when it had no position
 * @param options birthsUntil: the last second a spark may be born (the end of the ride)
 * @return the live streaks, empty when nothing was born in the last life span
 */
export function sparkStreaks(
  t: number,
  headAt: (time: number) => SparkPoint | null,
  options: { birthsUntil: number },
): SparkStreak[] {
  const streaks: SparkStreak[] = [] // result
  const first = Math.max(0, Math.floor((t - LIFE_MAX) * RATE)) // oldest spark that could still live
  const last = Math.floor(Math.min(t, options.birthsUntil) * RATE) // newest spark born so far
  for (let n = first; n <= last; n += 1) {
    // n is the spark's number
    const born = n / RATE // when it was born
    const age = t - born // how old it is
    const life = LIFE_MIN + (LIFE_MAX - LIFE_MIN) * hash(n, 2) // how long it lives
    if (age > life) continue // dead: skip before asking for a position
    const origin = headAt(born) // where the point was
    if (!origin) continue // born from nowhere
    const angle = hash(n, 0) * Math.PI * 2 // any direction
    const speed = SPEED_MIN + (SPEED_MAX - SPEED_MIN) * hash(n, 1) // launch speed
    const vx = Math.cos(angle) * speed // sideways velocity
    const vy = Math.sin(angle) * speed - LIFT // vertical velocity, biased up
    const before = Math.max(0, age - TAIL_TIME) // the tail's age
    const lifeShare = age / life // 0 to 1 over its life
    streaks.push({
      x0: origin.x + vx * before, // tail x
      y0: origin.y + vy * before + 0.5 * GRAVITY * before * before, // tail y, falling
      x1: origin.x + vx * age, // head x
      y1: origin.y + vy * age + 0.5 * GRAVITY * age * age, // head y, falling
      width: 1.5 - 0.5 * lifeShare, // 1.5 px thinning to 1 px
      cool: lifeShare, // bright to rose
      alpha: 1 - lifeShare, // fades out
      age, // seconds since birth
      life, // seconds it lives
    })
  }
  return streaks // the live streaks
}
