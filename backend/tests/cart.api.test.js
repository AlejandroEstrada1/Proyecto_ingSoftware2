const request = require("supertest")
const { initDatabase, closeDatabase, getDb } = require("../src/db")
const { createApp } = require("../src/app")

describe("API /cart", () => {
  let app
  let token
  let productId
  let userId
  const payment = {
    cardholder: "Comprador",
    cardNumber: "4111111111111111",
    expiry: "12/99",
    cvv: "123",
  }

  beforeAll(async () => {
    initDatabase(":memory:")
    app = createApp()
    const email = `buyer_cart_${Date.now()}@test.com`
    await request(app).post("/auth/register").send({
      nombre: "Comprador",
      correo: email,
      password: "12345678",
    })
    const login = await request(app).post("/auth/login").send({
      correo: email,
      password: "12345678",
    })
    token = login.body.token
    userId = login.body.user.id
    productId = getDb().prepare("SELECT id FROM products LIMIT 1").get().id
  })

  afterAll(() => {
    closeDatabase()
  })

  beforeEach(() => {
    getDb().exec("DELETE FROM order_items; DELETE FROM orders;")
    getDb().prepare("DELETE FROM cart_items WHERE user_id = ?").run(userId)
    getDb().prepare("UPDATE products SET stock = 80 WHERE id = ?").run(productId)
  })

  it("GET /cart sin token → 401", async () => {
    const res = await request(app).get("/cart")
    expect(res.status).toBe(401)
  })

  it("GET /cart vacío", async () => {
    const res = await request(app)
      .get("/cart")
      .set("Authorization", `Bearer ${token}`)
    expect(res.status).toBe(200)
    expect(res.body.items).toEqual([])
    expect(res.body.subtotal).toBe(0)
  })

  it("POST /cart/items añade producto", async () => {
    const res = await request(app)
      .post("/cart/items")
      .set("Authorization", `Bearer ${token}`)
      .send({ productId, quantity: 2 })
    expect(res.status).toBe(201)
    expect(res.body.items.length).toBe(1)
    expect(res.body.subtotal).toBeGreaterThan(0)
  })

  it("PUT /cart/items/:id actualiza cantidad", async () => {
    await request(app)
      .post("/cart/items")
      .set("Authorization", `Bearer ${token}`)
      .send({ productId, quantity: 1 })
    const cart = await request(app)
      .get("/cart")
      .set("Authorization", `Bearer ${token}`)
    const lineId = cart.body.items[0].id

    const res = await request(app)
      .put(`/cart/items/${lineId}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ quantity: 3 })

    expect(res.status).toBe(200)
    expect(res.body.items[0].quantity).toBe(3)
  })

  it("DELETE /cart vacía el carrito completo", async () => {
    await request(app)
      .post("/cart/items")
      .set("Authorization", `Bearer ${token}`)
      .send({ productId, quantity: 2 })

    const res = await request(app)
      .delete("/cart")
      .set("Authorization", `Bearer ${token}`)

    expect(res.status).toBe(200)
    expect(res.body.items).toHaveLength(0)
    expect(res.body.subtotal).toBe(0)
  })

  it("DELETE /cart/items/:id elimina una línea individual", async () => {
    await request(app)
      .post("/cart/items")
      .set("Authorization", `Bearer ${token}`)
      .send({ productId, quantity: 1 })
    const cart = await request(app)
      .get("/cart")
      .set("Authorization", `Bearer ${token}`)
    const lineId = cart.body.items[0].id

    const res = await request(app)
      .delete(`/cart/items/${lineId}`)
      .set("Authorization", `Bearer ${token}`)

    expect(res.status).toBe(200)
    expect(res.body.items).toHaveLength(0)
  })

  it("POST /cart/checkout simula pago y vacía carrito", async () => {
    await request(app)
      .post("/cart/items")
      .set("Authorization", `Bearer ${token}`)
      .send({ productId, quantity: 1 })

    const res = await request(app)
      .post("/cart/checkout")
      .set("Authorization", `Bearer ${token}`)
      .send({ payment })

    expect(res.status).toBe(201)
    expect(res.body.orderId).toBeGreaterThan(0)
    expect(res.body.payment.status).toBe("approved")
    expect(res.body.payment.cardLast4).toBe("1111")

    const empty = await request(app)
      .get("/cart")
      .set("Authorization", `Bearer ${token}`)
    expect(empty.body.items).toHaveLength(0)
  })

  it("POST /cart/checkout rechaza pago invalido", async () => {
    await request(app)
      .post("/cart/items")
      .set("Authorization", `Bearer ${token}`)
      .send({ productId, quantity: 1 })

    const res = await request(app)
      .post("/cart/checkout")
      .set("Authorization", `Bearer ${token}`)
      .send({
        payment: {
          ...payment,
          cardNumber: "123",
        },
      })

    expect(res.status).toBe(400)
    expect(res.body.error).toBe("Datos de pago invalidos")
  })
})
