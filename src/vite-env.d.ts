// Types for the Vite client and for the site's own environment variables, so a missing or misspelt key fails the type check.

/// <reference types="vite/client" />

// The variables the site reads, set in .env and .env.development.
interface ImportMetaEnv {
  // Web3Forms access key; public by design, it only emails the order handler.
  readonly VITE_WEB3FORMS_ACCESS_KEY: string // set in .env
  // hCaptcha sitekey: Web3Forms' shared key in .env, the always-passing test key in .env.development.
  readonly VITE_HCAPTCHA_SITEKEY: string // set in .env and .env.development
}
