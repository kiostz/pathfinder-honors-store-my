// Tests for the store's name: one constant, and the files that cannot import it all say the same name, so a missed rename shows up here.

import { readdirSync, readFileSync } from 'node:fs' // reads the source tree and the three top-level files
import { resolve } from 'node:path' // the paths
import { describe, expect, it } from 'vitest' // test API
import { STORE_NAME } from './store-name.ts' // code under test

const root = process.cwd() // vitest runs from the project root
const OLD_NAME = ['AY', 'Store'].join(' ') // the retired name, built from parts so this file does not match itself

/**
 * Lists every file under a folder.
 * @param folder the folder to walk
 * @return the files' paths
 */
function filesUnder(folder: string): string[] {
  return readdirSync(folder, { withFileTypes: true }).flatMap((entry) =>
    entry.isDirectory() ? filesUnder(resolve(folder, entry.name)) : [resolve(folder, entry.name)],
  ) // folders are walked, files listed
}

describe('STORE_NAME', () => {
  it('is PEM Pathfinder Store', () => {
    // catches: a typo in the one place every screen, tab title and order email takes the name from
    expect(STORE_NAME).toBe('PEM Pathfinder Store')
  })

  it('is the name in the page title, the README heading and the DESIGN heading', () => {
    // catches: a file that cannot import the constant keeping the old name
    const html = readFileSync(resolve(root, 'index.html'), 'utf8') // the page as shipped
    expect(/<title>([^<]*)<\/title>/.exec(html)?.[1]).toContain(STORE_NAME)
    for (const file of ['README.md', 'DESIGN.md']) {
      const heading = /^# .*$/m.exec(readFileSync(resolve(root, file), 'utf8'))?.[0] // the first heading
      expect(heading, file).toContain(STORE_NAME)
    }
  })

  it('leaves the old name in no source file, the page or the two guides', () => {
    // catches: a missed rename
    const files = [...filesUnder(resolve(root, 'src')), ...['index.html', 'README.md', 'DESIGN.md'].map((file) => resolve(root, file))]
    const stale = files.filter((file) => readFileSync(file, 'utf8').includes(OLD_NAME)) // files that still carry it
    expect(stale).toEqual([])
  })

  it('has no honor in it, the copy rule for buyer-facing names', () => {
    // catches: a buyer-facing name using the word the buyers do not use
    expect(STORE_NAME.toLowerCase()).not.toContain('honor')
  })
})
