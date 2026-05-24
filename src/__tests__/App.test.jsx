import { act, render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import * as apiMod from "../lib/api.js"
import App from "../App.jsx"

describe("App", () => {
  beforeEach(() => {
    localStorage.clear()
    jest.spyOn(apiMod, "api").mockImplementation(async (path) => {
      if (path === "/auth/login") {
        return {
          token: "tok-login",
          user: { id: 2, nombre: "Ana", correo: "ana@test.com" },
        }
      }
      if (path === "/products") return []
      if (path === "/cart") return { items: [], subtotal: 0 }
      return null
    })
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it("sin sesión muestra la pantalla de inicio de sesión", () => {
    render(<App />)
    expect(
      screen.getByRole("heading", { name: /EcoMart/i })
    ).toBeInTheDocument()
    expect(screen.getByTestId("email")).toBeInTheDocument()
  })

  it("con sesión guardada muestra la tienda", async () => {
    localStorage.setItem("ecmart_token", "tok")
    localStorage.setItem(
      "ecmart_user",
      JSON.stringify({ id: 1, nombre: "Pepe", correo: "p@test.com" })
    )

    render(<App />)
    await waitFor(() => {
      expect(screen.getByTestId("shop-heading")).toBeInTheDocument()
    })
    expect(screen.getByTestId("user-greeting")).toHaveTextContent("Pepe")
  })

  it("ignora usuario guardado corrupto y muestra login", () => {
    localStorage.setItem("ecmart_token", "tok")
    localStorage.setItem("ecmart_user", "{json roto")

    render(<App />)

    expect(screen.getByTestId("email")).toBeInTheDocument()
  })

  it("permite navegar a registro y volver al login", async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole("button", { name: /Crear cuenta/i }))
    expect(screen.getByTestId("register-name")).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: /Iniciar sesi/i }))
    expect(screen.getByTestId("email")).toBeInTheDocument()
  })

  it("autentica desde login y luego cierra sesión", async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.type(screen.getByTestId("email"), "ana@test.com")
    await user.type(screen.getByTestId("password"), "12345678")
    await user.click(screen.getByTestId("login-btn"))

    await waitFor(() => {
      expect(screen.getByTestId("shop-heading")).toBeInTheDocument()
    })
    expect(localStorage.getItem("ecmart_token")).toBe("tok-login")

    await user.click(screen.getByTestId("logout-btn"))

    expect(localStorage.getItem("ecmart_token")).toBeNull()
    expect(screen.getByTestId("email")).toBeInTheDocument()
  })

  it("al expirar la sesión vuelve al login", async () => {
    localStorage.setItem("ecmart_token", "tok")
    localStorage.setItem(
      "ecmart_user",
      JSON.stringify({ id: 1, nombre: "Pepe", correo: "p@test.com" })
    )

    render(<App />)
    await waitFor(() => expect(screen.getByTestId("shop-heading")).toBeVisible())

    await act(async () => {
      window.dispatchEvent(new CustomEvent("ecmart:session-expired"))
    })

    await waitFor(() => {
      expect(screen.getByTestId("email")).toBeInTheDocument()
    })
  })
})
