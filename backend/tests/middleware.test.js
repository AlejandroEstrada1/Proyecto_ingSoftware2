const jwt = require("jsonwebtoken")
const { AppError } = require("../src/errors/AppError")
const { authMiddleware } = require("../src/middleware/authMiddleware")
const { errorHandler } = require("../src/middleware/errorHandler")

describe("authMiddleware", () => {
  const secret = "jest-secret-minimo-32-caracteres-xx"

  function runWithToken(token) {
    const req = { headers: { authorization: `Bearer ${token}` } }
    const next = jest.fn()
    authMiddleware(req, {}, next)
    return { req, next }
  }

  it("reporta error si falta JWT_SECRET", () => {
    const previous = process.env.JWT_SECRET
    delete process.env.JWT_SECRET
    const next = jest.fn()

    authMiddleware({ headers: { authorization: "Bearer cualquiera" } }, {}, next)

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({ status: 500 })
    )
    process.env.JWT_SECRET = previous
  })

  it("rechaza token sin sub numerico o string", () => {
    const token = jwt.sign({ sub: { id: 1 } }, secret)

    const { next } = runWithToken(token)

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({ status: 401, message: "Token inválido" })
    )
  })

  it("rechaza token con sub no convertible a numero", () => {
    const token = jwt.sign({ sub: "abc" }, secret)

    const { next } = runWithToken(token)

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({ status: 401, message: "Token inválido" })
    )
  })

  it("rechaza token expirado", () => {
    const token = jwt.sign({ sub: 1 }, secret, { expiresIn: "-1s" })

    const { next } = runWithToken(token)

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({ status: 401, message: "Token expirado" })
    )
  })

  it("rechaza token malformado", () => {
    const { next } = runWithToken("token-malformado")

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({ status: 401, message: "Token inválido" })
    )
  })

  it("acepta token valido y adjunta userId", () => {
    const token = jwt.sign({ sub: "12" }, secret)

    const { req, next } = runWithToken(token)

    expect(req.userId).toBe(12)
    expect(next).toHaveBeenCalledWith()
  })
})

describe("errorHandler", () => {
  function createResponse(headersSent = false) {
    return {
      headersSent,
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    }
  }

  it("delega al siguiente middleware si los headers ya fueron enviados", () => {
    const err = new Error("late")
    const res = createResponse(true)
    const next = jest.fn()

    errorHandler(err, {}, res, next)

    expect(next).toHaveBeenCalledWith(err)
    expect(res.status).not.toHaveBeenCalled()
  })

  it("incluye detalles de AppError en la respuesta", () => {
    const res = createResponse()
    const next = jest.fn()
    const err = new AppError(400, "Datos invalidos", { fieldErrors: {} })

    errorHandler(err, {}, res, next)

    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({
      error: "Datos invalidos",
      details: { fieldErrors: {} },
    })
  })

  it("usa statusCode y mensaje de errores comunes", () => {
    const res = createResponse()
    const err = new Error("Soy tetera")
    err.statusCode = 418

    errorHandler(err, {}, res, jest.fn())

    expect(res.status).toHaveBeenCalledWith(418)
    expect(res.json).toHaveBeenCalledWith({ error: "Soy tetera" })
  })

  it("usa mensaje generico en errores no AppError sin message", () => {
    const res = createResponse()

    errorHandler({ statusCode: 400 }, {}, res, jest.fn())

    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({ error: "Error" })
  })

  it("registra errores 500 fuera de ambiente test", () => {
    const previous = process.env.NODE_ENV
    process.env.NODE_ENV = "development"
    const spy = jest.spyOn(console, "error").mockImplementation(() => {})
    const res = createResponse()

    errorHandler(new Error("boom"), {}, res, jest.fn())

    expect(spy).toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(500)
    expect(res.json).toHaveBeenCalledWith({
      error: "Error interno del servidor",
    })
    spy.mockRestore()
    process.env.NODE_ENV = previous
  })
})
