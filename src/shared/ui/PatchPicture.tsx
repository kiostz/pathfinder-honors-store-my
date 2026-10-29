// The patch picture of an honor, or its category mark when there is none or it fails to load, so rows and cards never show a broken image.

import { useState } from 'react' // remembers a picture that failed
import type { Honor } from '@/shared/data/types.ts' // the shape of an honor
import { CategoryMark } from './CategoryMark.tsx' // the mark shown instead

/**
 * Shows the picture or the category mark in a 56 px box, or a 112 px box on a card.
 * @param honor the honor whose picture to show
 * @param size 'row' for the 56 px box (the default), 'card' for the 112 px box
 * @return the picture, or the mark when image is null or the picture failed
 */
export function PatchPicture({ honor, size = 'row' }: { honor: Honor; size?: 'row' | 'card' }) {
  const pixels = size === 'card' ? 112 : 56 // the box's side
  const [failedImage, setFailedImage] = useState<string | null>(null) // the picture path that failed to load
  if (honor.image === null || failedImage === honor.image) return <CategoryMark category={honor.category} size={size} /> // nothing to show or it broke
  return (
    // The name beside it is the label, so the picture is decoration.
    <img
      src={`${import.meta.env.BASE_URL}${honor.image}`} // the file under the site's base path
      alt="" // decoration, the name says it all
      width={pixels} // reserves the box so rows do not jump
      height={pixels} // same, vertical
      loading="lazy" // pictures below the screen load on scroll
      decoding="async" // decode off the main thread
      onError={() => setFailedImage(honor.image)} // 404 or offline: swap to the category mark
      className={`${size === 'card' ? 'size-28' : 'size-14'} shrink-0 object-contain`} // 112 or 56 px square, whole patch visible
    />
  )
}
