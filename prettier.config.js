// Prettier formatting rules for the whole repo (same style as LiveChat-FE).
/** @type {import('prettier').Config} */
export default {
  // No semicolons at the end of statements.
  semi: false,
  // Single quotes for strings.
  singleQuote: true,
  // Trailing comma after the last item of multi-line lists.
  trailingComma: 'all',
  // Wrap lines longer than 80 characters.
  printWidth: 80,
  // Sort Tailwind classes into canonical order.
  plugins: ['prettier-plugin-tailwindcss'],
  // React component files get a wider limit so JSX tags stay on one line.
  overrides: [{ files: '*.tsx', options: { printWidth: 120 } }],
}
