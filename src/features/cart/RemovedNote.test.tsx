// Tests for the Removed note: the Undo, the 5 s hold, the pause while the pointer or focus is on it, and focus on arrival.

import { act, fireEvent, render, screen } from '@testing-library/react' // render and query
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest' // test API and mocks
import { RemovedNote } from './RemovedNote.tsx' // code under test

beforeEach(() => {
  vi.useFakeTimers() // the 5 s hold runs on a fake clock
})
afterEach(() => {
  vi.useRealTimers() // back to the real clock
})

describe('RemovedNote', () => {
  it('shows the name with Undo, and Undo calls onUndo', () => {
    // catches: a note without a named Undo, or an Undo that does nothing
    const onUndo = vi.fn()
    render(<RemovedNote name="Knot Tying" label="Knot Tying" onUndo={onUndo} onEnd={() => {}} takeFocus={false} />)
    expect(screen.getByText('Knot Tying removed')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Undo removing Knot Tying' }))
    expect(onUndo).toHaveBeenCalledTimes(1)
  })

  it('calls onEnd after 5 s and not before', () => {
    // catches: a note that never ends, or ends early
    const onEnd = vi.fn()
    render(<RemovedNote name="Knot Tying" label="Knot Tying" onUndo={() => {}} onEnd={onEnd} takeFocus={false} />)
    act(() => void vi.advanceTimersByTime(4999))
    expect(onEnd).not.toHaveBeenCalled()
    act(() => void vi.advanceTimersByTime(1))
    expect(onEnd).toHaveBeenCalledTimes(1)
  })

  it('pauses while the pointer is over it and restarts at 5 s when it leaves', () => {
    // catches: a timeout the buyer cannot stop (WCAG 2.2.1) or one that resumes where it stopped
    const onEnd = vi.fn()
    render(<RemovedNote name="Knot Tying" label="Knot Tying" onUndo={() => {}} onEnd={onEnd} takeFocus={false} />)
    const note = screen.getByTestId('removed-note')
    act(() => void vi.advanceTimersByTime(3000))
    fireEvent.mouseEnter(note)
    act(() => void vi.advanceTimersByTime(60000))
    expect(onEnd).not.toHaveBeenCalled()
    fireEvent.mouseLeave(note)
    act(() => void vi.advanceTimersByTime(4999))
    expect(onEnd).not.toHaveBeenCalled()
    act(() => void vi.advanceTimersByTime(1))
    expect(onEnd).toHaveBeenCalledTimes(1)
  })

  it('pauses while focus is inside it and restarts at 5 s when focus leaves', () => {
    // catches: a note that ends under a keyboard user's focus
    const onEnd = vi.fn()
    render(<RemovedNote name="Knot Tying" label="Knot Tying" onUndo={() => {}} onEnd={onEnd} takeFocus={false} />)
    const undo = screen.getByRole('button', { name: 'Undo removing Knot Tying' })
    act(() => undo.focus())
    act(() => void vi.advanceTimersByTime(60000))
    expect(onEnd).not.toHaveBeenCalled()
    act(() => undo.blur())
    act(() => void vi.advanceTimersByTime(5000))
    expect(onEnd).toHaveBeenCalledTimes(1)
  })

  it('takes focus onto Undo when takeFocus is true, and not otherwise', () => {
    // catches: a keyboard removal that strands focus on the page, or a pointer removal that steals it
    const first = render(
      <RemovedNote name="Knot Tying" label="Knot Tying" onUndo={() => {}} onEnd={() => {}} takeFocus />,
    )
    expect(screen.getByRole('button', { name: 'Undo removing Knot Tying' })).toHaveFocus()
    first.unmount()
    render(<RemovedNote name="Knot Tying" label="Knot Tying" onUndo={() => {}} onEnd={() => {}} takeFocus={false} />)
    expect(screen.getByRole('button', { name: 'Undo removing Knot Tying' })).not.toHaveFocus()
  })
})
