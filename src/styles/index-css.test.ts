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
