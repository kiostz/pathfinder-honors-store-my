// Tests for the stylesheet's theme rules: dark values must never reach paper, whatever the theme pick or the system setting.

import { readFileSync } from 'node:fs' // reads index.css
import { resolve } from 'node:path' // the path to index.css
import { describe, expect, it } from 'vitest' // test API

const css = readFileSync(
  resolve(process.cwd(), 'src/styles/index.css'),
  'utf8',
).replace(/\/\*[\s\S]*?\*\//g, '') // the stylesheet without comments as shipped; vitest runs from the project root

/**
 * Lists, for every place a declaration appears, the at-rules it sits inside.
 * @param source the CSS text
 * @param declaration the declaration text to find, e.g. '--color-bg-app: #000000'
 * @return one list of enclosing at-rule headers per match, outermost first
 */
function enclosingAtRules(source: string, declaration: string): string[][] {
  const stack: string[] = [] // header text of each open block; '' for a plain rule
  const found: string[][] = [] // result
  let header = '' // text since the last brace or semicolon
  for (let index = 0; index < source.length; index += 1) {
    const char = source[index]
    if (char === '{') {
      stack.push(header.trim()) // enter a block
      header = ''
    } else if (char === '}') {
      stack.pop() // leave a block
      header = ''
    } else if (char === ';') {
      header = ''
    } else {
      header += char
    }
    if (source.startsWith(declaration, index) && char === declaration[0])
      found.push(stack.filter((text) => text.startsWith('@'))) // the at-rules around this declaration
  }
  return found
}

describe('index.css dark values', () => {
  it('are written both for the Dark pick and for System-dark, each only for screens', () => {
    // catches: dark tokens applying in print, which gave a dark-OS buyer near-white text on paper
    const matches = enclosingAtRules(css, '--color-bg-app: #000000')
    expect(matches).toHaveLength(2) // the Dark pick and the System-dark block
    for (const atRules of matches)
      expect(atRules.some((rule) => /^@media\s+screen\b/.test(rule))).toBe(true)
  })
})

describe('index.css print block', () => {
  it('sets the light page and ink colours for every page and for a picked theme', () => {
    // catches: a picked Dark theme outranking the print values, so paper gets dark-on-dark
    const print = css.slice(css.indexOf('@media print')) // the print block runs to the end of the file
    expect(print).toMatch(/:root\s*,\s*:root\[data-theme\]\s*\{/)
    expect(print).toContain('--color-bg-app: #ffffff')
    expect(print).toContain('--color-text-default: #1d1d1f')
  })
})

describe('index.css emblem trace', () => {
  /**
   * Reads a block's text, from its header to the block's own closing brace.
   * @param header the text before the opening brace
   * @return the text inside the braces
   */
  function block(header: string): string {
    const start = css.indexOf(`${header} {`) // block start
    if (start < 0) throw new Error(`index.css has no block "${header}"`) // the test's own precondition
    let depth = 0 // open braces
    for (let at = css.indexOf('{', start); at < css.length; at += 1) {
      if (css[at] === '{') depth += 1 // opens
      if (css[at] === '}') depth -= 1 // closes
      if (depth === 0) return css.slice(css.indexOf('{', start) + 1, at) // the inside
    }
    throw new Error('unclosed block') // malformed css
  }

  it('plays once: every trace rule runs forwards with no repeat', () => {
    // catches: a loop coming back, which would need a pause control (WCAG 2.2.2)
    const rules = css.slice(0, css.indexOf('@media (prefers-reduced-motion')).match(/\.trace-(build|tail[123]|rider)\s*\{[^}]*\}/g) ?? [] // the base rules, before the Reduce Motion block
    expect(rules).toHaveLength(5) // build, three tails, rider
    for (const rule of rules) {
      expect(rule).toMatch(/forwards/)
      expect(rule).not.toMatch(/infinite/)
    }
  })

  it('gives the spark head rays and a flicker that end, and a light-bloom blend, with the rays and flicker off under Reduce Motion', () => {
    // catches: a flicker or turn that never stops (WCAG 2.2.2), or sparks and rays left running for people who asked for no motion
    const base = css.slice(0, css.indexOf('@media (prefers-reduced-motion')) // the rules before the Reduce Motion block
    for (const name of ['trace-rays', 'trace-flicker']) {
      const rule = base.match(new RegExp(`\\.${name}\\s*\\{[^}]*\\}`))?.[0] ?? '' // the base rule
      expect(rule).toMatch(/forwards/)
      expect(rule).not.toMatch(/infinite/)
    }
    expect(base.match(/\.trace-flicker\s*\{[^}]*\}/)![0]).toMatch(/animation:[^;]*\s\d+\s/) // a finite count
    expect(base.match(/\.trace-rider\s*\{[^}]*\}/)![0]).toMatch(/mix-blend-mode:\s*plus-lighter/)
    const reduced = block('@media (prefers-reduced-motion: reduce)')
    for (const name of ['trace-rays', 'trace-flicker', 'emblem-sparks']) expect(reduced).toContain(name)
  })

  it('ends the flicker before the trace does: steps times flicker duration is at most the trace duration', () => {
    // catches: a token edit that lets the flicker outlive the ride and pass 5 s (WCAG 2.2.2)
    const rule = css.match(/\.trace-flicker\s*\{[^}]*\}/)![0] // the base rule
    const steps = Number(/linear\s+(\d+)\s+alternate/.exec(rule)![1]) // the iteration count
    const flicker = Number(/--duration-trace-flicker:\s*(\d+)ms/.exec(css)![1]) // one step in ms
    const trace = Number(/--duration-trace:\s*(\d+)ms/.exec(css)![1]) // the trace in ms
    expect(steps * flicker).toBeLessThanOrEqual(trace)
  })

  it('holds the emblem path in one place, not in the stylesheet', () => {
    // catches: a second copy of the path, which a swap would miss (the rider would leave the line)
    expect(css).not.toMatch(/path\(\s*['"]M/)
    expect(css).toMatch(/offset-path:\s*var\(--emblem-path\)/)
  })

  it('defines the plain and the stronger tile-name halo', () => {
    // catches: a halo class with no token behind it
    expect(css).toMatch(/--text-shadow-halo:/)
    expect(css).toMatch(/--text-shadow-halo-strong:/)
  })

  it('keeps the whole play under 5 seconds', () => {
    // catches: a WCAG 2.2.2 regression
    expect(css).toMatch(/--duration-trace:\s*4800ms/)
    expect(css).toMatch(/--duration-trace-build:\s*4100ms/)
  })

  it('stops the build line and hides the trail and rider under Reduce Motion', () => {
    // catches: motion for people who asked for none
    const reduced = block('@media (prefers-reduced-motion: reduce)')
    expect(reduced).toMatch(/\.trace-build[^{]*\{[^}]*animation:\s*none/)
    expect(reduced).not.toMatch(/opacity:\s*0\.6/) // the path already carries its 0.3, so the still outline matches the resting one
    for (const name of ['trace-tail1', 'trace-tail2', 'trace-tail3', 'trace-rider']) expect(reduced).toContain(name)
    expect(reduced).toMatch(/display:\s*none/)
  })
})

describe('index.css theme select', () => {
  it('has no .theme-select rule left, and keeps the category filter and club select base-select rules', () => {
    // catches: dead rules for the removed dropdown, or the shared rules lost with them
    expect(css).not.toContain('.theme-select')
    expect(css).toContain('.category-filter')
    expect(css).toContain('.club-select')
    expect(css).toContain('appearance: base-select')
  })
})

describe('index.css tab pill', () => {
  /**
   * Reads the text of a rule or at-rule block from its header to its own closing brace.
   * @param header the text before the opening brace
   * @return the text inside the braces
   */
  function inside(header: string): string {
    const start = css.indexOf(`${header} {`) // block start
    if (start < 0) throw new Error(`index.css has no block "${header}"`) // the test's own precondition
    let depth = 0 // open braces
    for (let at = css.indexOf('{', start); at < css.length; at += 1) {
      if (css[at] === '{') depth += 1 // opens
      if (css[at] === '}') depth -= 1 // closes
      if (depth === 0) return css.slice(css.indexOf('{', start) + 1, at) // the inside
    }
    throw new Error('unclosed block') // malformed css
  }

  it('defines the pill shadow, the 250 ms toggle duration and the on-screen easing as tokens', () => {
    // catches: a pill whose shadow, duration or easing is a literal in a component
    expect(css).toMatch(/--shadow-pill:\s*0 6px 20px rgb\(74 21 32 \/ 0\.16\)/)
    expect(css).toMatch(/\.pill-edge\s*\{[^}]*box-shadow:\s*var\(--shadow-pill\)/) // read through the variable, so the dark override reaches it
    expect(css).toMatch(/--duration-toggle:\s*250ms/)
    expect(css).toMatch(/--ease-in-out-soft:\s*cubic-bezier\(0\.65,\s*0,\s*0\.35,\s*1\)/)
  })

  it('swaps the pill shadow for a border-subtle hairline in both dark blocks', () => {
    // catches: a shadow that does not read on black, so the pill melts into the page in Dark
    const hairline = /--shadow-pill:\s*0 0 0 1px var\(--color-border-subtle\)/g // a 1 px ring in the hairline colour
    expect(css.match(hairline)).toHaveLength(2) // the Dark pick and the System-dark block
  })

  it('animates the tabs\' flex-grow and flex-basis with the toggle duration and easing', () => {
    // catches: a width change that snaps, or one with a literal duration
    const rule = inside('.pill-tab')
    expect(rule).toMatch(/transition:[^;]*flex-grow var\(--duration-toggle\) var\(--ease-in-out-soft\)/)
    expect(rule).toMatch(/transition:[^;]*flex-basis var\(--duration-toggle\) var\(--ease-in-out-soft\)/)
  })

  it('switches the width transition off under Reduce Motion and fades the content faster instead', () => {
    // catches: a width animation for people who asked for none
    const reduced = inside('@media (prefers-reduced-motion: reduce)')
    expect(reduced).toMatch(/\.pill-tab\s*\{[^}]*transition:\s*none/)
    expect(reduced).toMatch(/\.pill-content\s*\{[^}]*animation-duration:\s*var\(--duration-fast\)/)
    const base = css.slice(0, css.indexOf('@media (prefers-reduced-motion'))
    expect(base).toMatch(/\.pill-tab\s*\{[^}]*transition:/) // the transition itself sits outside the reduced block
  })
})
