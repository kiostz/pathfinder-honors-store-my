// Tests for parseCsv: quoted fields, escapes, line endings and the header row.

import { describe, expect, it } from 'vitest' // test API
import { parseCsv } from './csv.ts' // code under test

describe('parseCsv', () => {
  it('keeps a comma inside a quoted field', () => {
    expect(parseCsv('a,b\n"First Aid, Advanced",x\n')).toEqual([
      { a: 'First Aid, Advanced', b: 'x' },
    ])
  })

  it('reads "" inside quotes as one quote', () => {
    expect(parseCsv('a\n"say ""hi"""\n')).toEqual([{ a: 'say "hi"' }])
  })

  it('keeps an empty trailing field as an empty string', () => {
    expect(parseCsv('a,b,c\n1,2,\n')).toEqual([{ a: '1', b: '2', c: '' }])
  })

  it('reads CRLF and LF alike', () => {
    expect(parseCsv('a,b\r\n1,2\r\n3,4\r\n')).toEqual([
      { a: '1', b: '2' },
      { a: '3', b: '4' },
    ])
    expect(parseCsv('a,b\n1,2\n3,4')).toEqual([
      { a: '1', b: '2' },
      { a: '3', b: '4' },
    ])
  })

  it('ignores the final newline', () => {
    expect(parseCsv('a\n1\n')).toHaveLength(1)
  })

  it('returns [] for header-only text', () => {
    expect(parseCsv('a,b\n')).toEqual([])
    expect(parseCsv('a,b')).toEqual([])
  })
})
