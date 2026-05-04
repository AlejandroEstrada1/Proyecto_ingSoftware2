import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { useState } from "react"
import CheckoutButton from "../componentes/CheckoutButton.jsx"

function PagoExitoso() {
  const [msg, setMsg] = useState("")
  const pagar = async () => {
    globalThis.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ orderId: 1 }),
      })
    )
    const res = await fetch("/cart/checkout", { method: "POST" })
    const data = await res.json()
    if (res.ok) setMsg(`Pedido #${data.orderId}`)
  }

  return (
    <div>
      <CheckoutButton onClick={pagar}>Simular pago</CheckoutButton>
      {msg ? (
        <p data-testid="checkout-success" role="status">
          {msg}
        </p>
      ) : null}
    </div>
  )
}

function PagoFallido() {
  const [err, setErr] = useState("")
  const pagar = async () => {
    globalThis.fetch = jest.fn(() =>
      Promise.resolve({
        ok: false,
        json: () => Promise.resolve({ error: "Pago rechazado" }),
      })
    )
    const res = await fetch("/x", { method: "POST" })
    const data = await res.json()
    if (!res.ok) setErr(data.error)
  }

  return (
    <div>
      <CheckoutButton onClick={pagar}>Simular pago</CheckoutButton>
      {err ? (
        <p data-testid="error-message" role="alert">
          {err}
        </p>
      ) : null}
    </div>
  )
}

describe("CheckoutButton", () => {
  const user = userEvent.setup()

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it("ejecuta el callback al hacer clic (servicio de pago)", async () => {
    const onClick = jest.fn()
    render(<CheckoutButton onClick={onClick}>Pagar</CheckoutButton>)

    await user.click(screen.getByTestId("checkout-btn"))
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it("tras pago simulado exitoso muestra mensaje de éxito", async () => {
    render(<PagoExitoso />)

    await user.click(screen.getByTestId("checkout-btn"))
    await waitFor(() => {
      expect(screen.getByTestId("checkout-success")).toHaveTextContent(
        "Pedido #1"
      )
    })
  })

  it("tras pago fallido muestra mensaje de error", async () => {
    render(<PagoFallido />)

    await user.click(screen.getByTestId("checkout-btn"))
    await waitFor(() => {
      expect(screen.getByTestId("error-message")).toHaveTextContent(
        "Pago rechazado"
      )
    })
  })

  it("queda deshabilitado cuando el carrito está vacío (prop disabled)", () => {
    render(
      <CheckoutButton disabled onClick={jest.fn()}>
        Simular pago
      </CheckoutButton>
    )

    expect(screen.getByTestId("checkout-btn")).toBeDisabled()
  })

  it("muestra puntos suspensivos mientras loading es true", () => {
    render(
      <CheckoutButton loading disabled onClick={jest.fn()}>
        Simular pago
      </CheckoutButton>
    )

    expect(screen.getByTestId("checkout-btn")).toHaveTextContent("…")
  })
})
