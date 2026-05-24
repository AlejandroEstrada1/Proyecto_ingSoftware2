const { initDatabase, closeDatabase, getDb } = require("../src/db")
const cartService = require("../src/services/cart.service")
const { registerUser } = require("../src/services/auth.service")
const { AppError } = require("../src/errors/AppError")

describe("cart.service", () => {
  let userId
  let productId
  const payment = {
    cardholder: "Cliente Prueba",
    cardNumber: "4111111111111111",
    expiry: "12/99",
    cvv: "123",
  }

  beforeAll(() => {
    initDatabase(":memory:")
    const u = registerUser({
      nombre: "Cliente",
      correo: "cli@e.com",
      password: "12345678",
    })
    userId = u.id
    productId = getDb().prepare("SELECT id FROM products LIMIT 1").get().id
  })

  afterAll(() => {
    closeDatabase()
  })

  beforeEach(() => {
    getDb().exec("DELETE FROM order_items; DELETE FROM orders;")
    getDb().prepare("DELETE FROM cart_items WHERE user_id = ?").run(userId)
    getDb().prepare("UPDATE products SET stock = 100 WHERE id = ?").run(productId)
  })

  it("carrito vacío tiene subtotal 0", () => {
    const c = cartService.getCart(userId)
    expect(c.items).toHaveLength(0)
    expect(c.subtotal).toBe(0)
  })

  it("checkout con carrito vacío lanza 400", () => {
    expect(() => cartService.checkout(userId)).toThrow(AppError)
  })

  it("añade ítem y recalcula subtotal", () => {
    const cart = cartService.addCartItem(userId, { productId, quantity: 2 })
    expect(cart.items.length).toBeGreaterThanOrEqual(1)
    expect(cart.subtotal).toBeGreaterThan(0)
  })

  it("rechaza producto inexistente al añadir", () => {
    expect(() =>
      cartService.addCartItem(userId, { productId: 999999, quantity: 1 })
    ).toThrow(AppError)
  })

  it("no permite cantidad mayor al stock", () => {
    const stock = getDb()
      .prepare("SELECT stock FROM products WHERE id = ?")
      .get(productId).stock
    expect(() =>
      cartService.addCartItem(userId, { productId, quantity: stock + 1 })
    ).toThrow(AppError)
  })

  it("no permite incrementar una línea existente por encima del stock", () => {
    getDb().prepare("UPDATE products SET stock = 2 WHERE id = ?").run(productId)
    cartService.addCartItem(userId, { productId, quantity: 1 })

    expect(() =>
      cartService.addCartItem(userId, { productId, quantity: 2 })
    ).toThrow(AppError)
  })

  it("incrementa una línea existente al añadir el mismo producto", () => {
    cartService.addCartItem(userId, { productId, quantity: 1 })
    const cart = cartService.addCartItem(userId, { productId, quantity: 2 })

    expect(cart.items).toHaveLength(1)
    expect(cart.items[0].quantity).toBe(3)
  })

  it("actualiza cantidad de línea existente", () => {
    cartService.addCartItem(userId, { productId, quantity: 1 })
    const line = cartService.getCart(userId).items[0]
    const updated = cartService.updateCartItem(userId, line.id, { quantity: 2 })
    const row = updated.items.find((i) => i.id === line.id)
    expect(row.quantity).toBe(2)
  })

  it("rechaza actualización de línea inexistente", () => {
    expect(() =>
      cartService.updateCartItem(userId, 999999, { quantity: 1 })
    ).toThrow(AppError)
  })

  it("rechaza actualización por encima del stock", () => {
    getDb().prepare("UPDATE products SET stock = 1 WHERE id = ?").run(productId)
    cartService.addCartItem(userId, { productId, quantity: 1 })
    const line = cartService.getCart(userId).items[0]

    expect(() =>
      cartService.updateCartItem(userId, line.id, { quantity: 2 })
    ).toThrow(AppError)
  })

  it("elimina línea del carrito", () => {
    cartService.addCartItem(userId, { productId, quantity: 1 })
    const line = cartService.getCart(userId).items[0]
    const after = cartService.deleteCartItem(userId, line.id)
    expect(after.items.find((i) => i.id === line.id)).toBeUndefined()
  })

  it("rechaza eliminar línea inexistente", () => {
    expect(() => cartService.deleteCartItem(userId, 999999)).toThrow(AppError)
  })

  it("vacía todas las líneas del carrito", () => {
    cartService.addCartItem(userId, { productId, quantity: 2 })
    const after = cartService.clearCart(userId)
    expect(after.items).toHaveLength(0)
    expect(after.subtotal).toBe(0)
  })

  it("checkout crea pedido y vacía carrito", () => {
    cartService.addCartItem(userId, { productId, quantity: 1 })
    const before = getDb()
      .prepare("SELECT stock FROM products WHERE id = ?")
      .get(productId).stock
    const result = cartService.checkout(userId, payment)
    expect(result.orderId).toBeGreaterThan(0)
    expect(result.payment.status).toBe("approved")
    expect(result.payment.cardLast4).toBe("1111")
    const after = getDb()
      .prepare("SELECT stock FROM products WHERE id = ?")
      .get(productId).stock
    expect(after).toBe(before - 1)
    expect(cartService.getCart(userId).items).toHaveLength(0)
  })

  it("checkout rechaza si el stock cambia antes de pagar", () => {
    cartService.addCartItem(userId, { productId, quantity: 2 })
    getDb().prepare("UPDATE products SET stock = 1 WHERE id = ?").run(productId)

    expect(() => cartService.checkout(userId, payment)).toThrow(AppError)
    expect(cartService.getCart(userId).items).toHaveLength(1)
  })
})
