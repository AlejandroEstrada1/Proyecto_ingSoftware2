import { render, screen } from "@testing-library/react"
import Cart from "../componentes/Cart.jsx"
import CheckoutButton from "../componentes/CheckoutButton.jsx"

describe("Cart", () => {
  it("muestra carrito vacío cuando no hay ítems", () => {
    render(
      <Cart
        items={[]}
        subtotal={0}
        emptyLabel="Carrito vacío."
        onQuantityChange={jest.fn()}
        onDelete={jest.fn()}
        footer={<CheckoutButton disabled onClick={jest.fn()}>Pagar</CheckoutButton>}
      />
    )

    expect(screen.getByText("Carrito vacío.")).toBeInTheDocument()
    expect(screen.getByTestId("cart-total")).toHaveTextContent("0,00 €")
  })

  it("lista ítems y muestra el subtotal correcto", () => {
    const items = [
      {
        id: 1,
        nombre: "A",
        unitPrice: 10,
        quantity: 2,
        stockAvailable: 9,
        lineTotal: 20,
      },
      {
        id: 2,
        nombre: "B",
        unitPrice: 5,
        quantity: 1,
        stockAvailable: 3,
        lineTotal: 5,
      },
    ]

    render(
      <Cart
        items={items}
        subtotal={25}
        onQuantityChange={jest.fn()}
        onDelete={jest.fn()}
        footer={<CheckoutButton onClick={jest.fn()}>Pagar</CheckoutButton>}
      />
    )

    expect(screen.getAllByTestId("cart-item")).toHaveLength(2)
    expect(screen.getByTestId("cart-total")).toHaveTextContent("25,00 €")
  })

  it("incluye el botón de checkout", () => {
    render(
      <Cart
        items={[]}
        subtotal={0}
        onQuantityChange={jest.fn()}
        onDelete={jest.fn()}
        footer={<CheckoutButton onClick={jest.fn()}>Simular pago</CheckoutButton>}
      />
    )

    expect(screen.getByTestId("checkout-btn")).toBeInTheDocument()
  })
})
