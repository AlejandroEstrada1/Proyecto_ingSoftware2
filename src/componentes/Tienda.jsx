import { useCallback, useEffect, useState } from "react"
import { api } from "../lib/api.js"
import { ApiError } from "../lib/apiTypes.js"
import { formatMoney } from "../lib/formatMoney.js"
import Cart from "./Cart.jsx"
import CheckoutButton from "./CheckoutButton.jsx"

const EMPTY_PAYMENT = {
  cardholder: "",
  cardNumber: "",
  expiry: "",
  cvv: "",
}

function normalizePayment(form) {
  return {
    cardholder: form.cardholder.trim(),
    cardNumber: form.cardNumber.replace(/\D/g, ""),
    expiry: form.expiry.trim(),
    cvv: form.cvv.replace(/\D/g, ""),
  }
}

function isFutureExpiry(value) {
  const [monthText, yearText] = value.split("/")
  const month = Number(monthText)
  const year = 2000 + Number(yearText)
  const now = new Date()
  return (
    year > now.getFullYear() ||
    (year === now.getFullYear() && month >= now.getMonth() + 1)
  )
}

function validatePayment(form) {
  const payment = normalizePayment(form)
  if (payment.cardholder.length < 3) {
    return { error: "Ingresa el nombre del titular." }
  }
  if (!/^\d{16}$/.test(payment.cardNumber)) {
    return { error: "La tarjeta debe tener 16 digitos." }
  }
  if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(payment.expiry)) {
    return { error: "El vencimiento debe tener formato MM/AA." }
  }
  if (!isFutureExpiry(payment.expiry)) {
    return { error: "La tarjeta esta vencida." }
  }
  if (!/^\d{3,4}$/.test(payment.cvv)) {
    return { error: "El CVV debe tener 3 o 4 digitos." }
  }
  return { payment }
}

