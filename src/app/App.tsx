// App shell: the site header and the screen the address names (catalogue or cart), so every screen hangs off one frame.

import { useEffect, useLayoutEffect, useRef, type MouseEvent } from 'react' // scroll, focus and title around a screen change, and the click's type
import { CartBar } from '@/features/cart/CartBar.tsx' // the fixed bar with the item count
import { CartProvider } from '@/features/cart/CartProvider.tsx' // the cart state
import { CartScreen } from '@/features/cart/CartScreen.tsx' // the cart screen
import { Catalogue } from '@/features/catalogue/Catalogue.tsx' // the buyer's list of honors
import { useCatalogueData } from '@/features/catalogue/use-catalogue-data.ts' // the one load
import { CATALOGUE_HASH } from '@/shared/routes.ts' // the catalogue's address
import { useHashRoute } from './use-hash-route.ts' // which screen the address names

const SITE_TITLE = 'Pathfinder Honors' // the catalogue's tab title
const FROM_CATALOGUE_STATE = { fromCatalogue: true } // marks a cart history entry the bar pushed, so history back leads to the catalogue

/**
 * The whole page: header and the catalogue or the cart screen.
 * @return the app shell
 */
export function App() {
  const data = useCatalogueData() // one load feeds the catalogue, the bar and the cart screen
  const route = useHashRoute() // the screen the address names
  const lastRoute = useRef(route) // the screen before this one
  const barClicked = useRef(false) // set by the bar's click, read when the cart's history entry exists
  const catalogueScroll = useRef(0) // where the catalogue was scrolled to
  const barRef = useRef<HTMLAnchorElement>(null) // the cart bar's link, focused on return
  const mainRef = useRef<HTMLElement>(null) // focused on return when the cart is empty

  // The app restores scroll itself, so the browser must not do it too, later and from a clamped value.
  useEffect(() => {
    window.history.scrollRestoration = 'manual' // once, for the whole page life
  }, [])

  // Remember the catalogue's scroll while it shows; layout effect so it stops listening as the catalogue is hidden, before the browser's next frame.
  useLayoutEffect(() => {
    if (route !== 'catalogue') return // the cart has its own top
    /** Saves where the catalogue is scrolled to. */
    const remember = () => {
      catalogueScroll.current = window.scrollY // the latest position
    }
    window.addEventListener('scroll', remember, { passive: true }) // cheap listener
    return () => window.removeEventListener('scroll', remember) // stop as the catalogue is hidden
  }, [route])

  // On a screen change: set the scroll and the focus, and note where the cart came from.
  useLayoutEffect(() => {
    const previous = lastRoute.current // the screen just left
    lastRoute.current = route // for the next change
    if (previous === route) return // first draw or nothing changed
    if (route === 'cart') {
      if (barClicked.current) window.history.replaceState(FROM_CATALOGUE_STATE, '') // this entry follows the catalogue one
      barClicked.current = false // only this opening
      window.scrollTo(0, 0) // the cart opens at its top (its heading takes focus itself)
    } else {
      window.scrollTo(0, catalogueScroll.current) // back to where the buyer was
      const bar = barRef.current // the bar, when the cart has lines
      if (bar && !bar.hasAttribute('inert'))
        bar.focus() // back where the buyer left from
      else mainRef.current?.focus() // never the search box: a phone keyboard would open
    }
  }, [route])

  // The tab title follows the screen.
  useEffect(() => {
    document.title = route === 'cart' ? `Your cart · ${SITE_TITLE}` : SITE_TITLE // names the screen in history and tabs
  }, [route])

  /**
   * Notes a plain click on the bar; a click that opens a new tab or window leaves this tab's route alone, so it must not mark.
   * @param event the click on the bar's link
   */
  const markBarOpen = (event: MouseEvent<HTMLAnchorElement>) => {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return // new tab or window: no route change here
    barClicked.current = true // the next cart entry follows the catalogue one
  }

  /** Back to honors: history back when this very history entry was pushed by the bar, otherwise home. */
  const goBack = () => {
    const fromCatalogue = (window.history.state as { fromCatalogue?: boolean } | null)?.fromCatalogue === true // the entry's own mark, true also after browser Back or Forward into it
    if (fromCatalogue)
      window.history.back() // the same as the back button
    else window.location.hash = CATALOGUE_HASH // opened by address or reload: there is nothing to go back to
  }

  return (
    <CartProvider>
      <div className="bg-bg-app text-text-default min-h-screen">
        {/* Site name; the only header content. */}
        <header className="border-border-subtle bg-bg-surface border-b">
          <h1 className="mx-auto max-w-3xl px-4 py-4 text-xl font-semibold">{SITE_TITLE}</h1>
        </header>
        <main ref={mainRef} tabIndex={-1} className="mx-auto max-w-3xl px-4 pt-6 pb-24 outline-none">
          {/* Stays mounted but hidden while the cart shows, so search, category and pictures survive. */}
          <div hidden={route === 'cart'}>
            <Catalogue data={data} />
          </div>
          {/* Only while the address names it, so removed notes end when the buyer leaves. */}
          {route === 'cart' && <CartScreen data={data} onBack={goBack} />}
        </main>
        {/* Only on the catalogue, once the honors are loaded; slides up when something is picked. */}
        {route === 'catalogue' && data.state.status === 'ready' && (
          <CartBar
            honors={data.state.honors}
            currency={data.state.settings.currency}
            linkRef={barRef}
            onOpen={markBarOpen}
          />
        )}
      </div>
    </CartProvider>
  )
}
