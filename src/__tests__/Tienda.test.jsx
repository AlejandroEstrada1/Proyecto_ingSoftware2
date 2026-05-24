import { act, fireEvent, render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import * as apiMod from "../lib/api.js"
import { ApiError } from "../lib/apiTypes.js"
import Tienda from "../componentes/Tienda.jsx"

jest.spyOn(apiMod, "api")

describe("Tienda", () => {
  const usuario = { id: 1, nombre: "Cliente", correo: "c@test.com" }

  function armarMockCarrito(fallos = {}) {
    let catalogo = [
      { id: 1, nombre: "Producto A", precio: 10, stock: 5 },
      { id: 2, nombre: "Producto B", precio: 3, stock: 2 },
    ]
    let carrito = { items: [], subtotal: 0 }

    jest.mocked(apiMod.api).mockImplementation(async (path, opts = {}) => {
      if (path === "/products") return [...catalogo]
      if (path === "/cart" && opts.method !== "DELETE")
        return { ...carrito, items: carrito.items.map((i) => ({ ...i })) }

      if (path === "/cart/items" && opts.method === "POST") {
        if (fallos.add) throw fallos.add
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
        if (fallos.update) throw fallos.update
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
        if (fallos.delete) throw fallos.delete
        carrito = { items: [], subtotal: 0 }
        return { ...carrito }
      }

      if (path === "/cart" && opts.method === "DELETE") {
        if (fallos.clear) throw fallos.clear
        carrito = { items: [], subtotal: 0 }
        return { ...carrito }
      }

      if (path === "/cart/checkout" && opts.method === "POST") {
        if (fallos.checkout) throw fallos.checkout
        const body = JSON.parse(opts.body)
        if (!body.payment?.cardNumber) throw new Error("Pago requerido")
        const total = carrito.subtotal
        carrito = { items: [], subtotal: 0 }
        return {
          mensaje: "Pago aprobado (simulado)",
          orderId: 42,
          total,
          payment: {
            status: "approved",
            authorizationCode: "SIM-TEST",
            cardLast4: body.payment.cardNumber.slice(-4),
          },
        }
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

  it("evita actualizar estado si se desmonta durante la carga inicial", async () => {
    let resolverProductos
    let resolverCarrito
    jest.mocked(apiMod.api).mockImplementation((path) => {
      if (path === "/products") {
        return new Promise((resolve) => {
          resolverProductos = resolve
        })
      }
      if (path === "/cart") {
        return new Promise((resolve) => {
          resolverCarrito = resolve
        })
      }
      return Promise.resolve(null)
    })

    const { unmount } = render(
      <Tienda usuario={usuario} onCerrarSesion={jest.fn()} />
    )
    unmount()

    await act(async () => {
      resolverProductos([])
      resolverCarrito({ items: [], subtotal: 0 })
    })
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

  it("vacía el carrito completo desde el drawer", async () => {
    const user = userEvent.setup()
    armarMockCarrito()
    render(<Tienda usuario={usuario} onCerrarSesion={jest.fn()} />)

    await user.click(await screen.findByTestId("add-cart-1"))
    await waitFor(() => {
      expect(screen.getByTestId("clear-cart-btn")).toBeEnabled()
    })
    await user.click(screen.getByTestId("clear-cart-btn"))

    await waitFor(() => {
      expect(screen.getByText("Carrito vacío.")).toBeInTheDocument()
    })
    expect(apiMod.api).toHaveBeenCalledWith("/cart", { method: "DELETE" })
  })

  it("simula checkout y muestra mensaje de éxito", async () => {
    const user = userEvent.setup()
    armarMockCarrito()
    render(<Tienda usuario={usuario} onCerrarSesion={jest.fn()} />)

    await user.click(await screen.findByTestId("add-cart-1"))
    await user.click(screen.getByTestId("checkout-btn"))
    await user.type(screen.getByTestId("payment-cardholder"), "Cliente Uno")
    await user.type(screen.getByTestId("payment-card"), "4111111111111111")
    await user.type(screen.getByTestId("payment-expiry"), "12/99")
    await user.type(screen.getByTestId("payment-cvv"), "123")
    await user.click(screen.getByTestId("confirm-payment-btn"))

    await waitFor(() => {
      expect(screen.getByTestId("checkout-success")).toHaveTextContent(
        "Pedido #42"
      )
    })
    expect(screen.getByTestId("last-order-summary")).toHaveTextContent(
      "Producto A"
    )
    expect(screen.getByTestId("last-order-summary")).toHaveTextContent(
      "Total pagado"
    )
    expect(screen.getByTestId("last-order-summary")).toHaveTextContent("1111")
  })

  it("acepta una tarjeta que vence en el mes actual", async () => {
    const user = userEvent.setup()
    const now = new Date()
    const expiry = `${String(now.getMonth() + 1).padStart(2, "0")}/${String(
      now.getFullYear()
    ).slice(-2)}`
    armarMockCarrito()
    render(<Tienda usuario={usuario} onCerrarSesion={jest.fn()} />)

    await user.click(await screen.findByTestId("add-cart-1"))
    await user.click(screen.getByTestId("checkout-btn"))
    await user.type(screen.getByTestId("payment-cardholder"), "Cliente Uno")
    await user.type(screen.getByTestId("payment-card"), "4111111111111111")
    await user.type(screen.getByTestId("payment-expiry"), expiry)
    await user.type(screen.getByTestId("payment-cvv"), "123")
    await user.click(screen.getByTestId("confirm-payment-btn"))

    await waitFor(() => {
      expect(screen.getByTestId("checkout-success")).toHaveTextContent(
        "Pedido #42"
      )
    })
  })

  it("valida datos antes de simular pago", async () => {
    const user = userEvent.setup()
    armarMockCarrito()
    render(<Tienda usuario={usuario} onCerrarSesion={jest.fn()} />)

    await user.click(await screen.findByTestId("add-cart-1"))
    await user.click(screen.getByTestId("checkout-btn"))
    await user.click(screen.getByTestId("confirm-payment-btn"))

    expect(screen.getByTestId("payment-error")).toHaveTextContent(
      "Ingresa el nombre del titular."
    )
  })

  it.each([
    {
      nombre: "tarjeta incompleta",
      datos: {
        cardholder: "Cliente Uno",
        card: "123",
        expiry: "12/99",
        cvv: "123",
      },
      mensaje: "La tarjeta debe tener 16 digitos.",
    },
    {
      nombre: "formato de vencimiento invalido",
      datos: {
        cardholder: "Cliente Uno",
        card: "4111111111111111",
        expiry: "13/99",
        cvv: "123",
      },
      mensaje: "El vencimiento debe tener formato MM/AA.",
    },
    {
      nombre: "tarjeta vencida",
      datos: {
        cardholder: "Cliente Uno",
        card: "4111111111111111",
        expiry: "01/20",
        cvv: "123",
      },
      mensaje: "La tarjeta esta vencida.",
    },
    {
      nombre: "CVV invalido",
      datos: {
        cardholder: "Cliente Uno",
        card: "4111111111111111",
        expiry: "12/99",
        cvv: "1",
      },
      mensaje: "El CVV debe tener 3 o 4 digitos.",
    },
  ])("valida $nombre antes del pago", async ({ datos, mensaje }) => {
    const user = userEvent.setup()
    armarMockCarrito()
    render(<Tienda usuario={usuario} onCerrarSesion={jest.fn()} />)

    await user.click(await screen.findByTestId("add-cart-1"))
    await user.click(screen.getByTestId("checkout-btn"))
    await user.type(screen.getByTestId("payment-cardholder"), datos.cardholder)
    await user.type(screen.getByTestId("payment-card"), datos.card)
    await user.type(screen.getByTestId("payment-expiry"), datos.expiry)
    await user.type(screen.getByTestId("payment-cvv"), datos.cvv)
    await user.click(screen.getByTestId("confirm-payment-btn"))

    expect(screen.getByTestId("payment-error")).toHaveTextContent(mensaje)
  })

  it.each([
    {
      nombre: "agregar producto",
      fallos: { add: new ApiError(400, "No se pudo agregar") },
      accion: async (user) => {
        await user.click(await screen.findByTestId("add-cart-1"))
      },
      mensaje: "No se pudo agregar",
    },
    {
      nombre: "actualizar cantidad",
      fallos: { update: new ApiError(400, "Stock insuficiente") },
      accion: async (user) => {
        await user.click(await screen.findByTestId("add-cart-1"))
        await user.click(screen.getByTestId("open-cart"))
        await user.click(await screen.findByTestId("qty-plus"))
      },
      mensaje: "Stock insuficiente",
    },
    {
      nombre: "eliminar item",
      fallos: { delete: new ApiError(404, "Linea no encontrada") },
      accion: async (user) => {
        await user.click(await screen.findByTestId("add-cart-1"))
        await user.click(screen.getByTestId("open-cart"))
        await user.click(await screen.findByTestId("delete-item"))
      },
      mensaje: "Linea no encontrada",
    },
    {
      nombre: "vaciar carrito",
      fallos: { clear: new ApiError(500, "No se pudo vaciar") },
      accion: async (user) => {
        await user.click(await screen.findByTestId("add-cart-1"))
        await user.click(screen.getByTestId("clear-cart-btn"))
      },
      mensaje: "No se pudo vaciar",
    },
    {
      nombre: "checkout",
      fallos: { checkout: new ApiError(409, "Pago rechazado") },
      accion: async (user) => {
        await user.click(await screen.findByTestId("add-cart-1"))
        await user.click(screen.getByTestId("checkout-btn"))
        await user.type(screen.getByTestId("payment-cardholder"), "Cliente Uno")
        await user.type(screen.getByTestId("payment-card"), "4111111111111111")
        await user.type(screen.getByTestId("payment-expiry"), "12/99")
        await user.type(screen.getByTestId("payment-cvv"), "123")
        await user.click(screen.getByTestId("confirm-payment-btn"))
      },
      mensaje: "Pago rechazado",
    },
  ])("muestra error cuando falla $nombre", async ({ fallos, accion, mensaje }) => {
    const user = userEvent.setup()
    armarMockCarrito(fallos)
    render(<Tienda usuario={usuario} onCerrarSesion={jest.fn()} />)

    await accion(user)

    await waitFor(() => {
      expect(screen.getByTestId("error-message")).toHaveTextContent(mensaje)
    })
  })

  it.each([
    {
      nombre: "carga inicial",
      fallos: {},
      accion: async () => {
        await waitFor(() => {
          expect(screen.queryByText(/Cargando/)).not.toBeInTheDocument()
        })
      },
      preparar: () => {
        jest.mocked(apiMod.api).mockRejectedValue(new Error("offline"))
      },
    },
    {
      nombre: "agregar producto",
      fallos: { add: new Error("offline") },
      accion: async (user) => {
        await user.click(await screen.findByTestId("add-cart-1"))
        await waitFor(() => expect(screen.getByTestId("add-cart-1")).toBeEnabled())
      },
    },
    {
      nombre: "actualizar cantidad",
      fallos: { update: new Error("offline") },
      accion: async (user) => {
        await user.click(await screen.findByTestId("add-cart-1"))
        await user.click(screen.getByTestId("open-cart"))
        await user.click(await screen.findByTestId("qty-plus"))
      },
    },
    {
      nombre: "eliminar item",
      fallos: { delete: new Error("offline") },
      accion: async (user) => {
        await user.click(await screen.findByTestId("add-cart-1"))
        await user.click(screen.getByTestId("open-cart"))
        await user.click(await screen.findByTestId("delete-item"))
      },
    },
    {
      nombre: "vaciar carrito",
      fallos: { clear: new Error("offline") },
      accion: async (user) => {
        await user.click(await screen.findByTestId("add-cart-1"))
        await user.click(screen.getByTestId("clear-cart-btn"))
        await waitFor(() => expect(screen.getByTestId("clear-cart-btn")).toBeEnabled())
      },
    },
    {
      nombre: "checkout",
      fallos: { checkout: new Error("offline") },
      accion: async (user) => {
        await user.click(await screen.findByTestId("add-cart-1"))
        await user.click(screen.getByTestId("checkout-btn"))
        await user.type(screen.getByTestId("payment-cardholder"), "Cliente Uno")
        await user.type(screen.getByTestId("payment-card"), "4111111111111111")
        await user.type(screen.getByTestId("payment-expiry"), "12/99")
        await user.type(screen.getByTestId("payment-cvv"), "123")
        await user.click(screen.getByTestId("confirm-payment-btn"))
        await waitFor(() =>
          expect(screen.getByTestId("confirm-payment-btn")).toHaveTextContent(
            "Pagar ahora"
          )
        )
      },
    },
  ])("ignora errores no ApiError en $nombre", async ({ fallos, accion, preparar }) => {
    const user = userEvent.setup()
    if (preparar) {
      preparar()
    } else {
      armarMockCarrito(fallos)
    }
    render(<Tienda usuario={usuario} onCerrarSesion={jest.fn()} />)

    await accion(user)

    await waitFor(() => {
      expect(screen.queryByTestId("error-message")).not.toBeInTheDocument()
    })
  })

  it("permite cerrar el panel del carrito con boton, backdrop y Escape", async () => {
    const user = userEvent.setup()
    armarMockCarrito()
    const { container } = render(
      <Tienda usuario={usuario} onCerrarSesion={jest.fn()} />
    )
    const drawer = container.querySelector(".cart-drawer")
    const backdrop = container.querySelector(".drawer-backdrop")

    await user.click(await screen.findByTestId("open-cart"))
    expect(drawer).toHaveAttribute("aria-hidden", "false")
    await user.click(screen.getByLabelText("Cerrar carrito"))
    expect(drawer).toHaveAttribute("aria-hidden", "true")

    await user.click(screen.getByTestId("open-cart"))
    await user.click(backdrop)
    expect(drawer).toHaveAttribute("aria-hidden", "true")

    await user.click(screen.getByTestId("open-cart"))
    fireEvent.keyDown(backdrop, { key: "Tab" })
    expect(drawer).toHaveAttribute("aria-hidden", "false")
    fireEvent.keyDown(backdrop, { key: "Escape" })
    expect(drawer).toHaveAttribute("aria-hidden", "true")
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
