import { test, expect } from "@playwright/test"
import { E2E_API_BASE } from "./constants.js"

async function crearUsuario(request, suffix) {
  const email = `e2e_${suffix}_${Date.now()}@example.com`
  const password = "12345678"

  const res = await request.post(`${E2E_API_BASE}/auth/register`, {
    headers: { "Content-Type": "application/json" },
    data: JSON.stringify({
      nombre: "Comprador E2E",
      correo: email,
      password,
    }),
  })
  if (!res.ok()) {
    throw new Error(`Registro API ${res.status()}: ${await res.text()}`)
  }

  return { email, password }
}

async function login(page, email, password) {
  await page.goto("/")
  await page.getByTestId("email").fill(email)
  await page.getByTestId("password").fill(password)
  await page.getByTestId("login-btn").click()
  await expect(page.getByTestId("shop-heading")).toBeVisible()
}

async function agregarPrimerProducto(page) {
  const addFirst = page.locator('[data-testid^="add-cart-"]').first()
  await addFirst.waitFor({ state: "visible" })
  await addFirst.click()
  await expect(page.getByTestId("cart-total")).toBeVisible()
  await expect(page.getByTestId("cart-item")).toBeVisible()
}

test("agregar y eliminar producto del carrito", async ({ page, request }) => {
  const { email, password } = await crearUsuario(request, "cart_delete")

  await login(page, email, password)
  await agregarPrimerProducto(page)
  await page.getByTestId("delete-item").click()

  await expect(page.getByTestId("cart-item")).toHaveCount(0)
  await expect(page.getByText(/Carrito vac/i)).toBeVisible()
})

test("editar cantidades del carrito recalcula el total", async ({
  page,
  request,
}) => {
  const { email, password } = await crearUsuario(request, "cart_quantity")

  await login(page, email, password)
  await agregarPrimerProducto(page)
  const quantity = page.locator(".qty-stepper__val")

  await page.getByTestId("qty-plus").click()
  await expect(quantity).toHaveText("2")

  await page.getByTestId("qty-minus").click()
  await expect(quantity).toHaveText("1")
})

test("vaciar carrito elimina todos los productos", async ({ page, request }) => {
  const { email, password } = await crearUsuario(request, "cart_clear")

  await login(page, email, password)
  await agregarPrimerProducto(page)
  await page.getByTestId("clear-cart-btn").click()

  await expect(page.getByTestId("cart-item")).toHaveCount(0)
  await expect(page.getByText(/Carrito vac/i)).toBeVisible()
  await expect(page.getByTestId("cart-total")).toContainText("0,00")
})

test("carrito persiste despues de cerrar sesion y volver a entrar", async ({
  page,
  request,
}) => {
  const { email, password } = await crearUsuario(request, "cart_persistence")

  await login(page, email, password)
  await agregarPrimerProducto(page)
  await page.getByLabel("Cerrar carrito").click()
  await page.getByTestId("logout-btn").click()
  await expect(page.getByTestId("login-btn")).toBeVisible()

  await login(page, email, password)
  await page.getByTestId("open-cart").click()

  await expect(page.getByTestId("cart-item")).toBeVisible()
  await expect(page.getByTestId("cart-total")).not.toContainText("0,00")
})

test("checkout valida datos de tarjeta antes de pagar", async ({
  page,
  request,
}) => {
  const { email, password } = await crearUsuario(request, "cart_payment_error")

  await login(page, email, password)
  await agregarPrimerProducto(page)
  await page.getByTestId("checkout-btn").click()
  await page.getByTestId("payment-cardholder").fill("Comprador E2E")
  await page.getByTestId("payment-card").fill("123")
  await page.getByTestId("payment-expiry").fill("12/99")
  await page.getByTestId("payment-cvv").fill("123")
  await page.getByTestId("confirm-payment-btn").click()

  await expect(page.getByTestId("payment-error")).toContainText("16 digitos")
})

test("agregar item al carrito y pagar checkout simulado", async ({
  page,
  request,
}) => {
  const { email, password } = await crearUsuario(request, "cart_checkout")

  await login(page, email, password)
  await agregarPrimerProducto(page)
  await page.getByTestId("checkout-btn").click()
  await page.getByTestId("payment-cardholder").fill("Comprador E2E")
  await page.getByTestId("payment-card").fill("4111111111111111")
  await page.getByTestId("payment-expiry").fill("12/99")
  await page.getByTestId("payment-cvv").fill("123")
  await page.getByTestId("confirm-payment-btn").click()

  await expect(page.getByRole("status")).toContainText("Pedido")
  await expect(page.getByRole("status")).toContainText("Total")
  await expect(page.getByTestId("last-order-summary")).toContainText("1111")
})
