import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import * as apiMod from "../lib/api.js"
import { ApiError } from "../lib/apiTypes.js"
import Tienda from "../componentes/Tienda.jsx"

jest.spyOn(apiMod, "api")

describe("Tienda", () => {
  const usuario = { id: 1, nombre: "Cliente", correo: "c@test.com" }

  function armarMockCarrito() {
    let catalogo = [
      { id: 1, nombre: "Producto A", precio: 10, stock: 5 },
      { id: 2, nombre: "Producto B", precio: 3, stock: 2 },
    ]
    let carrito = { items: [], subtotal: 0 }

    jest.mocked(apiMod.api).mockImplementation(async (path, opts = {}) => {
      if (path === "/products") return [...catalogo]
      if (path === "/cart")
        return { ...carrito, items: carrito.items.map((i) => ({ ...i })) }

      if (path === "/cart/items" && opts.method === "POST") {
        const { productId, quantity } = JSON.parse(opts.body)
        const p = catalogo.find((x) => x.id === productId)
        const line = {
          id: 77,
          productId,
          nombre: p.nombre,
          unitPrice: p.precio,
          quantity,
          stockAvailable: p.stock,
          lineTotal: p.precio * quantity,
        }
        carrito = { items: [line], subtotal: line.lineTotal }
        return { ...carrito, items: [...carrito.items] }
      }

      if (
        typeof path === "string" &&
        path.startsWith("/cart/items/") &&
        opts.method === "PUT"
      ) {
        const quantity = JSON.parse(opts.body).quantity
        const prev = carrito.items[0]
        const line = {
          ...prev,
          quantity,
          lineTotal: prev.unitPrice * quantity,
        }
        carrito = { items: [line], subtotal: line.lineTotal }
        return { ...carrito, items: [...carrito.items] }
      }

      if (
        typeof path === "string" &&
        path.startsWith("/cart/items/") &&
        opts.method === "DELETE"
      ) {
        carrito = { items: [], subtotal: 0 }
        return { ...carrito }
      }

      if (path === "/cart/checkout" && opts.method === "POST") {
        const total = carrito.subtotal
        carrito = { items: [], subtotal: 0 }
        return { mensaje: "Pedido registrado", orderId: 42, total }
      }

      return null
    })
  }

  beforeEach(() => {
    jest.mocked(apiMod.api).mockReset()
  })

  it("muestra error si falla la carga inicial del catálogo", async () => {
    jest
      .mocked(apiMod.api)
      .mockRejectedValue(new ApiError(500, "Servicio no disponible"))

    render(<Tienda usuario={usuario} onCerrarSesion={jest.fn()} />)

    await waitFor(() => {
      expect(screen.getByTestId("error-message")).toHaveTextContent(
        "Servicio no disponible"
      )
    })
  })

  it("carga catálogo y muestra el saludo del usuario", async () => {
    armarMockCarrito()
    render(<Tienda usuario={usuario} onCerrarSesion={jest.fn()} />)

    await waitFor(() =>
      expect(screen.getByTestId("shop-heading")).toBeInTheDocument()
    )
    expect(screen.getByTestId("user-greeting")).toHaveTextContent("Cliente")
    expect(await screen.findByText("Producto A")).toBeInTheDocument()
  })

  it("añade un producto al carrito y actualiza el subtotal", async () => {
    const user = userEvent.setup()
    armarMockCarrito()
    render(<Tienda usuario={usuario} onCerrarSesion={jest.fn()} />)

    await screen.findByTestId("add-cart-1")
    await user.click(screen.getByTestId("add-cart-1"))

    await waitFor(() => {
      expect(screen.getByTestId("cart-total")).toHaveTextContent("10,00")
    })
  })

  it("permite incrementar y decrementar cantidad en el carrito", async () => {
    const user = userEvent.setup()
    armarMockCarrito()
    render(<Tienda usuario={usuario} onCerrarSesion={jest.fn()} />)

    await user.click(await screen.findByTestId("add-cart-1"))
    await user.click(screen.getByTestId("open-cart"))

    await waitFor(() =>
      expect(screen.getAllByTestId("qty-plus").length).toBeGreaterThan(0)
    )
    await user.click(screen.getByTestId("qty-plus"))
    await waitFor(() => {
      expect(screen.getByTestId("cart-total")).toHaveTextContent(/20,00/)
    })

    await user.click(screen.getByTestId("qty-minus"))
    await waitFor(() => {
      expect(screen.getByTestId("cart-total")).toHaveTextContent(/10,00/)
    })
  })

  it("elimina un ítem del carrito con Quitar", async () => {
    const user = userEvent.setup()
    armarMockCarrito()
    render(<Tienda usuario={usuario} onCerrarSesion={jest.fn()} />)

    await user.click(await screen.findByTestId("add-cart-1"))
    await user.click(screen.getByTestId("open-cart"))
    await user.click(await screen.findByTestId("delete-item"))

    await waitFor(() => {
      expect(screen.getByText("Carrito vacío.")).toBeInTheDocument()
    })
  })

  it("simula checkout y muestra mensaje de éxito", async () => {
    const user = userEvent.setup()
    armarMockCarrito()
    render(<Tienda usuario={usuario} onCerrarSesion={jest.fn()} />)

    await user.click(await screen.findByTestId("add-cart-1"))
    await user.click(screen.getByTestId("checkout-btn"))

    await waitFor(() => {
      expect(screen.getByTestId("checkout-success")).toHaveTextContent(
        "Pedido #42"
      )
    })
  })

  it("cierra sesión al pulsar Salir", async () => {
    const user = userEvent.setup()
    armarMockCarrito()
    const onCerrar = jest.fn()
    render(<Tienda usuario={usuario} onCerrarSesion={onCerrar} />)

    await screen.findByTestId("shop-heading")
    await user.click(screen.getByTestId("logout-btn"))
    expect(onCerrar).toHaveBeenCalled()
  })
})
