import { test, expect } from "@playwright/test"
import { E2E_API_BASE } from "./constants.js"

/**
 * Escenario Gherkin (resumen):
 * Given un usuario autenticado en la tienda
 * When añade un producto al carrito y confirma el checkout simulado
 * Then recibe confirmación con número de pedido
 */
test("añadir ítem al carrito y checkout", async ({ page, request }) => {
  const email = `e2e_cart_${Date.now()}@example.com`

  const reg = await request.post(`${E2E_API_BASE}/auth/register`, {
    headers: { "Content-Type": "application/json" },
    data: JSON.stringify({
      nombre: "Comprador E2E",
      correo: email,
      password: "12345678",
    }),
  })
  if (!reg.ok()) {
    throw new Error(`Registro API ${reg.status()}: ${await reg.text()}`)
  }

  await page.goto("/")
  await page.getByTestId("email").fill(email)
  await page.getByTestId("password").fill("12345678")
  await page.getByTestId("login-btn").click()
  await expect(page.getByTestId("shop-heading")).toBeVisible()
  const addFirst = page.locator('[data-testid^="add-cart-"]').first()
  await addFirst.waitFor({ state: "visible" })
  await addFirst.click()
  /* Al añadir, la tienda abre el panel del carrito automáticamente */
  await expect(page.getByTestId("cart-total")).toBeVisible()

  await page.getByTestId("checkout-btn").click()
  await expect(page.getByRole("status")).toContainText("Pedido")
})
