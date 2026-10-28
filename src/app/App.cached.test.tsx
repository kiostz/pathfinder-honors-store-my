// Tests for App when the honors are already loaded at the first draw (a cached load), so the Unavailable notice cannot depend on a slow load.

import { fireEvent, render, screen } from '@testing-library/react' // render and query the page
import { afterEach, describe, expect, it, vi } from 'vitest' // test API and mocks
import { CART_STORAGE_KEY } from '@/features/cart/cart-storage.ts' // the stored cart's key
import { App } from './App.tsx' // code under test

// The one load answers at once, as a cache would: ready on the very first render.
vi.mock('@/features/catalogue/use-catalogue-data.ts', () => {
  const honor = (id: string, name: string, enabled: boolean) => ({
    id,
    name,
    category: 'Recreation',
    skillLevel: null,
    issuedBy: 'General Conference',
    enabled,
    price: 4,
    image: null,
  }) // one honor
  const loaded = {
    state: {
      status: 'ready',
      honors: [honor('knot-tying', 'Knot Tying', true), honor('africa-lore', 'Africa Lore', false)],
      settings: { currency: 'MYR', defaultPrice: 4 },
    },
    showSkeleton: false,
    retry: () => {},
  } // the same object every render
  return { useCatalogueData: () => loaded }
})

afterEach(() => {
  window.location.hash = '' // back to the catalogue address
})

describe('App with honors loaded at the first draw', () => {
  it('still shows the Unavailable notice when the cart is opened from the catalogue', async () => {
    // catches: the notice cleared on first mount of the catalogue, so a buyer is never told what was taken out
    window.localStorage.setItem(CART_STORAGE_KEY, '{"version":1,"quantities":{"knot-tying":1,"africa-lore":1}}') // a saved cart holding a switched-off honor
    render(<App />)
    fireEvent.click(screen.getByRole('link', { name: /View cart/ })) // open the cart
    expect(await screen.findByText(/Africa Lore is no longer available/)).toBeInTheDocument() // told once
  })
})
