// App shell: the site header, the catalogue and the cart bar, so every later screen hangs off one frame.

import { CartBar } from '@/features/cart/CartBar.tsx' // the fixed bar with the item count
import { CartProvider } from '@/features/cart/CartProvider.tsx' // the cart state
import { Catalogue } from '@/features/catalogue/Catalogue.tsx' // the buyer's list of honors
import { useCatalogueData } from '@/features/catalogue/use-catalogue-data.ts' // the one load

/**
 * The whole page: header, catalogue and cart bar.
 * @return the app shell
 */
export function App() {
  const data = useCatalogueData() // one load feeds the catalogue and the bar
  return (
    <CartProvider>
      <div className="bg-bg-app text-text-default min-h-screen">
        {/* Site name; the only header content. */}
        <header className="border-border-subtle bg-bg-surface border-b">
          <h1 className="mx-auto max-w-3xl px-4 py-4 text-xl font-semibold">Pathfinder Honors</h1>
        </header>
        <main className="mx-auto max-w-3xl px-4 pt-6 pb-24">
          <Catalogue data={data} />
        </main>
        {/* Only once the honors are loaded; slides up when something is picked. */}
        {data.state.status === 'ready' && (
          <CartBar honors={data.state.honors} currency={data.state.settings.currency} />
        )}
      </div>
    </CartProvider>
  )
}
