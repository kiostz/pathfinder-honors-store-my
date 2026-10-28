// The patch picture of an honor, or its category mark when there is none or it fails to load, so rows never show a broken image.

import { useState } from 'react' // remembers a picture that failed
import type { Honor } from '@/shared/data/types.ts' // the shape of an honor
import { CategoryMark } from './CategoryMark.tsx' // the mark shown instead

/**
 * Shows the picture or the category mark in a 56 px box.
 * @param honor the honor whose picture to show
 * @return the picture, or the mark when image is null or the picture failed
 */
export function PatchPicture({ honor }: { honor: Honor }) {
  const [failedImage, setFailedImage] = useState<string | null>(null) // the picture path that failed to load
  if (honor.image === null || failedImage === honor.image) return <CategoryMark category={honor.category} /> // nothing to show or it broke
  return (
    // The name beside it is the label, so the picture is decoration.
    <img
      src={`${import.meta.env.BASE_URL}${honor.image}`} // the file under the site's base path
      alt="" // decoration, the name says it all
      width={56} // reserves the box so rows do not jump
      height={56} // same, vertical
      loading="lazy" // pictures below the screen load on scroll
      decoding="async" // decode off the main thread
      onError={() => setFailedImage(honor.image)} // 404 or offline: swap to the category mark
      className="size-14 shrink-0 object-contain" // 56 px square, whole patch visible
    />
  )
}
