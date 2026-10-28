// Data shapes of the three files in public/data/, shared by the seed, the loaders and the admin.

// One honor a Pathfinder can order a patch for.
export type Honor = {
  // Slug of the name; never changes once created.
  id: string
  // Display name, e.g. "Knot Tying".
  name: string
  // Category it belongs to, e.g. "Nature".
  category: string
  // Skill level 1 to 3, or null when the source list gives none.
  skillLevel: 1 | 2 | 3 | null
  // Who issued it: "General Conference", ..., or "Club" for a club-added honor.
  issuedBy: string
  // True when switched on (shown in the catalogue).
  enabled: boolean
  // Price in Settings.currency.
  price: number
  // "patches/<id>.webp" relative to the base, or null until a patch picture exists.
  image: string | null
}

// The currency and default price, in settings.json.
export type Settings = {
  // ISO currency code, e.g. "MYR".
  currency: string
  // Price given to every honor at seed time.
  defaultPrice: number
}

// The club names offered in the order form, in clubs.json.
export type ClubList = string[]
