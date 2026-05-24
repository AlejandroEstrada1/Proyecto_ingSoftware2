const request = require("supertest")
const { initDatabase, closeDatabase } = require("../src/db")
const { createApp } = require("../src/app")

describe("app base", () => {
  let app

  beforeAll(() => {
    initDatabase(":memory:")
    app = createApp()
  })

  afterAll(() => {
    closeDatabase()
  })

  it("GET /health", async () => {
    const res = await request(app).get("/health")
    expect(res.status).toBe(200)
    expect(res.body.service).toBe("EcoMart API")
  })

  it("GET /products lista catálogo", async () => {
    const res = await request(app).get("/products")
    expect(res.status).toBe(200)
    expect(Array.isArray(res.body)).toBe(true)
    expect(res.body.length).toBeGreaterThan(0)
  })

  it("ruta desconocida 404", async () => {
    const res = await request(app).get("/ruta-inexistente")
    expect(res.status).toBe(404)
    expect(res.body.error).toBeDefined()
  })

  it("preflight CORS permite Origin en localhost", async () => {
    const res = await request(app)
      .options("/auth/login")
      .set("Origin", "http://localhost:5173")
      .set("Access-Control-Request-Method", "POST")
    expect([200, 204]).toContain(res.status)
    expect(res.headers["access-control-allow-origin"]).toBe(
      "http://localhost:5173"
    )
  })

  it("preflight CORS permite Origin en 127.0.0.1", async () => {
    const res = await request(app)
      .options("/auth/login")
      .set("Origin", "http://127.0.0.1:5175")
      .set("Access-Control-Request-Method", "POST")
    expect([200, 204]).toContain(res.status)
    expect(res.headers["access-control-allow-origin"]).toBe(
      "http://127.0.0.1:5175"
    )
  })

  it("preflight CORS rechaza origen no local", async () => {
    const res = await request(app)
      .options("/auth/login")
      .set("Origin", "https://malicioso.example")
      .set("Access-Control-Request-Method", "POST")
    expect(res.headers["access-control-allow-origin"]).toBeUndefined()
  })

  it("preflight CORS rechaza origen externo sin lista configurada", async () => {
    const previous = process.env.CORS_ORIGIN
    delete process.env.CORS_ORIGIN

    const res = await request(app)
      .options("/auth/login")
      .set("Origin", "https://externo.example")
      .set("Access-Control-Request-Method", "POST")

    expect(res.headers["access-control-allow-origin"]).toBeUndefined()
    process.env.CORS_ORIGIN = previous
  })

  it("preflight CORS permite origen configurado por variable", async () => {
    const previous = process.env.CORS_ORIGIN
    process.env.CORS_ORIGIN = "https://permitido.example"

    const res = await request(app)
      .options("/auth/login")
      .set("Origin", "https://permitido.example")
      .set("Access-Control-Request-Method", "POST")

    expect([200, 204]).toContain(res.status)
    expect(res.headers["access-control-allow-origin"]).toBe(
      "https://permitido.example"
    )
    process.env.CORS_ORIGIN = previous
  })
})
