// A small CSV reader for the seed's source list: quoted fields, "" escapes, CRLF or LF.

/**
 * Parses CSV text whose first row is the header.
 * @param text the whole CSV text
 * @return one object per data row, keyed by the header names; [] when there is only a header
 */
export function parseCsv(text: string): Record<string, string>[] {
  const records: string[][] = [] // every row as a list of fields
  let field = '' // the field being read
  let record: string[] = [] // the row being read
  let inQuotes = false // inside a quoted field
  for (let i = 0; i < text.length; i++) {
    // one character at a time
    const char = text[i] // current character
    if (inQuotes) {
      if (char === '"' && text[i + 1] === '"') {
        field += '"' // "" is one quote
        i++ // skip the second quote
      } else if (char === '"') {
        inQuotes = false // closing quote
      } else {
        field += char // anything else, commas and newlines included
      }
    } else if (char === '"') {
      inQuotes = true // opening quote
    } else if (char === ',') {
      record.push(field) // field done
      field = '' // start the next field
    } else if (char === '\n' || char === '\r') {
      if (char === '\r' && text[i + 1] === '\n') i++ // CRLF counts once
      record.push(field) // row done
      records.push(record) // keep the row
      field = '' // start the next field
      record = [] // start the next row
    } else {
      field += char // ordinary character
    }
  }
  if (field !== '' || record.length > 0) {
    record.push(field) // last row had no final newline
    records.push(record) // keep the last row
  }
  const [header = [], ...dataRows] = records // first row names the keys
  return dataRows.map((row) =>
    // one object per data row
    Object.fromEntries(header.map((key, i) => [key, row[i] ?? ''])),
  )
}
