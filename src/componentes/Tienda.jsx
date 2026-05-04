import { useCallback, useEffect, useState } from "react"
import { api } from "../lib/api.js"
import { ApiError } from "../lib/apiTypes.js"
import { formatMoney } from "../lib/formatMoney.js"
import Cart from "./Cart.jsx"
import CheckoutButton from "./CheckoutButton.jsx"

function Tienda({ usuario, onCerrarSesion }) {
  const [catalogo, setCatalogo] = useState([])
  const [carrito, setCarrito] = useState({ items: [], subtotal: 0 })
  const [panelCarrito, setPanelCarrito] = useState(false)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState("")
  const [checkoutMsg, setCheckoutMsg] = useState("")
  const [busyId, setBusyId] = useState(null)
  const [checkoutBusy, setCheckoutBusy] = useState(false)

  const cargarCatalogo = useCallback(async () => {
    const lista = await api("/products")
    setCatalogo(lista)
  }, [])

  const cargarCarrito = useCallback(async () => {
    const c = await api("/cart")
    setCarrito(c)
  }, [])

  useEffect(() => {
    let cancel = false
    ;(async () => {
      setCargando(true)
      setError("")
      try {
        await Promise.all([cargarCatalogo(), cargarCarrito()])
      } catch (e) {
        if (!cancel && e instanceof ApiError) {
          setError(e.message)
        }
      } finally {
        if (!cancel) setCargando(false)
      }
    })()
    return () => {
      cancel = true
    }
  }, [cargarCatalogo, cargarCarrito])

  const agregarAlCarrito = async (producto) => {
    setBusyId(producto.id)
    setError("")
    setCheckoutMsg("")
    try {
      const actualizado = await api("/cart/items", {
        method: "POST",
        body: JSON.stringify({ productId: producto.id, quantity: 1 }),
      })
      setCarrito(actualizado)
      setPanelCarrito(true)
      await cargarCatalogo()
    } catch (e) {
      if (e instanceof ApiError) setError(e.message)
    } finally {
      setBusyId(null)
    }
  }

  const actualizarCantidad = async (lineId, quantity) => {
    if (quantity < 1) return
    setError("")
    try {
      const actualizado = await api(`/cart/items/${lineId}`, {
        method: "PUT",
        body: JSON.stringify({ quantity }),
      })
      setCarrito(actualizado)
      await cargarCatalogo()
    } catch (e) {
      if (e instanceof ApiError) setError(e.message)
    }
  }

  const eliminarLinea = async (lineId) => {
    setError("")
    try {
      const actualizado = await api(`/cart/items/${lineId}`, {
        method: "DELETE",
      })
      setCarrito(actualizado)
      await cargarCatalogo()
    } catch (e) {
      if (e instanceof ApiError) setError(e.message)
    }
  }

  const checkout = async () => {
    setError("")
    setCheckoutMsg("")
    setCheckoutBusy(true)
    try {
      const res = await api("/cart/checkout", { method: "POST" })
      setCheckoutMsg(
        `${res.mensaje} · Pedido #${res.orderId} · Total ${formatMoney(res.total)}`
      )
      await cargarCarrito()
      await cargarCatalogo()
      setPanelCarrito(false)
    } catch (e) {
      if (e instanceof ApiError) setError(e.message)
    } finally {
      setCheckoutBusy(false)
    }
  }

  const totalItems = carrito.items.reduce((a, i) => a + i.quantity, 0)

  return (
    <div className="shop-root">
      <header className="topbar">
        <div className="topbar__brand">
          <span className="brand-mark brand-mark--sm" aria-hidden>
            ◎
          </span>
          <div>
            <strong>EcoMart</strong>
            <span className="muted"> · vitrina digital</span>
          </div>
        </div>
        <div className="topbar__actions">
          <span className="user-pill" data-testid="user-greeting">
            Hola, {usuario?.nombre}
          </span>
          <button
            type="button"
            className="btn btn--ghost"
            data-testid="open-cart"
            onClick={() => setPanelCarrito(true)}
          >
            Carrito
            {totalItems > 0 ? (
              <span className="badge">{totalItems}</span>
            ) : null}
          </button>
          <button
            type="button"
            className="btn btn--outline"
            data-testid="logout-btn"
            onClick={onCerrarSesion}
          >
            Salir
          </button>
        </div>
      </header>

      <main className="shop-main">
        <section className="hero-strip">
          <h2 data-testid="shop-heading">Catálogo</h2>
          <p className="muted">
            Stock en vivo desde SQLite. El carrito se guarda en servidor y
            sobrevive al cerrar sesión.
          </p>
        </section>

        {error ? (
          <p
            className="alert alert--error"
            role="alert"
            data-testid="error-message"
          >
            {error}
          </p>
        ) : null}
        {checkoutMsg ? (
          <p
            className="alert alert--success"
            role="status"
            data-testid="checkout-success"
          >
            {checkoutMsg}
          </p>
        ) : null}

        {cargando ? (
          <p className="muted">Cargando catálogo…</p>
        ) : (
          <div className="product-grid">
            {catalogo.map((p) => (
              <article key={p.id} className="product-card">
                <div className="product-card__visual" />
                <div className="product-card__body">
                  <h3>{p.nombre}</h3>
                  <p className="product-meta">
                    {formatMoney(p.precio)} ·{" "}
                    <span className="stock">{p.stock} uds.</span>
                  </p>
                  <button
                    type="button"
                    className="btn btn--primary btn--sm"
                    data-testid={`add-cart-${p.id}`}
                    disabled={p.stock < 1 || busyId === p.id}
                    onClick={() => agregarAlCarrito(p)}
                  >
                    {busyId === p.id ? "…" : "Añadir"}
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>

      <div
        className={`drawer-backdrop ${panelCarrito ? "is-open" : ""}`}
        onClick={() => setPanelCarrito(false)}
        onKeyDown={(e) => e.key === "Escape" && setPanelCarrito(false)}
        role="presentation"
      />
      <aside
        className={`cart-drawer ${panelCarrito ? "is-open" : ""}`}
        aria-hidden={!panelCarrito}
      >
        <div className="cart-drawer__head">
          <h3>Tu carrito</h3>
          <button
            type="button"
            className="icon-btn"
            onClick={() => setPanelCarrito(false)}
            aria-label="Cerrar carrito"
          >
            ×
          </button>
        </div>
        <Cart
          items={carrito.items}
          subtotal={carrito.subtotal}
          emptyLabel="Carrito vacío."
          onQuantityChange={actualizarCantidad}
          onDelete={eliminarLinea}
          footer={
            <CheckoutButton
              disabled={carrito.items.length === 0 || checkoutBusy}
              loading={checkoutBusy}
              onClick={checkout}
            >
              Simular pago
            </CheckoutButton>
          }
        />
      </aside>
    </div>
  )
}

export default Tienda
