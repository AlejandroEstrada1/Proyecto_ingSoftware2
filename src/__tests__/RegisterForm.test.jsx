import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import Registro from "../componentes/Registro.jsx"
import { api } from "../lib/api.js"
import { ApiError } from "../lib/apiTypes.js"

jest.mock("../lib/api.js", () => ({
  ...jest.requireActual("../lib/api.js"),
  api: jest.fn(),
}))

describe("RegisterForm (Registro)", () => {
  beforeEach(() => {
    jest.mocked(api).mockReset()
  })

  it("muestra nombre, correo, contraseña y confirmación", () => {
    render(<Registro onIrLogin={jest.fn()} />)

    expect(screen.getByTestId("register-name")).toBeInTheDocument()
    expect(screen.getByTestId("register-email")).toBeInTheDocument()
    expect(screen.getByTestId("register-password")).toBeInTheDocument()
    expect(screen.getByTestId("register-confirm")).toBeInTheDocument()
  })

  it("muestra error si el nombre tiene menos de 2 caracteres", async () => {
    const user = userEvent.setup()
    render(<Registro onIrLogin={jest.fn()} />)

    await user.type(screen.getByTestId("register-name"), "A")
    await user.type(screen.getByTestId("register-email"), "a@b.co")
    await user.type(screen.getByTestId("register-password"), "12345678")
    await user.type(screen.getByTestId("register-confirm"), "12345678")
    await user.click(screen.getByTestId("register-submit"))

    expect(await screen.findByTestId("error-message")).toHaveTextContent(
      "al menos 2 caracteres"
    )
    expect(api).not.toHaveBeenCalled()
  })

  it("muestra error si la contraseña tiene menos de 8 caracteres", async () => {
    const user = userEvent.setup()
    render(<Registro onIrLogin={jest.fn()} />)

    await user.type(screen.getByTestId("register-name"), "Ana")
    await user.type(screen.getByTestId("register-email"), "a@b.co")
    await user.type(screen.getByTestId("register-password"), "short")
    await user.type(screen.getByTestId("register-confirm"), "short")
    await user.click(screen.getByTestId("register-submit"))

    expect(await screen.findByTestId("error-message")).toHaveTextContent(
      "al menos 8 caracteres"
    )
    expect(api).not.toHaveBeenCalled()
  })

  it("muestra error de validación si las contraseñas no coinciden", async () => {
    const user = userEvent.setup()
    render(<Registro onIrLogin={jest.fn()} />)

    await user.type(screen.getByTestId("register-name"), "Ana López")
    await user.type(screen.getByTestId("register-email"), "ana@test.com")
    await user.type(screen.getByTestId("register-password"), "12345678")
    await user.type(screen.getByTestId("register-confirm"), "87654321")
    await user.click(screen.getByTestId("register-submit"))

    expect(await screen.findByTestId("error-message")).toHaveTextContent(
      "Las contraseñas no coinciden."
    )
    expect(api).not.toHaveBeenCalled()
  })

  it("muestra error genérico si la petición falla sin ApiError", async () => {
    const user = userEvent.setup()
    jest.mocked(api).mockRejectedValueOnce(new Error("timeout"))

    render(<Registro onIrLogin={jest.fn()} />)

    await user.type(screen.getByTestId("register-name"), "Ana López")
    await user.type(screen.getByTestId("register-email"), "ana@test.com")
    await user.type(screen.getByTestId("register-password"), "12345678")
    await user.type(screen.getByTestId("register-confirm"), "12345678")
    await user.click(screen.getByTestId("register-submit"))

    expect(
      await screen.findByTestId("error-message")
    ).toHaveTextContent("No se pudo conectar con el servidor.")
  })

  it("muestra error si el correo ya está registrado (API 409)", async () => {
    const user = userEvent.setup()
    jest
      .mocked(api)
      .mockRejectedValueOnce(new ApiError(409, "El correo ya está registrado"))

    render(<Registro onIrLogin={jest.fn()} />)

    await user.type(screen.getByTestId("register-name"), "Ana López")
    await user.type(screen.getByTestId("register-email"), "dup@test.com")
    await user.type(screen.getByTestId("register-password"), "12345678")
    await user.type(screen.getByTestId("register-confirm"), "12345678")
    await user.click(screen.getByTestId("register-submit"))

    expect(
      await screen.findByTestId("error-message")
    ).toHaveTextContent("El correo ya está registrado")
  })

  it("registra con datos válidos llamando al servicio /auth/register", async () => {
    const user = userEvent.setup()
    const onIrLogin = jest.fn()
    jest.mocked(api).mockResolvedValueOnce({
      user: { id: 9, nombre: "Ana", correo: "ana@test.com" },
      token: "t",
    })

    render(<Registro onIrLogin={onIrLogin} />)

    await user.type(screen.getByTestId("register-name"), "Ana López")
    await user.type(screen.getByTestId("register-email"), "ana@test.com")
    await user.type(screen.getByTestId("register-password"), "12345678")
    await user.type(screen.getByTestId("register-confirm"), "12345678")
    await user.click(screen.getByTestId("register-submit"))

    await waitFor(() => {
      expect(api).toHaveBeenCalledWith(
        "/auth/register",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({
            nombre: "Ana López",
            correo: "ana@test.com",
            password: "12345678",
          }),
        })
      )
    })

    await waitFor(() => {
      expect(
        screen.getByText(/Cuenta creada\. Redirigiendo al inicio de sesión/i)
      ).toBeInTheDocument()
    })

    await waitFor(
      () => {
        expect(onIrLogin).toHaveBeenCalled()
      },
      { timeout: 2500 }
    )
  })
})
