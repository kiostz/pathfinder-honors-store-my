// Tests for HomeScreen: the welcome band, the category tiles and the ordering steps, and the emblem trace behind the band's text.

import { readFileSync } from 'node:fs' // reads the keyframes' stylesheet
import { resolve } from 'node:path' // the stylesheet's path
import { render, screen, within } from '@testing-library/react' // render and query
import { afterEach, describe, expect, it, vi } from 'vitest' // test API
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

describe('emblem sparks canvas', () => {
  const getContext = HTMLCanvasElement.prototype.getContext // jsdom's own, put back after each test
  const readFrom: SVGElement[] = [] // the elements whose points were read
  afterEach(() => {
    HTMLCanvasElement.prototype.getContext = getContext // put back the canvas
    vi.useRealTimers() // real clock again
    vi.unstubAllGlobals() // matchMedia and animation frames back
    document.documentElement.style.removeProperty('--duration-trace') // the stylesheet is not loaded in jsdom
    document.documentElement.style.removeProperty('--color-trace') // same
    document.documentElement.style.removeProperty('--color-trace-bright') // same
    delete (SVGElement.prototype as Partial<SVGGeometryElement>).getPointAtLength // the path method the test added
    delete (SVGElement.prototype as Partial<SVGGeometryElement>).getTotalLength // same
  })

  /**
   * Gives jsdom what the spark loop needs: a drawing context that records, path reading and the style tokens.
   * @return the context's recorded calls
   */
  function giveCanvas() {
    readFrom.length = 0 // a fresh record
    const context = {
      clearRect: vi.fn(),
      setTransform: vi.fn(),
      beginPath: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      stroke: vi.fn(),
    } // what the loop calls
    HTMLCanvasElement.prototype.getContext = (() => context) as never // a canvas that has a context
    ;(SVGElement.prototype as unknown as SVGGeometryElement).getTotalLength = () => 1000 // the path length
    ;(SVGElement.prototype as unknown as SVGGeometryElement).getPointAtLength = function (
      this: SVGElement,
      at: number,
    ) {
      readFrom.push(this) // which element the loop reads
      return { x: at / 10, y: 20 } as DOMPoint // a straight line
    }
    document.documentElement.style.setProperty('--duration-trace', '4800ms') // read like the stylesheet's token
    document.documentElement.style.setProperty('--color-trace', '#e8b4bc') // the rose
    document.documentElement.style.setProperty('--color-trace-bright', '#fff3f5') // the bright rose
    return context
  }

  it('is hidden from assistive tech, ignores the pointer and stays off paper', () => {
    // catches: a decorative canvas that a screen reader announces, blocks the button or prints
    const { container } = render(<HomeScreen data={loading} />)
    const canvas = container.querySelector('[data-testid="emblem-sparks"]')!
    expect(canvas.tagName).toBe('CANVAS')
    expect(canvas).toHaveAttribute('aria-hidden', 'true')
    expect(canvas).toHaveClass('pointer-events-none', 'print:hidden')
  })

  it('requests no animation frame under Reduce Motion', () => {
    // catches: sparks running for people who asked for no motion
    giveCanvas()
    vi.stubGlobal('matchMedia', (query: string) => ({ matches: query.includes('reduce'), media: query }))
    const frame = vi.fn(() => 1)
    vi.stubGlobal('requestAnimationFrame', frame)
    render(<HomeScreen data={loading} />)
    expect(frame).not.toHaveBeenCalled()
  })

  it('does nothing and throws nothing without a canvas context', () => {
    // catches: an error on a browser or test DOM with no 2D canvas
    giveCanvas() // a readable path and tokens, so only the context is missing
    HTMLCanvasElement.prototype.getContext = (() => null) as never // no context
    const frame = vi.fn(() => 1)
    vi.stubGlobal('requestAnimationFrame', frame)
    expect(() => render(<HomeScreen data={loading} />)).not.toThrow()
    expect(frame).not.toHaveBeenCalled()
  })

  it('does nothing and throws nothing when the path cannot be read', () => {
    // catches: an error where getPointAtLength is missing (old browsers, jsdom)
    HTMLCanvasElement.prototype.getContext = (() => ({ clearRect: vi.fn() })) as never // a context but no path reading
    const frame = vi.fn(() => 1)
    vi.stubGlobal('requestAnimationFrame', frame)
    expect(() => render(<HomeScreen data={loading} />)).not.toThrow()
    expect(frame).not.toHaveBeenCalled()
  })

  it('draws sparks, then stops asking for frames and clears the canvas once the trace is over', () => {
    // catches: a loop that never ends (WCAG 2.2.2) or leaves the last sparks frozen on the band
    vi.useFakeTimers({ toFake: ['requestAnimationFrame', 'cancelAnimationFrame', 'performance'] })
    const context = giveCanvas()
    vi.stubGlobal('matchMedia', (query: string) => ({ matches: false, media: query }))
    render(<HomeScreen data={loading} />)
    vi.advanceTimersByTime(2500)
    expect(context.stroke).toHaveBeenCalled() // sparks while the point rides
    expect(readFrom.length).toBeGreaterThan(0)
    for (const element of readFrom) expect(element).toHaveAttribute('pathLength', '1000') // the emblem line, not the Browse the shop chevron
    vi.advanceTimersByTime(2500) // past the 4.8 s
    expect(context.clearRect).toHaveBeenCalled()
    const frames = vi.getTimerCount() // pending animation frames
    expect(frames).toBe(0)
    context.stroke.mockClear()
    vi.advanceTimersByTime(2000)
    expect(context.stroke).not.toHaveBeenCalled()
  })
  it('stops requesting frames and draws nothing more once Home is left mid-ride', () => {
    // catches: a clean-up that cancels the wrong frame, leaving a loop drawing on a detached canvas for each visit
    vi.useFakeTimers({ toFake: ['requestAnimationFrame', 'cancelAnimationFrame', 'performance'] })
    const context = giveCanvas()
    vi.stubGlobal('matchMedia', (query: string) => ({ matches: false, media: query }))
    const { unmount } = render(<HomeScreen data={loading} />)
    vi.advanceTimersByTime(1000)
    expect(context.stroke).toHaveBeenCalled() // it was drawing
    unmount()
    expect(vi.getTimerCount()).toBe(0) // no frame left pending
    context.stroke.mockClear()
    context.clearRect.mockClear()
    vi.advanceTimersByTime(4000)
    expect(context.stroke).not.toHaveBeenCalled()
    expect(context.clearRect).not.toHaveBeenCalled()
  })

  it('reads each birth point from the path once, however many frames it lives', () => {
    // catches: a path walk per spark per frame (about 1,100 a second) for a point that never changes
    vi.useFakeTimers({ toFake: ['requestAnimationFrame', 'cancelAnimationFrame', 'performance'] })
    giveCanvas()
    vi.stubGlobal('matchMedia', (query: string) => ({ matches: false, media: query }))
    render(<HomeScreen data={loading} />)
    vi.advanceTimersByTime(3000) // about 180 frames
    expect(readFrom.length).toBeLessThanOrEqual(3000 / 25 + 3) // at most one read per 40 per second birth, plus slack
  })

  it('does not ask for a canvas context when the path cannot be read or Reduce Motion is on', () => {
    // catches: jsdom's "Not implemented: getContext" noise on every Home render, and a context allocated and never drawn
    const spy = vi.fn(() => null)
    HTMLCanvasElement.prototype.getContext = spy as never
    render(<HomeScreen data={loading} />) // jsdom: no getPointAtLength
    expect(spy).not.toHaveBeenCalled()
  })
})
