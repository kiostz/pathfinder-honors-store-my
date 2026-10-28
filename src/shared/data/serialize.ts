// One way to write the data files, so seed output and admin saves produce small git diffs.

/**
 * Serializes a value for a file in public/data/: two-space JSON plus a final newline.
 * @param value the value to write
 * @return the file text
 */
export function serializeData(value: unknown): string {
  return JSON.stringify(value, null, 2) + '\n' // stable layout, newline at the end
}
