const {
  parseRegister,
  parseLogin,
} = require("../src/validators/auth.validator")
const {
  parseAddCartItem,
  parseUpdateCartItem,
  parseCartItemIdParam,
} = require("../src/validators/cart.validator")
const { AppError } = require("../src/errors/AppError")

describe("auth.validator", () => {
  it("rechaza correo inválido", () => {
    expect(() =>
      parseRegister({ nombre: "Ana", correo: "no-email", password: "12345678" })
    ).toThrow(AppError)
  })

  it("rechaza contraseña corta", () => {
    expect(() =>
      parseRegister({ nombre: "Ana", correo: "a@b.co", password: "short" })
    ).toThrow(AppError)
  })

  it("acepta registro válido", () => {
    const d = parseRegister({
      nombre: "Ana",
      correo: "ana@test.com",
      password: "12345678",
    })
    expect(d.correo).toBe("ana@test.com")
  })

  it("login exige correo válido", () => {
    expect(() => parseLogin({ correo: "x", password: "any" })).toThrow(AppError)
  })
})

describe("cart.validator", () => {
  it("parsea ítem válido", () => {
    const d = parseAddCartItem({ productId: 1, quantity: 2 })
    expect(d).toEqual({ productId: 1, quantity: 2 })
  })

  it("rechaza cantidad cero", () => {
    expect(() => parseAddCartItem({ productId: 1, quantity: 0 })).toThrow(AppError)
  })

  it("actualización requiere cantidad positiva", () => {
    expect(() => parseUpdateCartItem({ quantity: -1 })).toThrow(AppError)
  })

  it("id de ítem inválido", () => {
    expect(() => parseCartItemIdParam("abc")).toThrow(AppError)
  })
})
