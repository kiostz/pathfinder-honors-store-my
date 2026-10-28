// Tests for Catalogue: loading, error, empty and ready states and the grouped list, with fetch mocked at the boundary.

import { act, fireEvent, render, screen, within } from '@testing-library/react' // render and query the screen
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest' // test API and mocks
import { Catalogue } from './Catalogue.tsx' // code under test

/**
 * Builds one honor for the fake file.
 * @param name display name
 * @param category its category
 * @param enabled whether it is switched on
 * @return an honor shaped like honors.json
 */
function honor(name: string, category: string, enabled = true) {
  return {
    id: name.toLowerCase().replace(/\W+/g, '-'),
    name,
    category,
    skillLevel: null,
    issuedBy: 'General Conference',
    enabled,
    price: 4,
    image: null,
  } // image null: every row shows its category mark
}

/**
 * Makes the global fetch answer with honors and settings.
 * @param honors the body of honors.json
 */
function serve(honors: unknown) {
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: string) =>
      url.endsWith('settings.json')
        ? new Response(JSON.stringify({ currency: 'MYR', defaultPrice: 4 }))
        : new Response(JSON.stringify(honors)),
    ),
  ) // 200 for both files
}

beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true }) // control the 300 ms loader delay, keep promises moving
  vi.spyOn(console, 'error').mockImplementation(() => {}) // a failed load is logged; keep test output clean
})

afterEach(() => {
  vi.useRealTimers() // restore the clock
  vi.unstubAllGlobals() // restore fetch
  vi.restoreAllMocks() // restore console
})

describe('Catalogue', () => {
  it('lists one heading per category A to Z with honors A to Z inside', async () => {
    // catches: file order leaking into the list, or honors outside their category
    serve([
      honor('Swimming', 'Recreation'),
      honor('Leaves', 'Nature'),
      honor('Camping', 'Recreation'),
      honor('Ants', 'Nature'),
      honor('Basket Weaving', 'ADRA'),
    ])
    render(<Catalogue />)
    await screen.findByRole('heading', { name: 'ADRA' })
    expect(screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent)).toEqual([
      'ADRA',
      'Nature',
      'Recreation',
    ])
    const nature = within(screen.getByRole('region', { name: 'Nature' })) // each category block is named by its category
    expect(nature.getAllByRole('listitem').map((li) => li.textContent?.replace(/RM.*/, ''))).toEqual(['Ants', 'Leaves']) // names only, prices checked elsewhere
  })

  it('names a category block even when the category has spaces', async () => {
    // catches: a category block with no accessible name because its heading id held spaces
    serve([honor('Painting', 'Arts and Crafts')])
    render(<Catalogue />)
    expect(await screen.findByRole('region', { name: 'Arts and Crafts' })).toBeInTheDocument()
  })

  it('leaves out switched-off honors', async () => {
    // catches: hidden honors being orderable
    serve([honor('Knot Tying', 'Recreation'), honor('Secret Honor', 'Recreation', false)])
    render(<Catalogue />)
    expect(await screen.findByText('Knot Tying')).toBeInTheDocument()
    expect(screen.queryByText('Secret Honor')).not.toBeInTheDocument()
  })

  it('shows each honor name and its price', async () => {
    // catches: a missing or unformatted price
    serve([honor('Knot Tying', 'Recreation')])
    render(<Catalogue />)
    const row = (await screen.findByText('Knot Tying')).closest('li')!
    expect(row).toHaveTextContent(/RM\s?4\.00/)
  })

  it('counts the honors, singular for one', async () => {
    // catches: "1 honors" and a count that includes switched-off honors
    serve([honor('Knot Tying', 'Recreation'), honor('Off', 'Recreation', false)])
    render(<Catalogue />)
    expect(await screen.findByText('1 honor')).toBeInTheDocument()
  })

  it('counts 299 switched-on honors among 422', async () => {
    // catches: counting rows wrongly at full size
    serve(Array.from({ length: 422 }, (_, i) => honor(`Honor ${i}`, 'Nature', i < 299)))
    render(<Catalogue />)
    expect(await screen.findByText('299 honors')).toBeInTheDocument()
  })

  it('renders every row when every image is null', async () => {
    // catches: rows dropped or broken when no picture exists
    serve([honor('A', 'Nature'), honor('B', 'Nature'), honor('C', 'Nature')])
    render(<Catalogue />)
    await screen.findByText('A')
    expect(screen.getAllByRole('listitem')).toHaveLength(3)
    expect(screen.getAllByTestId('category-mark')).toHaveLength(3)
  })

  it('says so when no honor is switched on', async () => {
    // catches: a blank page when the list is empty
    serve([honor('Off', 'Nature', false)])
    render(<Catalogue />)
    expect(await screen.findByText('No honors are switched on yet. Check back soon.')).toBeInTheDocument()
  })

  it('shows nothing for 300 ms, then row-shaped skeletons', () => {
    // catches: a skeleton flash on fast loads
    vi.stubGlobal(
      'fetch',
      vi.fn(() => new Promise(() => {})),
    ) // requests that never answer
    render(<Catalogue />)
    expect(screen.queryByTestId('catalogue-skeleton')).not.toBeInTheDocument()
    act(() => {
      vi.advanceTimersByTime(300)
    })
    expect(screen.getByTestId('catalogue-skeleton').children).toHaveLength(6)
  })

  it('shows the error and Try again, and Try again shows the list', async () => {
    // catches: a dead end after a failed load
    const fetchFn = vi
      .fn()
      .mockRejectedValueOnce(new TypeError('Failed to fetch')) // honors fail first
      .mockResolvedValueOnce(new Response(JSON.stringify({ currency: 'MYR', defaultPrice: 4 }))) // settings of the first attempt
      .mockImplementation(async (url: string) =>
        url.endsWith('settings.json')
          ? new Response(JSON.stringify({ currency: 'MYR', defaultPrice: 4 }))
          : new Response(JSON.stringify([honor('Knot Tying', 'Recreation')])),
      ) // the retry succeeds
    vi.stubGlobal('fetch', fetchFn)
    render(<Catalogue />)
    expect(
      await screen.findByText("We couldn't load the honors. Check your connection and try again."),
    ).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }))
    expect(await screen.findByText('Knot Tying')).toBeInTheDocument()
  })
})
