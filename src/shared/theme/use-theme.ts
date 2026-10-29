// The theme the page shows: the buyer's pick, kept on <html> so every user of the hook sees one value, and the light or dark it resolves to.

import { useSyncExternalStore } from 'react' // subscribes to the pick and to the system setting
import {
  readThemeChoice,
  saveThemeChoice,
  type ThemeChoice,
} from './theme-storage.ts' // the saved pick

const DARK_QUERY = '(prefers-color-scheme: dark)' // the same switch the CSS uses for System
const pickListeners = new Set<() => void>() // components waiting for a pick to change
let systemPicked = false // true once the buyer picked System on this page, so a failed save cannot bring an older saved pick back

/**
 * Tells React when the pick changes.
 * @param onChange called on every change
 * @return the function that stops listening
 */
function subscribeToPick(onChange: () => void): () => void {
  pickListeners.add(onChange) // start listening
  return () => void pickListeners.delete(onChange) // stop on unmount
}

/**
 * Reads the pick: the attribute on <html> when it names Light or Dark, then a System pick made on this page, otherwise the saved pick.
 * @return the current choice
 */
function getChoice(): ThemeChoice {
  const attribute = document.documentElement.dataset.theme // set by the inline script or by setChoice
  return attribute === 'light' || attribute === 'dark'
    ? attribute // a pick on the page
    : systemPicked
      ? 'system' // picked here, whatever storage still says
      : readThemeChoice() // System has no attribute
}

/**
 * Tells React when the system colour scheme changes.
 * @param onChange called on every change
 * @return the function that stops listening
 */
function subscribeToSystem(onChange: () => void): () => void {
  const query = window.matchMedia(DARK_QUERY) // the live query
  query.addEventListener('change', onChange) // light and dark switches
  return () => query.removeEventListener('change', onChange) // stop on unmount
}

/**
 * Sets a pick on the page and saves it.
 * @param choice Light or Dark set the attribute on <html>; System removes it
 */
function setChoice(choice: ThemeChoice): void {
  systemPicked = choice === 'system' // remembered in memory, not only in storage
  if (choice === 'system')
    delete document.documentElement.dataset.theme // the CSS then follows the system
  else document.documentElement.dataset.theme = choice // the CSS tokens switch
  saveThemeChoice(choice) // remembered on this device
  pickListeners.forEach((listener) => listener()) // every user of the hook redraws
}

/**
 * The buyer's theme pick and what it resolves to.
 * @return choice (System, Light or Dark), setChoice, and resolved ('light' or 'dark', following the system while the choice is System)
 */
export function useTheme(): {
  choice: ThemeChoice
  setChoice: (choice: ThemeChoice) => void
  resolved: 'light' | 'dark'
} {
  const choice = useSyncExternalStore(subscribeToPick, getChoice) // the pick
  const systemDark = useSyncExternalStore(
    subscribeToSystem,
    () => window.matchMedia(DARK_QUERY).matches,
  ) // the system setting
  return {
    choice, // the pick
    setChoice, // how to change it
    resolved: choice === 'system' ? (systemDark ? 'dark' : 'light') : choice, // System follows the system
  } // a pick beats the system
}
