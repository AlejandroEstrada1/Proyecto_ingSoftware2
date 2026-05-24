import { test, expect } from "@playwright/test"
import { E2E_API_BASE } from "./constants.js"

test("flujo de registro de usuario", async ({ page }) => {
  const email = `e2e_register_${Date.now()}@example.com`

  await page.goto("/")
  await page.getByRole("button", { name: "Crear cuenta" }).click()
  await page.getByTestId("register-name").fill("Usuario Registro E2E")
  await page.getByTestId("register-email").fill(email)
  await page.getByTestId("register-password").fill("12345678")
  await page.getByTestId("register-confirm").fill("12345678")
  await page.getByTestId("register-submit").click()

  await expect(page.getByRole("status")).toContainText("Cuenta creada")
  await expect(page.getByTestId("login-btn")).toBeVisible({ timeout: 3000 })
})

test("registro valida confirmacion de contraseña", async ({ page }) => {
  await page.goto("/")
  await page.getByRole("button", { name: "Crear cuenta" }).click()
  await page.getByTestId("register-name").fill("Usuario Registro Error")
  await page.getByTestId("register-email").fill(`e2e_bad_${Date.now()}@example.com`)
  await page.getByTestId("register-password").fill("12345678")
  await page.getByTestId("register-confirm").fill("87654321")
  await page.getByTestId("register-submit").click()

  await expect(page.getByTestId("error-message")).toContainText(
    "Las contraseñas no coinciden."
  )
})

test("registro rechaza correo ya existente", async ({ page, request }) => {
  const email = `e2e_duplicate_${Date.now()}@example.com`
  const password = "12345678"

  const reg = await request.post(`${E2E_API_BASE}/auth/register`, {
    headers: { "Content-Type": "application/json" },
    data: JSON.stringify({
      nombre: "Usuario Duplicado",
      correo: email,
      password,
    }),
  })
  if (!reg.ok()) {
    throw new Error(`Registro API ${reg.status()}: ${await reg.text()}`)
  }

  await page.goto("/")
  await page.getByRole("button", { name: "Crear cuenta" }).click()
  await page.getByTestId("register-name").fill("Usuario Duplicado")
  await page.getByTestId("register-email").fill(email)
  await page.getByTestId("register-password").fill(password)
  await page.getByTestId("register-confirm").fill(password)
  await page.getByTestId("register-submit").click()

  await expect(page.getByTestId("error-message")).toContainText(
    "El correo ya está registrado"
  )
})
