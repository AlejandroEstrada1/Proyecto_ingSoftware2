const request = require("supertest")
const { initDatabase, closeDatabase } = require("../src/db")
const { createApp } = require("../src/app")

describe("API /auth", () => {
  let app

  beforeAll(() => {
    initDatabase(":memory:")
    app = createApp()
  })

  afterAll(() => {
    closeDatabase()
  })

  it("POST /auth/register crea usuario y token", async () => {
    const res = await request(app).post("/auth/register").send({
      nombre: "API User",
      correo: "apiuser@test.com",
      password: "12345678",
    })
    expect(res.status).toBe(201)
    expect(res.body.token).toBeDefined()
    expect(res.body.user.correo).toBe("apiuser@test.com")
  })

  it("POST /auth/register duplicado devuelve 409", async () => {
    const res = await request(app).post("/auth/register").send({
      nombre: "Usuario duplicado",
      correo: "apiuser@test.com",
      password: "12345678",
    })
    expect(res.status).toBe(409)
    expect(res.body.error).toBeDefined()
  })

  it("POST /auth/login credenciales incorrectas 401", async () => {
    const res = await request(app).post("/auth/login").send({
      correo: "apiuser@test.com",
      password: "wrongpassword",
    })
    expect(res.status).toBe(401)
  })

  it("POST /auth/login correcto devuelve token", async () => {
    const res = await request(app).post("/auth/login").send({
      correo: "apiuser@test.com",
      password: "12345678",
    })
    expect(res.status).toBe(200)
    expect(res.body.token).toMatch(/^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\./)
  })
})
