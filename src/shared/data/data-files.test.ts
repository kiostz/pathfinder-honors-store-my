// Shape checks on the committed data files in public/data/, which every screen and the admin save rely on.

import { existsSync, readFileSync } from 'node:fs' // Node file reading
import { describe, expect, it } from 'vitest' // test API
import { patchImagePath } from './patch.ts' // the picture path rule
import type { Honor, Settings } from './types.ts' // data shapes

/** Reads and parses one file from public/data/. */
function readData<T>(name: string): T {
  return JSON.parse(readFileSync(`public/data/${name}`, 'utf8')) as T
}

describe('public/data/honors.json', () => {
  const honors = readData<Honor[]>('honors.json')

  it('has unique ids in slug form', () => {
    expect(new Set(honors.map((h) => h.id)).size).toBe(honors.length)
    for (const honor of honors) {
      expect(honor.id).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/)
    }
  })

  it('gives every honor valid fields', () => {
    for (const honor of honors) {
      expect(honor.name.length).toBeGreaterThan(0)
      expect(honor.category.length).toBeGreaterThan(0)
      expect(typeof honor.enabled).toBe('boolean')
      expect(typeof honor.price).toBe('number')
      expect(honor.price).toBeGreaterThanOrEqual(0)
      expect([1, 2, 3, null]).toContain(honor.skillLevel)
      expect([null, `patches/${honor.id}.webp`]).toContain(honor.image)
    }
  })
})

describe('public/data/honors.json shape', () => {
  const honors = readData<Honor[]>('honors.json') // committed honors

  it('has exactly the documented keys on every honor', () => {
    for (const h of honors) {
      expect(Object.keys(h).sort()).toEqual([
        'category',
        'enabled',
        'id',
        'image',
        'issuedBy',
        'name',
        'price',
        'skillLevel',
      ])
      expect(h.issuedBy.length).toBeGreaterThan(0)
    }
  })

  it('is written as 2-space JSON with a final newline', () => {
    const text = readFileSync('public/data/honors.json', 'utf8') // raw file
    expect(text.endsWith('\n')).toBe(true)
    expect(text).toBe(JSON.stringify(JSON.parse(text), null, 2) + '\n')
  })
})

describe('patch pictures named in honors.json', () => {
  const named = readData<Honor[]>('honors.json').filter(
    (h): h is Honor & { image: string } => h.image !== null,
  ) // honors that claim a picture

  // Bug caught: a JSON pointing at a missing picture goes live as a broken image.
  it('names an existing file at the patchImagePath location', () => {
    for (const honor of named) {
      expect(honor.image).toBe(patchImagePath(honor.id))
      expect(existsSync(`public/${honor.image}`), honor.id).toBe(true)
    }
  })

  // Bug caught: a full-size PNG renamed .webp bloats the site.
  it('is a WebP file under 100 KB', () => {
    for (const honor of named) {
      const file = readFileSync(`public/${honor.image}`) // picture bytes
      expect(file.subarray(0, 4).toString('latin1'), honor.id).toBe('RIFF')
      expect(file.subarray(8, 12).toString('latin1'), honor.id).toBe('WEBP')
      expect(file.length, honor.id).toBeLessThan(100 * 1024)
    }
  })
})

describe('public/data/settings.json', () => {
  const settings = readData<Settings>('settings.json')

  it('has a three-letter currency and a default price of 0 or more', () => {
    expect(settings.currency).toMatch(/^[A-Z]{3}$/)
    expect(settings.defaultPrice).toBeGreaterThanOrEqual(0)
  })

  // Bug caught: extra or missing keys in the committed settings.
  it('has exactly currency and defaultPrice', () => {
    expect(Object.keys(settings).sort()).toEqual(['currency', 'defaultPrice'])
  })
})

describe('public/data/clubs.json', () => {
  const clubs = readData<unknown>('clubs.json')

  it('is a list of non-empty, unique strings', () => {
    expect(Array.isArray(clubs)).toBe(true)
    const list = clubs as unknown[]
    for (const club of list) {
      expect(typeof club).toBe('string')
      expect((club as string).length).toBeGreaterThan(0)
    }
    expect(new Set(list).size).toBe(list.length)
  })
})
