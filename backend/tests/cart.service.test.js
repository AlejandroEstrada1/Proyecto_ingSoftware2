const { initDatabase, closeDatabase, getDb } = require("../src/db")
const cartService = require("../src/services/cart.service")
const { registerUser } = require("../src/services/auth.service")
const { AppError } = require("../src/errors/AppError")

describe("cart.service", () => {
  let userId
  let productId

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

  it("no permite cantidad mayor al stock", () => {
    const stock = getDb()
      .prepare("SELECT stock FROM products WHERE id = ?")
      .get(productId).stock
    expect(() =>
      cartService.addCartItem(userId, { productId, quantity: stock + 1 })
    ).toThrow(AppError)
  })

  it("actualiza cantidad de línea existente", () => {
    cartService.addCartItem(userId, { productId, quantity: 1 })
    const line = cartService.getCart(userId).items[0]
    const updated = cartService.updateCartItem(userId, line.id, { quantity: 2 })
    const row = updated.items.find((i) => i.id === line.id)
    expect(row.quantity).toBe(2)
  })

  it("elimina línea del carrito", () => {
    cartService.addCartItem(userId, { productId, quantity: 1 })
    const line = cartService.getCart(userId).items[0]
    const after = cartService.deleteCartItem(userId, line.id)
    expect(after.items.find((i) => i.id === line.id)).toBeUndefined()
  })

  it("checkout crea pedido y vacía carrito", () => {
    cartService.addCartItem(userId, { productId, quantity: 1 })
    const before = getDb()
      .prepare("SELECT stock FROM products WHERE id = ?")
      .get(productId).stock
    const result = cartService.checkout(userId)
    expect(result.orderId).toBeGreaterThan(0)
    const after = getDb()
      .prepare("SELECT stock FROM products WHERE id = ?")
      .get(productId).stock
    expect(after).toBe(before - 1)
    expect(cartService.getCart(userId).items).toHaveLength(0)
  })
})
