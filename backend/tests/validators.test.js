const {
  parseRegister,
  parseLogin,
} = require("../src/validators/auth.validator")
const {
  parseAddCartItem,
  parseUpdateCartItem,
  parseCartItemIdParam,
  parseCheckout,
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

  it("acepta datos de pago simulado validos", () => {
    const d = parseCheckout({
      payment: {
        cardholder: "Ana Cliente",
        cardNumber: "4111111111111111",
        expiry: "12/99",
        cvv: "123",
      },
    })
    expect(d.payment.cardNumber).toBe("4111111111111111")
  })

  it("acepta tarjeta que vence en el mes actual", () => {
    const now = new Date()
    const expiry = `${String(now.getMonth() + 1).padStart(2, "0")}/${String(
      now.getFullYear()
    ).slice(-2)}`
    const d = parseCheckout({
      payment: {
        cardholder: "Ana Cliente",
        cardNumber: "4111111111111111",
        expiry,
        cvv: "123",
      },
    })

    expect(d.payment.expiry).toBe(expiry)
  })

  it("rechaza tarjeta de pago simulado invalida", () => {
    expect(() =>
      parseCheckout({
        payment: {
          cardholder: "Ana Cliente",
          cardNumber: "123",
          expiry: "12/99",
          cvv: "123",
        },
      })
    ).toThrow(AppError)
  })

  it("rechaza tarjeta de pago simulado vencida", () => {
    expect(() =>
      parseCheckout({
        payment: {
          cardholder: "Ana Cliente",
          cardNumber: "4111111111111111",
          expiry: "01/20",
          cvv: "123",
        },
      })
    ).toThrow(AppError)
  })
})
