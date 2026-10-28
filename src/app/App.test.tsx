// Tests for App: the header and the catalogue under it, with fetch mocked at the boundary.

import { render, screen } from '@testing-library/react' // render and query the page
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
