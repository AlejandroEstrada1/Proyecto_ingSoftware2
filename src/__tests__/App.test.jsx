import { act, render, screen, waitFor } from "@testing-library/react"
import * as apiMod from "../lib/api.js"
import App from "../App.jsx"

describe("App", () => {
  beforeEach(() => {
    localStorage.clear()
    jest.spyOn(apiMod, "api").mockImplementation(async (path) => {
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
