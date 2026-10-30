// Tests for HomeScreen: the welcome band, the category tiles and the ordering steps, and the emblem trace behind the band's text.

import { readFileSync } from 'node:fs' // reads the keyframes' stylesheet
import { resolve } from 'node:path' // the stylesheet's path
import { render, screen, within } from '@testing-library/react' // render and query
import { describe, expect, it } from 'vitest' // test API
import type { CatalogueLoad } from '@/features/catalogue/use-catalogue-data.ts' // the load Home receives
import { HomeScreen } from './HomeScreen.tsx' // code under test

const loading = { state: { status: 'loading' }, showSkeleton: false, retry: () => {} } as CatalogueLoad // nothing loaded yet: the band and steps do not wait

describe('HomeScreen', () => {
  it('shows the headline and line as written', () => {
    // catches: copy drifting from the approved wording
    render(<HomeScreen data={loading} />)
    expect(
      screen.getByRole('heading', { level: 2, name: 'Everything your club needs, in one order' }),
    ).toBeInTheDocument()
    expect(
      screen.getByText("Pick the items, send your details, and we'll email your invoice once we've checked it."),
    ).toBeInTheDocument()
  })

  it('has one Browse the shop link to #/shop whose name has no chevron', () => {
    // catches: the decorative > leaking into the accessible name, or a wrong address
    render(<HomeScreen data={loading} />)
    const links = screen.getAllByRole('link', { name: 'Browse the shop' })
    expect(links).toHaveLength(1)
    expect(links[0]).toHaveAttribute('href', '#/shop')
  })

  it('lists the three steps in an ordered list, in order', () => {
    // catches: steps out of order or not a list
    render(<HomeScreen data={loading} />)
    const steps = within(screen.getByRole('list')).getAllByRole('listitem')
    expect(steps.map((step) => step.textContent)).toEqual([
      '1Pick your itemsAdd what your club needs to the cart.',
      '2Send your detailsName, email, phone and club. No payment yet.',
      '3Get your invoiceWe check the order and email the final total.',
    ])
    expect(screen.getByRole('list').tagName).toBe('OL')
    expect(screen.getByRole('heading', { name: 'Shop by category' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'How ordering works' })).toBeInTheDocument()
  })

  it('has no search box', () => {
    // catches: the catalogue toolbar leaking onto Home
    render(<HomeScreen data={loading} />)
    expect(screen.queryByRole('searchbox')).not.toBeInTheDocument()
  })

  it('draws the emblem as a hidden, unfocusable drawing with one path of length 1000 and no letters', () => {
    // catches: a drawing that reads aloud, takes focus, holds text or covers the button
    const { container } = render(<HomeScreen data={loading} />)
    const trace = container.querySelector('[data-testid="emblem-trace"]')!
    expect(trace).toHaveAttribute('aria-hidden', 'true')
    expect(trace.querySelector('text')).toBeNull()
    expect(trace.querySelector('a, button, [tabindex]')).toBeNull()
    expect(trace).toHaveClass('pointer-events-none', 'print:hidden')
    expect(trace.querySelector('path[pathLength="1000"]')).not.toBeNull()
    expect(screen.getByRole('link', { name: 'Browse the shop' })).toBeInTheDocument()
  })
})

describe('HomeScreen layout', () => {
  it('feeds the rider the same path the lines draw', () => {
    // catches: a path swap that edits one copy and leaves the point riding the old outline
    const { container } = render(<HomeScreen data={loading} />)
    const trace = container.querySelector('[data-testid="emblem-trace"]')!
    const d = trace.querySelector('path')!.getAttribute('d')
    const rider = trace.querySelector('.trace-rider') as SVGElement
    expect(rider.style.getPropertyValue('--emblem-path')).toBe(`path('${d}')`)
  })

  it('keeps the drawing in the flow under the text on a phone and behind it from 640 px', () => {
    // catches: the drawing sitting under the headline at 375, where the bright head makes the letters unreadable
    const { container } = render(<HomeScreen data={loading} />)
    const trace = container.querySelector('[data-testid="emblem-trace"]')!
    expect(trace.getAttribute('class')).toContain('sm:absolute')
    expect(trace.getAttribute('class')).not.toMatch(/(^|\s)absolute(\s|$)/)
    const text = screen.getByRole('heading', { level: 2, name: /Everything your club/ }).parentElement!
    expect(text.compareDocumentPosition(trace) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy() // after the text in the flow
  })

  it('draws the resting outline clearly: a 2 px stroke at 0.55 opacity, the same for Reduce Motion', () => {
    // catches: an outline so faint (1.2 px at 0.3) that nothing is left once the trace has played
    const { container } = render(<HomeScreen data={loading} />)
    const build = container.querySelector('[data-testid="emblem-trace"] .trace-build')!
    expect(build.getAttribute('stroke-width')).toBe('2')
    expect(build.getAttribute('stroke-opacity')).toBe('0.55')
  })

  it('stops the text column short of the drawing from 640 px, so no letter ever sits over the outline', () => {
    // catches: text over the 0.55 outline, where stone on the blended band falls to 3.8:1
    render(<HomeScreen data={loading} />)
    const text = screen.getByRole('heading', { level: 2, name: /Everything your club/ }).parentElement!
    expect(text.className).toContain('sm:max-w-[min(36rem,calc(100%-12rem))]')
  })

  it('prints the headline and Browse the shop, hiding only the drawing', () => {
    // catches: the whole band vanishing from paper
    const { container } = render(<HomeScreen data={loading} />)
    const band = screen.getByRole('heading', { level: 2, name: /Everything your club/ }).closest('section')!
    expect(band).not.toHaveClass('print:hidden')
    expect(band).toHaveClass('print:bg-transparent', 'print:text-text-default') // as the header, so stone text never lands on white paper
    expect(container.querySelector('[data-testid="emblem-trace"]')).toHaveClass('print:hidden')
  })
})

describe('emblem trace styles', () => {
  const css = readFileSync(resolve(process.cwd(), 'src/styles/index.css'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '') // without comments

  it('never repeats a trace keyframe animation', () => {
    // catches: a loop coming back (WCAG 2.2.2)
    const rules = css.match(/\.trace-[a-z0-9-]+\s*\{[^}]*\}/g) ?? []
    expect(rules.length).toBeGreaterThan(0)
    for (const rule of rules) expect(rule).not.toMatch(/infinite/)
  })
})
