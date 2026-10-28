// The one place the patch picture path rule lives, shared by the import script, the data test and the admin.

/**
 * Gives the path of an honor's patch picture, relative to the site base.
 * @param id the honor id
 * @return `patches/<id>.webp`
 */
export function patchImagePath(id: string): string {
  return `patches/${id}.webp` // glossary path of a patch picture
}
