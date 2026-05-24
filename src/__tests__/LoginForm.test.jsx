import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import Login from "../componentes/Login.jsx"
import { api } from "../lib/api.js"
import { ApiError } from "../lib/apiTypes.js"

jest.mock("../lib/api.js", () => ({
  ...jest.requireActual("../lib/api.js"),
  api: jest.fn(),
}))

describe("LoginForm (Login)", () => {
  const user = userEvent.setup()

  beforeEach(() => {
    jest.mocked(api).mockReset()
    localStorage.clear()
  })

  it("muestra campos de correo, contraseña y botón de envío", () => {
    render(
      <Login onIrRegistro={jest.fn()} onAutenticado={jest.fn()} />
    )

    expect(screen.getByTestId("email")).toBeInTheDocument()
    expect(screen.getByTestId("password")).toBeInTheDocument()
    expect(screen.getByTestId("login-btn")).toBeInTheDocument()
  })

  it("muestra error al enviar el formulario vacío", async () => {
    render(
      <Login onIrRegistro={jest.fn()} onAutenticado={jest.fn()} />
    )

    await user.click(screen.getByTestId("login-btn"))

    expect(await screen.findByTestId("error-message")).toHaveTextContent(
      "Completa correo y contraseña."
    )
    expect(api).not.toHaveBeenCalled()
  })

  it("llama al servicio de login con credenciales válidas y autentica", async () => {
    const onAutenticado = jest.fn()
    jest.mocked(api).mockResolvedValueOnce({
      token: "fake-token",
      user: { id: 1, nombre: "Ana", correo: "ana@test.com" },
    })

    render(
      <Login onIrRegistro={jest.fn()} onAutenticado={onAutenticado} />
    )

    await user.type(screen.getByTestId("email"), "ana@test.com")
    await user.type(screen.getByTestId("password"), "12345678")
    await user.click(screen.getByTestId("login-btn"))

    await waitFor(() => {
      expect(api).toHaveBeenCalledWith(
        "/auth/login",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({
            correo: "ana@test.com",
            password: "12345678",
          }),
        })
      )
    })
    await waitFor(() => {
      expect(onAutenticado).toHaveBeenCalledWith(
        expect.objectContaining({ correo: "ana@test.com" })
      )
    })
  })

  it("muestra error genérico si la red falla (no ApiError)", async () => {
    jest.mocked(api).mockRejectedValueOnce(new Error("fallo de red"))

    render(
      <Login onIrRegistro={jest.fn()} onAutenticado={jest.fn()} />
    )

    await user.type(screen.getByTestId("email"), "x@test.com")
    await user.type(screen.getByTestId("password"), "87654321")
    await user.click(screen.getByTestId("login-btn"))

    expect(
      await screen.findByTestId("error-message")
    ).toHaveTextContent("No se pudo conectar con el servidor.")
  })

  it("muestra mensaje de error cuando el login falla (API)", async () => {
    jest
      .mocked(api)
      .mockRejectedValueOnce(new ApiError(401, "Credenciales incorrectas"))

    render(
      <Login onIrRegistro={jest.fn()} onAutenticado={jest.fn()} />
    )

    await user.type(screen.getByTestId("email"), "x@test.com")
    await user.type(screen.getByTestId("password"), "87654321")
    await user.click(screen.getByTestId("login-btn"))

    expect(
      await screen.findByTestId("error-message")
    ).toHaveTextContent("Credenciales incorrectas")
  })
})
