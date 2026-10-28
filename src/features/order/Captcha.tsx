// The hCaptcha widget behind one small interface, so the form depends on a token and a reset and tests can stand in for the widget.

import HCaptcha from '@hcaptcha/react-hcaptcha' // the official React widget
import { useImperativeHandle, useRef, useSyncExternalStore, type Ref } from 'react' // the reset handle and the theme follow

// What the form can ask of the widget.
export type CaptchaHandle = { reset: () => void }

const DARK_QUERY = '(prefers-color-scheme: dark)' // the same switch the site's dark colours use

/**
 * Tells React when the system colour scheme changes.
 * @param onChange called on every change
 * @return the function that stops listening
 */
function subscribeToScheme(onChange: () => void): () => void {
  const query = window.matchMedia(DARK_QUERY) // the live query
  query.addEventListener('change', onChange) // light and dark switches
  return () => query.removeEventListener('change', onChange) // stop on unmount
}

/**
 * Draws the captcha in the site's light or dark theme.
 * @param onToken called with the token when solved, and with null when it expires or fails
 * @param ref gives the form `reset()`, which clears the widget so it can be ticked again
 * @return the widget
 */
export function Captcha({ onToken, ref }: { onToken: (token: string | null) => void; ref?: Ref<CaptchaHandle> }) {
  const widget = useRef<HCaptcha>(null) // the package's own handle
  const dark = useSyncExternalStore(subscribeToScheme, () => window.matchMedia(DARK_QUERY).matches) // follows the system scheme
  useImperativeHandle(ref, () => ({ reset: () => widget.current?.resetCaptcha() }), []) // the one thing the form needs
  return (
    <HCaptcha
      ref={widget} // for reset
      sitekey={import.meta.env.VITE_HCAPTCHA_SITEKEY} // set per mode in the env files
      theme={dark ? 'dark' : 'light'} // matches the page
      onVerify={(token) => onToken(token)} // solved
      onExpire={() => onToken(null)} // the token ran out, so Send is incomplete again
      onError={() => onToken(null)} // the widget failed, so there is no token
    />
  )
}
