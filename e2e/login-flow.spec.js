import { test, expect } from "@playwright/test"
import { E2E_API_BASE } from "./constants.js"

/**
 * Escenario Gherkin (resumen):
 * Given un usuario registrado vía API
 * When envía el formulario de login con credenciales válidas
 * Then accede a la tienda y ve su nombre en la barra superior
 */
test("flujo de login", async ({ page, request }) => {
  const email = `e2e_login_${Date.now()}@example.com`
  const nombre = "Usuario E2E Login"

  const reg = await request.post(`${E2E_API_BASE}/auth/register`, {
    headers: { "Content-Type": "application/json" },
    data: JSON.stringify({
      nombre,
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
  await expect(page.getByTestId("user-greeting")).toContainText(nombre)
})

test("login rechaza credenciales incorrectas", async ({ page }) => {
  await page.goto("/")
  await page.getByTestId("email").fill(`no_existe_${Date.now()}@example.com`)
  await page.getByTestId("password").fill("password-incorrecto")
  await page.getByTestId("login-btn").click()

  await expect(page.getByTestId("error-message")).toContainText(
    "Credenciales incorrectas"
  )
})

test("cierre de sesion retorna al formulario de login", async ({
  page,
  request,
}) => {
  const email = `e2e_logout_${Date.now()}@example.com`
  const nombre = "Usuario E2E Logout"

  const reg = await request.post(`${E2E_API_BASE}/auth/register`, {
    headers: { "Content-Type": "application/json" },
    data: JSON.stringify({
      nombre,
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

  await page.getByTestId("logout-btn").click()

  await expect(page.getByTestId("login-btn")).toBeVisible()
  await expect(page.getByTestId("email")).toBeVisible()
})