function Tienda({ usuario, onCerrarSesion }) {
  const [catalogo, setCatalogo] = useState([])
  const [carrito, setCarrito] = useState({ items: [], subtotal: 0 })
  const [panelCarrito, setPanelCarrito] = useState(false)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState("")
  const [checkoutMsg, setCheckoutMsg] = useState("")
  const [ultimaCompra, setUltimaCompra] = useState(null)
  const [busyId, setBusyId] = useState(null)
  const [checkoutBusy, setCheckoutBusy] = useState(false)
  const [clearBusy, setClearBusy] = useState(false)
  const [paymentOpen, setPaymentOpen] = useState(false)
  const [paymentForm, setPaymentForm] = useState(EMPTY_PAYMENT)
  const [paymentError, setPaymentError] = useState("")

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
    setUltimaCompra(null)
    setPaymentOpen(false)
    setPaymentError("")
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
    setError("")
    setUltimaCompra(null)
    setPaymentOpen(false)
    setPaymentError("")
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
    setUltimaCompra(null)
    setPaymentOpen(false)
    setPaymentError("")
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

  const vaciarCarrito = async () => {
    setError("")
    setCheckoutMsg("")
    setUltimaCompra(null)
    setPaymentOpen(false)
    setPaymentError("")
    setClearBusy(true)
    try {
      const actualizado = await api("/cart", { method: "DELETE" })
      setCarrito(actualizado)
    } catch (e) {
      if (e instanceof ApiError) setError(e.message)
    } finally {
      setClearBusy(false)
    }
  }

  const checkout = async (event) => {
    event.preventDefault()
    setError("")
    setCheckoutMsg("")
    setPaymentError("")
    const validation = validatePayment(paymentForm)
    if (validation.error) {
      setPaymentError(validation.error)
      return
    }
    setCheckoutBusy(true)
    const compraActual = {
      items: carrito.items.map((item) => ({ ...item })),
      total: carrito.subtotal,
    }
    try {
      const res = await api("/cart/checkout", {
        method: "POST",
        body: JSON.stringify({ payment: validation.payment }),
      })
      setCheckoutMsg(
        `${res.mensaje} · Pedido #${res.orderId} · Total ${formatMoney(res.total)} · Autorizacion ${res.payment.authorizationCode}`
      )
      setUltimaCompra({
        ...compraActual,
        orderId: res.orderId,
        total: res.total,
        payment: res.payment,
      })
      await cargarCarrito()
      await cargarCatalogo()
      setPanelCarrito(true)
      setPaymentOpen(false)
      setPaymentForm(EMPTY_PAYMENT)
    } catch (e) {
      if (e instanceof ApiError) setError(e.message)
    } finally {
      setCheckoutBusy(false)
    }
  }

  const totalItems = carrito.items.reduce((a, i) => a + i.quantity, 0)
  const updatePaymentField = (field, value) => {
    setPaymentForm((current) => ({ ...current, [field]: value }))
  }

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
          afterItems={
            carrito.items.length === 0 && ultimaCompra ? (
              <section
                className="last-order"
                aria-label="Resumen de la última compra"
                data-testid="last-order-summary"
              >
                <div className="last-order__head">
                  <span>Última compra</span>
                  <strong>Pedido #{ultimaCompra.orderId}</strong>
                </div>
                <ul className="last-order__items">
                  {ultimaCompra.items.map((item) => (
                    <li key={item.id}>
                      <span>
                        {item.nombre} × {item.quantity}
                      </span>
                      <strong>{formatMoney(item.lineTotal)}</strong>
                    </li>
                  ))}
                </ul>
                <div className="last-order__total">
                  <span>Total pagado</span>
                  <strong>{formatMoney(ultimaCompra.total)}</strong>
                </div>
                <p className="last-order__payment">
                  Tarjeta terminada en {ultimaCompra.payment.cardLast4}
                </p>
              </section>
            ) : null
          }
          footer={
            <div className="cart-actions">
              {paymentOpen && carrito.items.length > 0 ? (
                <form
                  className="payment-form"
                  data-testid="payment-form"
                  onSubmit={checkout}
                  noValidate
                >
                  <h4>Pago simulado</h4>
                  <label className="field">
                    <span>Titular</span>
                    <input
                      data-testid="payment-cardholder"
                      value={paymentForm.cardholder}
                      onChange={(e) =>
                        updatePaymentField("cardholder", e.target.value)
                      }
                      placeholder="Nombre en la tarjeta"
                    />
                  </label>
                  <label className="field">
                    <span>Numero de tarjeta</span>
                    <input
                      data-testid="payment-card"
                      inputMode="numeric"
                      maxLength={19}
                      value={paymentForm.cardNumber}
                      onChange={(e) =>
                        updatePaymentField("cardNumber", e.target.value)
                      }
                      placeholder="4111 1111 1111 1111"
                    />
                  </label>
                  <div className="payment-form__row">
                    <label className="field">
                      <span>Vencimiento</span>
                      <input
                        data-testid="payment-expiry"
                        maxLength={5}
                        value={paymentForm.expiry}
                        onChange={(e) =>
                          updatePaymentField("expiry", e.target.value)
                        }
                        placeholder="MM/AA"
                      />
                    </label>
                    <label className="field">
                      <span>CVV</span>
                      <input
                        data-testid="payment-cvv"
                        inputMode="numeric"
                        maxLength={4}
                        value={paymentForm.cvv}
                        onChange={(e) =>
                          updatePaymentField("cvv", e.target.value)
                        }
                        placeholder="123"
                      />
                    </label>
                  </div>
                  {paymentError ? (
                    <p
                      className="alert alert--error"
                      data-testid="payment-error"
                      role="alert"
                    >
                      {paymentError}
                    </p>
                  ) : null}
                  <button
                    type="submit"
                    className="btn btn--primary btn--block"
                    data-testid="confirm-payment-btn"
                    disabled={checkoutBusy || clearBusy}
                  >
                    {checkoutBusy ? "Procesando..." : "Pagar ahora"}
                  </button>
                </form>
              ) : null}
              <button
                type="button"
                className="btn btn--outline btn--block"
                data-testid="clear-cart-btn"
                disabled={
                  carrito.items.length === 0 || clearBusy || checkoutBusy
                }
                onClick={vaciarCarrito}
              >
                {clearBusy ? "Vaciando..." : "Vaciar carrito"}
              </button>
              <CheckoutButton
                disabled={
                  carrito.items.length === 0 ||
                  checkoutBusy ||
                  clearBusy ||
                  paymentOpen
                }
                loading={checkoutBusy}
                onClick={() => {
                  setPaymentOpen(true)
                  setPaymentError("")
                }}
              >
                Continuar al pago
              </CheckoutButton>
            </div>
          }
        />
      </aside>
    </div>
  )
}

export default Tienda
