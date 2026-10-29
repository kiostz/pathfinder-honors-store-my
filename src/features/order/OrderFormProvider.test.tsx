// Tests for OrderFormProvider: typing and leaving fields, and reset, which the success path uses to empty the form.

import { fireEvent, render, screen } from '@testing-library/react' // render and query
import { describe, expect, it } from 'vitest' // test API
import { CartProvider } from '@/features/cart/CartProvider.tsx' // the cart the provider watches
import { OrderFormProvider } from './OrderFormProvider.tsx' // code under test
import { useOrderForm } from './use-order-form.ts' // reads the form

/**
 * Shows the form state as text and offers buttons to change it.
 * @return the values, the touched fields and the buttons
 */
function Probe() {
  const { values, touched, setField, touch, touchAll, reset, failure, setFailure } = useOrderForm() // the form
  return (
    <>
      <p data-testid="failure">{failure?.text ?? 'none'}</p>
      <button onClick={() => setFailure({ text: 'Not sent' })}>fail</button>
      <p data-testid="values">{JSON.stringify(values)}</p>
      <p data-testid="touched">{JSON.stringify(touched)}</p>
      <button onClick={() => setField('name', 'Jo')}>type name</button>
      <button onClick={() => touch('email')}>leave email</button>
      <button onClick={touchAll}>press send</button>
      <button onClick={reset}>reset</button>
    </>
  )
}

describe('OrderFormProvider', () => {
  it('reset empties every value and hides every error', () => {
    // catches: a sent order's name and email staying in the form for the next buyer on a shared computer
    render(
      <CartProvider honors={null}>
        <OrderFormProvider>
          <Probe />
        </OrderFormProvider>
      </CartProvider>,
    )
    fireEvent.click(screen.getByText('type name'))
    fireEvent.click(screen.getByText('press send'))
    expect(screen.getByTestId('values')).toHaveTextContent('"name":"Jo"')
    expect(screen.getByTestId('touched')).toHaveTextContent('"email":true')
    fireEvent.click(screen.getByText('reset'))
    expect(screen.getByTestId('values')).toHaveTextContent('{"name":"","email":"","phone":"","club":"","otherClub":""}')
    expect(screen.getByTestId('touched')).toHaveTextContent('{}')
  })

  it('reset clears the failure alert, as a new order starts', () => {
    // catches: the last order's "not sent" alert showing above the next order
    render(
      <CartProvider honors={null}>
        <OrderFormProvider>
          <Probe />
        </OrderFormProvider>
      </CartProvider>,
    )
    fireEvent.click(screen.getByText('fail'))
    expect(screen.getByTestId('failure')).toHaveTextContent('Not sent')
    fireEvent.click(screen.getByText('reset'))
    expect(screen.getByTestId('failure')).toHaveTextContent('none')
  })
})
