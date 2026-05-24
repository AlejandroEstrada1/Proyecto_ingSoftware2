import { test, expect } from "@playwright/test"

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
