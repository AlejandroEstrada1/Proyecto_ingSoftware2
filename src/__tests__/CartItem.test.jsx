import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import CartItem from "../componentes/CartItem.jsx"

describe("CartItem", () => {
  const lineBase = {
    id: 10,
    nombre: "Taza reutilizable",
    unitPrice: 12.5,
    quantity: 2,
    stockAvailable: 5,
    lineTotal: 25,
  }

  it("muestra nombre del producto y total de línea", () => {
    const onQuantityChange = jest.fn()
    const onDelete = jest.fn()

    render(
      <ul>
        <CartItem
          line={lineBase}
          onQuantityChange={onQuantityChange}
          onDelete={onDelete}
        />
      </ul>
    )

    expect(screen.getByText("Taza reutilizable")).toBeInTheDocument()
    expect(screen.getByText(/25,00/)).toBeInTheDocument()
    expect(screen.getByText("2")).toBeInTheDocument()
  })

  it("al pulsar + aumenta la cantidad vía callback", async () => {
    const user = userEvent.setup()
    const onQuantityChange = jest.fn()
    const onDelete = jest.fn()

    render(
      <ul>
        <CartItem
          line={lineBase}
          onQuantityChange={onQuantityChange}
          onDelete={onDelete}
        />
      </ul>
    )

    await user.click(screen.getByTestId("qty-plus"))
    expect(onQuantityChange).toHaveBeenCalledWith(10, 3)
  })

  it("deshabilita + si la cantidad alcanza el stock disponible", () => {
    const lineMax = { ...lineBase, quantity: 5, stockAvailable: 5 }
    render(
      <ul>
        <CartItem
          line={lineMax}
          onQuantityChange={jest.fn()}
          onDelete={jest.fn()}
        />
      </ul>
    )

    expect(screen.getByTestId("qty-plus")).toBeDisabled()
  })

  it("al pulsar − disminuye la cantidad pero no por debajo de 1", async () => {
    const user = userEvent.setup()
    const onQuantityChange = jest.fn()
    const onDelete = jest.fn()

    const lineQty1 = { ...lineBase, quantity: 1, lineTotal: 12.5 }

    render(
      <ul>
        <CartItem
          line={lineQty1}
          onQuantityChange={onQuantityChange}
          onDelete={onDelete}
        />
      </ul>
    )

    expect(screen.getByTestId("qty-minus")).toBeDisabled()
    await user.click(screen.getByTestId("qty-plus"))
    expect(onQuantityChange).toHaveBeenCalledWith(10, 2)
  })

  it("al pulsar Quitar llama a onDelete con el id de línea", async () => {
    const user = userEvent.setup()
    const onQuantityChange = jest.fn()
    const onDelete = jest.fn()

    render(
      <ul>
        <CartItem
          line={lineBase}
          onQuantityChange={onQuantityChange}
          onDelete={onDelete}
        />
      </ul>
    )

    await user.click(screen.getByTestId("delete-item"))
    expect(onDelete).toHaveBeenCalledWith(10)
  })
})
