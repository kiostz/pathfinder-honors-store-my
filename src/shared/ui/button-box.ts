// The shape of every pill button: a 44 px pill with side padding; each button adds its own colours.

export const ACTION_BOX =
  'focus-visible:outline-focus-ring rounded-pill inline-flex min-h-11 items-center justify-center font-medium transition-transform duration-(--duration-press) focus-visible:outline-2 focus-visible:outline-offset-2 active:scale-[0.97]' // 44 px pill action: press feedback and focus ring, colours and padding left to the caller

export const PILL_BOX =
  'rounded-pill inline-flex min-h-11 items-center justify-center px-6 font-medium' // the pill shape shared by the actions, colours left to the caller
