// Tests for the seed: seedHonors against the real source list, and the CLI's overwrite guard.

// Node helpers: run the CLI, read files, make a temp folder.
import { spawnSync } from 'node:child_process' // runs the CLI
import {
  existsSync,
  mkdtempSync,
  rmSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from 'node:fs'
import { tmpdir } from 'node:os' // temp folder location
import { join, resolve } from 'node:path' // path helpers
import { afterEach, describe, expect, it } from 'vitest' // test API
import { parseCsv } from '../../src/shared/data/csv.ts' // reads the source list
import { seedHonors } from './seed-data.ts' // code under test

const settings = { currency: 'MYR', defaultPrice: 4 } // starting settings
const rows = parseCsv(readFileSync('scripts/seed/adventist-honors.csv', 'utf8')) // the real source list
const cliPath = resolve('scripts/seed/seed-data.ts') // absolute path of the CLI

describe('seedHonors', () => {
  const honors = seedHonors(rows, settings)

  it('makes 422 honors', () => {
    expect(honors).toHaveLength(422)
  })

  it('switches on exactly the 299 General Conference honors', () => {
    const on = honors.filter((honor) => honor.enabled)
    expect(on).toHaveLength(299)
    expect(on.every((honor) => honor.issuedBy === 'General Conference')).toBe(
      true,
    )
  })

  it('prices every honor at the default price', () => {
    expect(honors.every((honor) => honor.price === 4)).toBe(true)
  })

  it('maps an empty skill_level to null and "2" to 2', () => {
    const base = {
      category: 'Nature',
      issued_by: 'General Conference',
    }
    const [empty, two] = seedHonors(
      [
        { ...base, honor: 'A', skill_level: '' },
        { ...base, honor: 'B', skill_level: '2' },
      ],
      settings,
    )
    expect(empty.skillLevel).toBeNull()
    expect(two.skillLevel).toBe(2)
  })

  it('has no patch picture yet', () => {
    expect(honors.every((honor) => honor.image === null)).toBe(true)
  })

  it('keeps Braiding - Advanced as its own honor', () => {
    const names = honors.map((honor) => honor.name)
    expect(names).toContain('Braiding')
    expect(names).toContain('Braiding - Advanced')
  })

  // Bug caught: ids not unique/slug-shaped across the real list, or a row dropped or reordered.
  it('gives all 422 honors unique slug ids in source order', () => {
    expect(new Set(honors.map((honor) => honor.id)).size).toBe(422) // unique
    for (const honor of honors)
      expect(honor.id).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/) // slug-shaped
    expect(honors.map((honor) => honor.name)).toEqual(
      rows.map((row) => row.honor),
    ) // order and names kept
    expect(honors.map((honor) => honor.category)).toEqual(
      rows.map((row) => row.category),
    ) // categories kept
  })

  // Bug caught: empty skill level mapped to 0/NaN, or the General Conference null row lost.
  it('has 37 null skill levels, one of them General Conference, the rest 1 to 3', () => {
    const nulls = honors.filter((honor) => honor.skillLevel === null) // honors without a level
    expect(nulls).toHaveLength(37)
    expect(
      nulls.filter((honor) => honor.issuedBy === 'General Conference'),
    ).toHaveLength(1)
    expect(nulls.find((honor) => honor.id === 'aboriginal-lore')?.enabled).toBe(
      true,
    ) // the GC one is still switched on
    for (const honor of honors.filter((h) => h.skillLevel !== null))
      expect([1, 2, 3]).toContain(honor.skillLevel)
  })

  // Bug caught: wrong issuer column copied, or enabled tested with a loose match (e.g. startsWith).
  it('switches the 123 other honors off and keeps issuedBy as in the list', () => {
    const off = honors.filter((honor) => !honor.enabled) // switched off
    expect(off).toHaveLength(123)
    expect(off.some((honor) => honor.issuedBy === 'General Conference')).toBe(
      false,
    )
    expect(
      honors.filter((honor) => honor.issuedBy === 'North American Division'),
    ).toHaveLength(77)
  })

  // Bug caught: the price comes from a constant instead of the settings given.
  it('uses the default price of the settings it is given', () => {
    const out = seedHonors(
      [{ honor: 'Z', category: 'C', skill_level: '1', issued_by: 'Club' }],
      { currency: 'USD', defaultPrice: 7.5 },
    )
    expect(out[0].price).toBe(7.5)
  })

  // Bug caught: a bad skill level silently becomes NaN or a wrong level.
  it.each(['0', '4', 'x', '1.5'])('throws on skill_level "%s"', (level) => {
    expect(() =>
      seedHonors(
        [{ honor: 'Z', category: 'C', skill_level: level, issued_by: 'Club' }],
        settings,
      ),
    ).toThrow(/skill_level/)
  })

  // Bug caught: only some columns are checked, so a missing honor, skill_level or issued_by column slips through.
  it.each(['honor', 'skill_level', 'issued_by'])(
    'throws when column %s is missing', // each required column
    (column) => {
      const row: Record<string, string> = {
        honor: 'A',
        category: 'C',
        skill_level: '1',
        issued_by: 'Club',
      } // a full row
      delete row[column] // drop one column
      expect(() => seedHonors([row], settings)).toThrow(
        `Missing column "${column}"`,
      )
    },
  )

  // Bug caught: a BOM-prefixed or short header makes row.category undefined and the honor is written without it.
  it('throws when a required column is missing from the rows', () => {
    const row = {
      honor: 'A',
      '\ufeffcategory': 'C',
      skill_level: '1',
      issued_by: 'Club',
    } // BOM glued to the header name
    expect(() => seedHonors([row], settings)).toThrow(
      /Missing column "category"/,
    )
  })

  // Bug caught: a blank CSV line or a symbol-only name becomes an honor with id "".
  it('throws when a name makes an empty id', () => {
    const row = { category: 'C', skill_level: '1', issued_by: 'Club' } // rest of the row
    expect(() => seedHonors([{ ...row, honor: '!!!' }], settings)).toThrow(
      /Empty honor id/,
    )
    expect(() => seedHonors([{ ...row, honor: '' }], settings)).toThrow(
      /Empty honor id/,
    )
  })

  // Bug caught: duplicate detection compares names, so different names with the same slug slip through.
  it('throws when two different names make the same id', () => {
    const row = { category: 'Nature', issued_by: 'Club', skill_level: '1' }
    expect(() =>
      seedHonors(
        [
          { ...row, honor: "Bob's" },
          { ...row, honor: 'Bobs' },
        ],
        settings,
      ),
    ).toThrow(/Duplicate honor id: bobs/)
  })

  it('throws on two rows with the same name', () => {
    const row = { category: 'Nature', issued_by: 'Club', skill_level: '1' }
    expect(() =>
      seedHonors(
        [
          { ...row, honor: 'Twin' },
          { ...row, honor: 'Twin' },
        ],
        settings,
      ),
    ).toThrow(/duplicate/i)
  })
})

