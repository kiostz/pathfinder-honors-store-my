// Tests for useHashRoute: which screen the address hash names, so the cart screen has a link-able address.

import { act, renderHook } from '@testing-library/react' // run the hook
import { afterEach, describe, expect, it } from 'vitest' // test API
import { useHashRoute } from './use-hash-route.ts' // code under test

afterEach(() => {
  window.location.hash = '' // leave the address as found
})

describe('useHashRoute', () => {
  it('names the cart for #/cart', () => {
    // catches: the cart address not opening the cart
    window.location.hash = '#/cart'
    const { result } = renderHook(() => useHashRoute())
    expect(result.current).toBe('cart')
  })

  it.each(['', '#/', '#/admin', '#/cart/x'])(
    'names the catalogue for "%s"',
    (hash) => {
      // catches: an unknown or longer address opening the cart instead of the catalogue
      window.location.hash = hash
      const { result } = renderHook(() => useHashRoute())
      expect(result.current).toBe('catalogue')
    },
  )

  it('follows hashchange', () => {
    // catches: a screen that is stuck on the address it first saw
    const { result } = renderHook(() => useHashRoute())
    expect(result.current).toBe('catalogue')
    act(() => {
      window.location.hash = '#/cart' // the buyer opens the cart
      window.dispatchEvent(new HashChangeEvent('hashchange')) // jsdom fires its own later; this makes it synchronous
    })
    expect(result.current).toBe('cart')
    act(() => {
      window.location.hash = '#/' // the buyer goes back to the catalogue
      window.dispatchEvent(new HashChangeEvent('hashchange')) // synchronous, as above
    })
    expect(result.current).toBe('catalogue')
  })
})
