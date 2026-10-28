// The club field: a native select styled by index.css (name, then a grey line of details) and the Club name field for "Other", so a buyer picks their club or types it.

import { createElement, useEffect, useRef } from 'react' // the selectedcontent element and the focus move
import type { ClubList } from '@/shared/data/types.ts' // the clubs
import { FIELD_BOX, FIELD_ERROR, FIELD_LABEL } from './field-box.ts' // the shared field look
import { clubDetails, OTHER_CLUB, type OrderField } from './order-form.ts' // the Other value and the grey line

/**
 * Draws the club select and, for Other or with no clubs, the Club name field.
 * @param clubs the clubs in file order; with none, only Club name shows
 * @param value the select's value: a club name, '' or OTHER_CLUB
 * @param otherValue the typed club name
 * @param error the select's error text, shown under it
 * @param otherError the Club name field's error text
 * @param onChange called with the select's new value
 * @param onOtherChange called with the typed club name
 * @param onBlur called with the field the buyer left
 * @return the select and the Club name field as the form needs them
 */
export function ClubSelect({
  clubs,
  value,
  otherValue,
  error,
  otherError,
  onChange,
  onOtherChange,
  onBlur,
}: {
  clubs: ClubList // the clubs in file order
  value: string // the select's value
  otherValue: string // the typed club name
  error?: string // the select's error
  otherError?: string // the Club name error
  onChange: (value: string) => void // the select changed
  onOtherChange: (value: string) => void // the Club name text changed
  onBlur: (field: OrderField) => void // a field was left
}) {
  const otherRef = useRef<HTMLInputElement>(null) // the Club name field, focused when the buyer picks Other
  const focusOther = useRef(false) // set by a pick of Other, so mounting already on Other does not steal focus
  const showOther = clubs.length === 0 || value === OTHER_CLUB // the field shows with no list, or for Other

  // After the pick of Other renders, move focus into the field it revealed; one tick later, because the browser hands focus back to the select as its popup closes.
  useEffect(() => {
    if (!focusOther.current || otherRef.current === null) return // only right after a pick
    const timer = setTimeout(() => {
      focusOther.current = false // once per pick; cleared here so a StrictMode rerun of this effect still focuses
      otherRef.current?.focus() // the buyer types the club name next
    }, 0) // after the popup has closed
    return () => clearTimeout(timer) // a rerun or unmount cancels it
  }, [value])

  return (
    <div>
      {/* No clubs in the file: no select at all. */}
      {clubs.length > 0 && (
        <>
          {/* The label the select is named by. */}
          <label htmlFor="order-club" className={FIELD_LABEL}>
            Club
          </label>
          <select
            id="order-club" // the label points here
            required // screen readers say it is required; the form's noValidate keeps the browser's own messages off
            value={value} // controlled by the form
            onChange={(event) => {
              // a pick in the select
              if (event.target.value === OTHER_CLUB) focusOther.current = true // the Club name field opens next
              onChange(event.target.value) // report the pick
            }}
            onBlur={() => onBlur('club')} // errors show once the select is left
            aria-invalid={error ? true : undefined} // red border with the error text
            aria-describedby={error ? 'order-club-error' : undefined} // read the error with the field
            className={`club-select ${FIELD_BOX}`} // index.css styles the popup where base-select is supported
          >
            {/* The closed control: the chosen option's content, cut to the name by index.css. */}
            <button type="button">{createElement('selectedcontent')}</button>
            {/* The empty choice a new buyer sees. */}
            <option value="">Choose your club</option>
            {/* One option per club: the name, a separator plain selects show, and the grey line. */}
            {clubs.map((club) => {
              const details = clubDetails(club) // null for a club with no details
              return (
                <option key={club.name} value={club.name}>
                  {/* The option's two-line layout, set by index.css. */}
                  <span className="club-option">
                    {/* The club's name, the only text the closed control shows. */}
                    <span className="club-name">{club.name}</span>
                    {/* Details only for a club that has some. */}
                    {details !== null && (
                      <>
                        {/* The separator shows only where base-select is off. */}
                        <span className="club-separator"> · </span>
                        {/* The grey line: area, language, location, church. */}
                        <span className="club-detail">{details}</span>
                      </>
                    )}
                  </span>
                </option>
              )
            })}
            {/* The last choice: a club that is not listed. */}
            <option value={OTHER_CLUB}>Other</option>
          </select>
          {/* The select's error, tied to it by aria-describedby. */}
          {error && (
            <p id="order-club-error" className={FIELD_ERROR}>
              {error}
            </p>
          )}
        </>
      )}
      {/* Other, or no list: the club is typed. */}
      {showOther && (
        <div className={clubs.length > 0 ? 'mt-3' : ''}>
          <label htmlFor="order-other-club" className={FIELD_LABEL}>
            Club name
          </label>
          <input
            ref={otherRef} // focused after a pick of Other
            id="order-other-club" // the label points here
            required // screen readers say it is required; the form's noValidate keeps the browser's own messages off
            type="text" // plain text
            value={otherValue} // controlled by the form
            maxLength={100} // the longest club name
            onChange={(event) => onOtherChange(event.target.value)} // report the typing
            onBlur={() => onBlur('otherClub')} // errors show once the field is left
            aria-invalid={otherError ? true : undefined} // red border with the error text
            aria-describedby={otherError ? 'order-other-club-error' : undefined} // read the error with the field
            className={FIELD_BOX} // the shared field look
          />
          {otherError && (
            <p id="order-other-club-error" className={FIELD_ERROR}>
              {otherError}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
