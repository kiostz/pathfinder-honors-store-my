// Tests for App: the header and the catalogue under it, with fetch mocked at the boundary.

import { fireEvent, render, screen } from '@testing-library/react' // render and query the page
import { afterEach, describe, expect, it, vi } from 'vitest' // test API and mocks
import { App } from './App.tsx' // code under test

afterEach(() => {
  vi.unstubAllGlobals() // restore fetch
})

describe('App', () => {
  it('shows the header and the catalogue', async () => {
    // catches: the shell rendering without the catalogue, or without its header
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string) =>
        url.endsWith('settings.json')
          ? new Response(JSON.stringify({ currency: 'MYR', defaultPrice: 4 }))
          : new Response(
              JSON.stringify([
                {
                  id: 'knot-tying',
                  name: 'Knot Tying',
                  category: 'Recreation',
                  skillLevel: null,
                  issuedBy: 'General Conference',
                  enabled: true,
                  price: 4,
                  image: null,
                },
              ]),
            ),
      ),
    ) // one honor
    render(<App />)
    expect(screen.getByRole('heading', { name: 'Pathfinder Honors' })).toBeInTheDocument()
    expect(await screen.findByText('Knot Tying')).toBeInTheDocument()
  })

  it('updates the cart bar when + is pressed on a row', async () => {
    // catches: steppers and bar holding separate state, or a bar that never appears
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string) =>
        url.endsWith('settings.json')
          ? new Response(JSON.stringify({ currency: 'MYR', defaultPrice: 4 }))
          : new Response(
              JSON.stringify([
                {
                  id: 'knot-tying',
                  name: 'Knot Tying',
                  category: 'Recreation',
                  skillLevel: null,
                  issuedBy: 'General Conference',
                  enabled: true,
                  price: 4,
                  image: null,
                },
              ]),
            ),
      ),
    ) // one honor at RM 4
    render(<App />)
    fireEvent.click(await screen.findByRole('button', { name: 'One more Knot Tying' }))
    fireEvent.click(screen.getByRole('button', { name: 'One more Knot Tying' }))
    expect(screen.getByTestId('cart-bar')).not.toHaveAttribute('inert')
    expect(screen.getByTestId('cart-bar')).toHaveTextContent('2 items')
    expect(screen.getByTestId('cart-bar')).toHaveTextContent(/Estimated total RM\s?8\.00/)
  })

  it('shows no cart bar when the load fails', async () => {
    // catches: a bar over an error screen
    vi.spyOn(console, 'error').mockImplementation(() => {}) // the failed load is logged
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('nope', { status: 500 })),
    ) // every file fails
    render(<App />)
    await screen.findByRole('button', { name: 'Try again' })
    expect(screen.queryByTestId('cart-bar')).not.toBeInTheDocument()
    vi.restoreAllMocks() // put console back
  })

  it('has no footer', async () => {
    // catches: a wiki credit footer coming back
    vi.stubGlobal(
      'fetch',
      vi.fn(() => new Promise(() => {})),
    ) // never answers; the shell alone is checked
    render(<App />)
    expect(screen.queryByRole('contentinfo')).not.toBeInTheDocument()
  })
})
