// The site header band: the big name and theme control on the catalogue, the < button and small name on inner screens, so every screen shares one frame.

import { ThemeControl } from '@/shared/theme/ThemeControl.tsx' // System, Light or Dark
import { BackButton } from '@/shared/ui/BackButton.tsx' // the < button of inner screens
import { useOrderForm } from '@/features/order/use-order-form.ts' // whether a send is running

/**
 * Draws the header band.
 * @param siteTitle the site's name
 * @param onCatalogue true on the catalogue: big name and theme control; false: < button and small name
 * @param backHref the address the < button leads to
 * @param onBack called by the < button
 * @return the band; its < button is frozen while an order sends
 */
export function AppHeader({
  siteTitle, // the name drawn big or small
  onCatalogue, // which of the two headers
  backHref, // the < button's address
  onBack, // the < button's click
}: {
  siteTitle: string // the site's name
  onCatalogue: boolean // true on the catalogue
  backHref: string // where the < button leads
  onBack: () => void // called on the < button's click
}) {
  const { sending } = useOrderForm() // an order is being sent: leaving waits
  return (
    // The oxblood band, in the same 1,200 px column as the page.
    // On paper the band drops its fill and takes ink, so the name prints even when the browser leaves backgrounds out.
    <header className="bg-header text-on-header print:text-text-default print:bg-transparent">
      <div className="mx-auto flex max-w-300 items-center justify-between gap-3 px-4 py-3">
        {onCatalogue ? (
          <>
            <h1 className="sm:text-title text-xl font-bold">{siteTitle}</h1> {/* big */}
            {/* Wrapper so the control, whatever it draws, stays off paper. */}
            <div className="print:hidden">
              <ThemeControl /> {/* only here, never on paper */}
            </div>
          </>
        ) : (
          <>
            <div inert={sending} className="flex shrink-0 print:hidden">
              <BackButton href={backHref} onBack={onBack} /> {/* frozen while sending */}
            </div>
            <h1 className="flex-1 text-sm font-medium">{siteTitle}</h1> {/* small, above the page title below */}
          </>
        )}
      </div>
    </header>
  )
}
