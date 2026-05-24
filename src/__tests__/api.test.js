import { ApiError, formatValidationDetails } from "../lib/apiTypes.js"

describe("api helpers", () => {
  it("formatValidationDetails concatena mensajes de fieldErrors", () => {
    const text = formatValidationDetails({
      fieldErrors: {
        correo: ["Correo no válido"],
        password: ["Muy corta"],
      },
      formErrors: [],
    })
    expect(text).toContain("Correo no válido")
    expect(text).toContain("Muy corta")
  })

  it("formatValidationDetails devuelve cadena vacía sin detalles", () => {
    expect(formatValidationDetails(undefined)).toBe("")
    expect(formatValidationDetails({})).toBe("")
  })

  it("formatValidationDetails ignora valores que no son mensajes validos", () => {
    const text = formatValidationDetails({
      fieldErrors: {
        correo: "no-array",
        password: ["", "  ", 123, "Muy corta"],
      },
    })

    expect(text).toBe("Muy corta")
  })

  it("ApiError conserva status y details", () => {
    const err = new ApiError(400, "Bad", { a: 1 })
    expect(err.status).toBe(400)
    expect(err.message).toBe("Bad")
    expect(err.details).toEqual({ a: 1 })
  })
})