describe('seed CLI', () => {
  const tempDirs: string[] = [] // folders made by this test, removed after it
  afterEach(() => {
    for (const dir of tempDirs.splice(0))
      rmSync(dir, { recursive: true, force: true }) // no temp clutter
  })

  /** Runs the CLI in a folder that already holds honors.json. */
  function runIn(dir: string, args: string[]) {
    return spawnSync('node', [cliPath, ...args], { cwd: dir, encoding: 'utf8' })
  }

  /** Makes a temp project folder with the CSV and an existing honors.json. */
  function makeProject() {
    const dir = mkdtempSync(join(tmpdir(), 'seed-')) // fresh folder
    tempDirs.push(dir) // remember it for cleanup
    mkdirSync(join(dir, 'scripts/seed'), { recursive: true })
    mkdirSync(join(dir, 'public/data'), { recursive: true })
    writeFileSync(
      join(dir, 'scripts/seed/adventist-honors.csv'),
      readFileSync('scripts/seed/adventist-honors.csv'),
    )
    writeFileSync(join(dir, 'public/data/honors.json'), '[]\n')
    return dir
  }

  it('refuses to overwrite without --force and leaves the file unchanged', () => {
    const dir = makeProject()
    const result = runIn(dir, [])
    expect(result.status).toBe(1)
    expect(result.stderr).toContain('--force')
    expect(readFileSync(join(dir, 'public/data/honors.json'), 'utf8')).toBe(
      '[]\n',
    )
    expect(existsSync(join(dir, 'public/data/settings.json'))).toBe(false)
  })

  // Bug caught: the guard checks only honors.json, so a missing honors.json lets a seed wipe clubs.json or settings.json.
  it.each(['clubs.json', 'settings.json'])(
    'refuses when only %s exists',
    (name) => {
      const dir = makeProject()
      rmSync(join(dir, 'public/data/honors.json')) // honors.json absent
      writeFileSync(join(dir, 'public/data', name), 'kept\n') // admin-owned file
      const result = runIn(dir, [])
      expect(result.status).toBe(1)
      expect(readFileSync(join(dir, 'public/data', name), 'utf8')).toBe(
        'kept\n',
      )
      expect(existsSync(join(dir, 'public/data/honors.json'))).toBe(false)
    },
  )

  // Bug caught: the error names only one file, or the guard writes some files before refusing.
  it('names all three existing files in the refusal and writes nothing', () => {
    const dir = makeProject()
    writeFileSync(join(dir, 'public/data/clubs.json'), 'kept-c\n') // admin clubs
    writeFileSync(join(dir, 'public/data/settings.json'), 'kept-s\n') // admin settings
    const result = runIn(dir, [])
    expect(result.status).toBe(1)
    for (const name of ['honors.json', 'clubs.json', 'settings.json']) {
      expect(result.stderr).toContain(name) // each file named
    }
    expect(readFileSync(join(dir, 'public/data/clubs.json'), 'utf8')).toBe(
      'kept-c\n',
    )
    expect(readFileSync(join(dir, 'public/data/settings.json'), 'utf8')).toBe(
      'kept-s\n',
    )
  })

  // Bug caught: the CLI writes data files before validating, or swallows the error and exits 0 on a bad CSV.
  it('fails with a bad CSV under --force and leaves existing files unchanged', () => {
    const dir = makeProject()
    const csvPath = join(dir, 'scripts/seed/adventist-honors.csv') // copy in the temp project
    const text = readFileSync(csvPath, 'utf8') // original text
    writeFileSync(csvPath, '\ufeff' + text) // BOM glued to the category header
    const result = runIn(dir, ['--force'])
    expect(result.status).not.toBe(0)
    expect(result.stderr).toContain('Missing column "category"')
    expect(readFileSync(join(dir, 'public/data/honors.json'), 'utf8')).toBe(
      '[]\n',
    )
    expect(existsSync(join(dir, 'public/data/clubs.json'))).toBe(false)
  })

  it('overwrites with --force and prints the counts', () => {
    const dir = makeProject()
    const result = runIn(dir, ['--force'])
    expect(result.status).toBe(0)
    expect(result.stdout).toContain('Seeded 422 honors (299 switched on).')
  })

  // Bug caught: --force writes honors but not clubs/settings, or writes the wrong content or format.
  it('with --force replaces honors.json and writes clubs.json and settings.json exactly', () => {
    const dir = makeProject()
    runIn(dir, ['--force'])
    const honors = JSON.parse(
      readFileSync(join(dir, 'public/data/honors.json'), 'utf8'),
    ) // new honors
    expect(honors).toHaveLength(422)
    expect(
      readFileSync(join(dir, 'public/data/honors.json'), 'utf8').endsWith(
        '}\n]\n',
      ),
    ).toBe(true) // 2-space JSON, final newline
    expect(readFileSync(join(dir, 'public/data/clubs.json'), 'utf8')).toBe(
      '[]\n',
    )
    expect(readFileSync(join(dir, 'public/data/settings.json'), 'utf8')).toBe(
      '{\n  "currency": "MYR",\n  "defaultPrice": 4\n}\n',
    )
  })

  // Bug caught: the guard blocks the very first seed (no honors.json yet).
  it('seeds without --force when honors.json does not exist', () => {
    const dir = makeProject()
    rmSync(join(dir, 'public/data/honors.json'))
    const result = runIn(dir, [])
    expect(result.status).toBe(0)
    expect(existsSync(join(dir, 'public/data/honors.json'))).toBe(true)
  })

  // Bug caught: the guard only checks for --force being absent, not exact flag use; an unrelated flag must not bypass it.
  it('does not treat other flags as --force', () => {
    const dir = makeProject()
    const result = runIn(dir, ['--forced'])
    expect(result.status).toBe(1)
    expect(readFileSync(join(dir, 'public/data/honors.json'), 'utf8')).toBe(
      '[]\n',
    )
  })

  // Bug caught: the repo copy of the CSV drifts from the source list the seed counts are based on.
  it('holds the committed CSV with 422 rows', () => {
    expect(rows).toHaveLength(422)
  })
})
