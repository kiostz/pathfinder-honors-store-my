// App shell: the site header and the screen the address names (catalogue, cart, details page or order confirmation), so every screen hangs off one frame.

import { useEffect, useLayoutEffect, useRef, type MouseEvent } from 'react' // scroll, focus and title around a screen change, and the click's type
import { CartBar } from '@/features/cart/CartBar.tsx' // the fixed bar with the item count
import { CartProvider } from '@/features/cart/CartProvider.tsx' // the cart state
import { CartScreen } from '@/features/cart/CartScreen.tsx' // the cart screen
import { Catalogue } from '@/features/catalogue/Catalogue.tsx' // the buyer's list of honors
import { useCatalogueData } from '@/features/catalogue/use-catalogue-data.ts' // the one load
import { ConfirmationScreen } from '@/features/order/ConfirmationScreen.tsx' // the screen after a sent order
import { DetailsScreen } from '@/features/order/DetailsScreen.tsx' // the order form's page
import { OrderFormProvider } from '@/features/order/OrderFormProvider.tsx' // the order form's values, kept across screens
import { CART_HASH, CATALOGUE_HASH } from '@/shared/routes.ts' // the catalogue's and the cart's addresses
import { ThemeControl } from '@/shared/theme/ThemeControl.tsx' // System, Light or Dark
import { useHashRoute } from './use-hash-route.ts' // which screen the address names

const SITE_TITLE = 'Pathfinder Honors' // the catalogue's tab title
const FROM_CATALOGUE_STATE = { fromCatalogue: true } // marks a cart history entry the bar pushed, so history back leads to the catalogue
const FROM_CART_STATE = { fromCart: true } // marks a details history entry Checkout pushed, so history back leads to the cart

/**
 * The whole page: header and the screen the address names.
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
    } else if (route === 'details') {
      if (previous === 'cart') window.history.replaceState(FROM_CART_STATE, '') // this entry follows the cart one (Checkout pushed it)
      window.scrollTo(0, 0) // the details page opens at its top (its heading takes focus itself)
    } else if (route === 'order-sent') {
      window.scrollTo(0, 0) // the confirmation opens at its top (its heading takes focus itself)
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
    document.title =
      route === 'cart' // the cart screen
        ? `Your cart · ${SITE_TITLE}` // names the cart
        : route === 'details' // the details page
          ? `Your details · ${SITE_TITLE}` // names the details page
          : route === 'order-sent' // the confirmation
            ? `Order sent · ${SITE_TITLE}` // names the confirmation
            : SITE_TITLE // names the screen in history and tabs
  }, [route])

  /**
   * Notes a plain click on the bar; a click that opens a new tab or window leaves this tab's route alone, so it must not mark.
   * @param event the click on the bar's link
   */
  const markBarOpen = (event: MouseEvent<HTMLAnchorElement>) => {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return // new tab or window: no route change here
    barClicked.current = true // the next cart entry follows the catalogue one
  }

  /** Browse more: history back when this very history entry was pushed by the bar, otherwise home. */
  const goBack = () => {
    const fromCatalogue = (window.history.state as { fromCatalogue?: boolean } | null)?.fromCatalogue === true // the entry's own mark, true also after browser Back or Forward into it
    if (fromCatalogue)
      window.history.back() // the same as the back button
    else window.location.hash = CATALOGUE_HASH // opened by address or reload: there is nothing to go back to
  }

  /** Back to cart: history back when Checkout pushed this very entry, otherwise to the cart by address. */
  const goBackToCart = () => {
    const fromCart = (window.history.state as { fromCart?: boolean } | null)?.fromCart === true // the entry's own mark
    if (fromCart)
      window.history.back() // the same as the back button
    else window.location.replace(CART_HASH) // opened by address or reload: there is nothing to go back to, and no bounce entry is left
  }

  return (
    <CartProvider honors={data.state.status === 'ready' ? data.state.honors : null}>
      <OrderFormProvider>
        <div className="bg-bg-app text-text-default min-h-screen">
          {/* The navy band: the gold site name and the theme control, in the same 1,200 px column as the page. */}
          <header className="bg-header text-on-header">
            <div className="mx-auto flex max-w-300 items-center justify-between gap-3 px-4 py-3">
              <h1 className="sm:text-title text-xl font-bold">{SITE_TITLE}</h1>
              <ThemeControl />
            </div>
          </header>
          <main ref={mainRef} tabIndex={-1} className="mx-auto max-w-300 px-4 pt-6 pb-28 outline-none">
            {/* Stays mounted but hidden while the cart shows, so search, category and pictures survive. */}
            <div hidden={route !== 'catalogue'}>
              <Catalogue data={data} />
            </div>
            {/* Only while the address names it, so removed notes end when the buyer leaves. */}
            {route === 'cart' && <CartScreen data={data} onBack={goBack} />}
            {/* The order form's own page: Checkout leads here. */}
            {route === 'details' && <DetailsScreen data={data} onBack={goBackToCart} />}
            {/* Always home: the cart it came from is gone. */}
            {route === 'order-sent' && <ConfirmationScreen onBack={() => (window.location.hash = CATALOGUE_HASH)} />}
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
      </OrderFormProvider>
    </CartProvider>
  )
}
