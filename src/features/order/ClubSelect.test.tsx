// Tests for the club select: its options, the closed control's structure, the grey line and the Other field.

import { readFileSync } from 'node:fs' // reads index.css
import { resolve } from 'node:path' // the path to index.css
import { fireEvent, render, screen, waitFor } from '@testing-library/react' // render and query
import { describe, expect, it, vi } from 'vitest' // test API and mocks
import type { Club } from '@/shared/data/types.ts' // the club shape
import { ClubSelect } from './ClubSelect.tsx' // code under test
import { OTHER_CLUB } from './order-form.ts' // the Other value

const clubs: Club[] = [
  { name: 'Sunway Club', area: null, language: null, location: null, churchName: null },
  { name: 'Gilead Pathfinder Club', area: null, language: null, location: null, churchName: 'Klang BM SDA Church' },
] // Sunway has no grey line, Gilead has one

/**
 * Renders the select with defaults and some props changed.
 * @param props the props to override
 * @return the change, other-change and blur spies
 */
function renderSelect(props: Partial<Parameters<typeof ClubSelect>[0]> = {}) {
  const onChange = vi.fn() // reports the select's value
  const onOtherChange = vi.fn() // reports the Club name text
  const onBlur = vi.fn() // reports the field left
  render(
    <ClubSelect
      clubs={clubs}
      value=""
      otherValue=""
      onChange={onChange}
      onOtherChange={onOtherChange}
      onBlur={onBlur}
      {...props}
    />,
  )
  return { onChange, onOtherChange, onBlur }
}

describe('ClubSelect', () => {
  it('logs nothing while rendering the select with its button and element children', () => {
    // first in the file, because React warns once per tag and an earlier render would use up the warning
    // catches: a React nesting or unknown-tag warning that src/test/setup.ts would otherwise hide or let slip
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {}) // the warnings React would print
    try {
      renderSelect({ value: 'Gilead Pathfinder Club' })
      expect(consoleError).not.toHaveBeenCalled()
    } finally {
      consoleError.mockRestore() // later tests print normally, even when this one fails
    }
  })

  it('lists Choose your club, the clubs in file order, then Other', () => {
    // catches: clubs re-sorted, or the placeholder or Other in the wrong place
    renderSelect()
    const options = Array.from(screen.getByRole('combobox', { name: 'Club' }).querySelectorAll('option'))
    expect(options[0].textContent).toBe('Choose your club')
    expect(options.slice(1, -1).map((option) => option.querySelector('.club-name')?.textContent)).toEqual([
      'Sunway Club',
      'Gilead Pathfinder Club',
    ])
    expect(options[options.length - 1].textContent).toBe('Other')
  })

  it('has no label attribute, which would hide the grey line in Chrome', () => {
    // catches: a label attribute on an option replacing its two-line content
    renderSelect()
    for (const option of screen.getByRole('combobox', { name: 'Club' }).querySelectorAll('option'))
      expect(option).not.toHaveAttribute('label')
  })

  it('opens with the button and selectedcontent that keep the closed control to the name', () => {
    // catches: no selectedcontent child, so the closed control would copy the whole option
    renderSelect({ value: 'Gilead Pathfinder Club' })
    const first = screen.getByRole('combobox', { name: 'Club' }).firstElementChild
    expect(first?.tagName).toBe('BUTTON')
    expect(first?.querySelector('selectedcontent')).not.toBeNull()
  })

  it('gives Gilead a grey line with a separator and Sunway none', () => {
    // catches: a missing grey line, or an empty one for a club with no details
    renderSelect()
    const options = Array.from(screen.getByRole('combobox', { name: 'Club' }).querySelectorAll('option'))
    expect(options[2].querySelector('.club-detail')?.textContent).toBe('Klang BM SDA Church')
    expect(options[2].textContent).toBe('Gilead Pathfinder Club · Klang BM SDA Church') // what a plain select shows
    expect(options[1].querySelector('.club-detail')).toBeNull()
    expect(options[1].textContent).toBe('Sunway Club')
  })

  it('reports the club name when a club is picked', () => {
    // catches: the value being an index or a label instead of the name
    const { onChange } = renderSelect()
    fireEvent.change(screen.getByRole('combobox', { name: 'Club' }), { target: { value: 'Gilead Pathfinder Club' } })
    expect(onChange).toHaveBeenCalledWith('Gilead Pathfinder Club')
  })

  it('shows the Club name field and focuses it when the buyer chooses Other', async () => {
    // catches: Other chosen but the field hidden or unfocused
    const { rerender } = render(
      <ClubSelect
        clubs={clubs}
        value=""
        otherValue=""
        onChange={() => {}}
        onOtherChange={() => {}}
        onBlur={() => {}}
      />,
    )
    expect(screen.queryByLabelText('Club name')).not.toBeInTheDocument()
    fireEvent.change(screen.getByRole('combobox', { name: 'Club' }), { target: { value: OTHER_CLUB } }) // the buyer picks Other
    rerender(
      <ClubSelect
        clubs={clubs}
        value={OTHER_CLUB}
        otherValue=""
        onChange={() => {}}
        onOtherChange={() => {}}
        onBlur={() => {}}
      />,
    )
    await waitFor(() => expect(screen.getByLabelText('Club name')).toHaveFocus()) // one tick later, after the popup closes
  })

  it('does not steal focus when it mounts already on Other', async () => {
    // catches: the heading's focus taken by the Club name field when the buyer returns to the cart
    renderSelect({ value: OTHER_CLUB })
    await new Promise((resolve) => setTimeout(resolve, 10)) // past the tick a pick would use
    expect(screen.getByLabelText('Club name')).not.toHaveFocus()
  })

  it('shows only Club name when there are no clubs', () => {
    // catches: an empty dropdown with only Other in it
    renderSelect({ clubs: [] })
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument()
    expect(screen.getByLabelText('Club name')).toBeInTheDocument()
  })

  it('reports blur of the select and of the Club name field, and shows their errors', () => {
    // catches: errors that never show because blur is not reported
    const { onBlur } = renderSelect({
      value: OTHER_CLUB,
      error: 'Choose your club.',
      otherError: 'Enter your club name, up to 100 characters.',
    })
    fireEvent.blur(screen.getByRole('combobox', { name: 'Club' }))
    fireEvent.blur(screen.getByLabelText('Club name'))
    expect(onBlur).toHaveBeenCalledWith('club')
    expect(onBlur).toHaveBeenCalledWith('otherClub')
    expect(screen.getByText('Choose your club.')).toBeInTheDocument()
    expect(screen.getByText('Enter your club name, up to 100 characters.')).toBeInTheDocument()
  })

  it('gives the closed control\'s inner button a 44 px target', () => {
    // catches: the "Choose your club" part shrinking to its 24 px text line, so only a strip of the 44 px select takes a tap; jsdom cannot cascade the stylesheet's nested rules or lay out base-select, so this reads the rule's text and the browser check measures the real size
    const css = readFileSync(resolve(process.cwd(), 'src/styles/index.css'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '') // the stylesheet without comments
    const rule = /\.club-select > button \{([^}]*)\}/.exec(css)?.[1] ?? '' // the inner button's declarations
    expect(rule).toMatch(/min-height:\s*calc\(2\.75rem - 2px\)/) // the select's 44 px box less its 1 px borders
  })
})
