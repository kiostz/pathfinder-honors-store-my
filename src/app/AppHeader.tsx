// The site header band: one 44 px, title, 44 px grid on every screen, so the title stays centred whether the < button, the theme button or neither sits beside it.

import { ThemeControl } from '@/shared/theme/ThemeControl.tsx' // the sun or moon button
import { BackButton } from '@/shared/ui/BackButton.tsx' // the < button of inner screens
import { useOrderForm } from '@/features/order/use-order-form.ts' // whether a send is running

/**
 * Draws the header band.
 * @param siteTitle the site's name
 * @param variant 'home': big name and theme button; 'shop': small name over "Shop" and the theme button; 'inner': < button and small name
 * @param backHref the address the < button leads to
 * @param onBack called by the < button
 * @return the band; its < button is frozen while an order sends
 */
export function AppHeader({
  siteTitle, // the name drawn big or small
  variant, // which of the three headers
  backHref, // the < button's address
  onBack, // the < button's click
}: {
  siteTitle: string // the site's name
  variant: 'home' | 'shop' | 'inner' // which header to draw
  backHref: string // where the < button leads
  onBack: () => void // called on the < button's click
}) {
  const { sending } = useOrderForm() // an order is being sent: leaving waits
  const inner = variant === 'inner' // the < button shows here only
  return (
    // The oxblood band, in the same 1,200 px column as the page.
    // On paper the band drops its fill and takes ink, so the name prints even when the browser leaves backgrounds out.
    <header className="bg-header text-on-header print:text-text-default print:bg-transparent">
      {/* Both side slots are 44 px, so the middle one is truly centred. */}
      <div className="mx-auto grid max-w-300 grid-cols-[2.75rem_minmax(0,1fr)_2.75rem] items-center gap-2 px-4 py-3">
        {inner ? (
          <div inert={sending} className="flex print:hidden">
            <BackButton href={backHref} onBack={onBack} /> {/* frozen while sending */}
          </div>
        ) : (
          <span /> // an empty left slot keeps the title centred
        )}
        <div className="text-center">
          {variant === 'home' ? (
            <h1 className="sm:text-title min-[400px]:text-xl text-lg font-bold text-balance">{siteTitle}</h1> // big: 18 px under 400 px so the long name stays on one line, balanced when it must wrap
          ) : (
            <h1 className="text-sm font-medium">{siteTitle}</h1> // small, above the page title below
          )}
          {variant === 'shop' && <h2 className="text-base font-bold">Shop</h2> /* the screen's own title */}
        </div>
        {inner ? (
          <span /> // no theme button on inner screens
        ) : (
          // Wrapper so the button, whatever it draws, stays off paper.
          <div className="flex justify-end print:hidden">
            <ThemeControl /> {/* Home and Shop */}
          </div>
        )}
      </div>
    </header>
  )
}
