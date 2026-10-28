// The classes every order form field shares, so the inputs and the club select look alike and meet the 44 px tap target.

export const FIELD_BOX =
  'border-border-subtle bg-bg-app text-text-default focus-visible:outline-focus-ring aria-invalid:border-danger min-h-11 w-full rounded-md border px-3 text-base focus-visible:outline-2 focus-visible:outline-offset-2' // 16 px text stops iOS zooming; red border only with the error text under it
export const FIELD_LABEL = 'mb-1 block text-sm font-medium' // the label above a field
export const FIELD_ERROR = 'text-danger mt-1 text-sm' // the error text under a field
