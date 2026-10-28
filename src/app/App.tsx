// App shell: the site header and the catalogue, so every later screen hangs off one frame.

import { Catalogue } from '@/features/catalogue/Catalogue.tsx' // the buyer's list of honors

/**
 * The whole page: header plus the catalogue.
 * @return the app shell
 */
export function App() {
  return (
    <div className="bg-bg-app text-text-default min-h-screen">
      {/* Site name; the only header content. */}
      <header className="border-border-subtle bg-bg-surface border-b">
        <h1 className="mx-auto max-w-3xl px-4 py-4 text-xl font-semibold">Pathfinder Honors</h1>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-6">
        <Catalogue />
      </main>
    </div>
  )
}
