const { initDatabase, closeDatabase, getDb } = require("../src/db")
const {
  registerUser,
  loginUser,
  signToken,
} = require("../src/services/auth.service")
const { AppError } = require("../src/errors/AppError")

describe("auth.service", () => {
  beforeAll(() => {
    initDatabase(":memory:")
  })

  afterAll(() => {
    closeDatabase()
  })

  it("registra y el hash no es la contraseña en claro", () => {
    const u = registerUser({
      nombre: "Luis",
      correo: "luis@e.com",
      password: "12345678",
    })
    expect(u.id).toBeGreaterThan(0)
    const row = getDb()
      .prepare("SELECT password_hash FROM users WHERE id = ?")
      .get(u.id)
    expect(row.password_hash).not.toContain("12345678")
    expect(row.password_hash.length).toBeGreaterThan(20)
  })

  it("no permite correo duplicado", () => {
    registerUser({
      nombre: "Otro",
      correo: "dup@e.com",
      password: "12345678",
    })
    expect(() =>
      registerUser({
        nombre: "Otro2",
        correo: "dup@e.com",
        password: "87654321",
      })
    ).toThrow(AppError)
  })

  it("login falla con contraseña incorrecta", () => {
    registerUser({
      nombre: "Pepe",
      correo: "pepe@e.com",
      password: "12345678",
    })
    expect(() =>
      loginUser({ correo: "pepe@e.com", password: "wrongpass" })
    ).toThrow(AppError)
  })

  it("login exitoso devuelve usuario sin hash", () => {
    const u = loginUser({ correo: "pepe@e.com", password: "12345678" })
    expect(u.correo).toBe("pepe@e.com")
    expect(u).not.toHaveProperty("password_hash")
  })

  it("signToken genera JWT decodificable", () => {
    const token = signToken({ id: 1, correo: "a@b.c" })
    expect(typeof token).toBe("string")
    expect(token.split(".").length).toBe(3)
  })
})
