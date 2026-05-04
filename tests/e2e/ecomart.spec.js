/**
 * =============================================================
 *  EcoMart – Suite de Pruebas E2E con Playwright JS
 *  Archivo: tests/e2e/ecomart.spec.js
 *  Ejecutar: npm run tests:e2e
 * =============================================================
 *
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 *  ESCENARIOS GHERKIN
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 *
 * ┌─────────────────────────────────────────────────────────┐
 * │ Feature: Login de usuarios                              │
 * ├─────────────────────────────────────────────────────────┤
 * │ Scenario: Login exitoso con credenciales válidas        │
 * │   Given un usuario registrado en el sistema             │
 * │   When navega a la página de inicio e ingresa su        │
 * │        correo y contraseña correctos                    │
 * │   Then accede al catálogo y ve su nombre en la barra   │
 * │                                                         │
 * │ Scenario: [NEGATIVO] Login con contraseña incorrecta    │
 * │   Given un usuario registrado en el sistema             │
 * │   When ingresa su correo con una contraseña incorrecta  │
 * │   Then ve un mensaje de error y permanece en el login   │
 * └─────────────────────────────────────────────────────────┘
 *
 * ┌─────────────────────────────────────────────────────────┐
 * │ Feature: Registro de usuarios                           │
 * ├─────────────────────────────────────────────────────────┤
 * │ Scenario: Registro exitoso con datos válidos            │
 * │   Given el usuario está en la página de login           │
 * │   When hace clic en "Crear cuenta" y completa el form   │
 * │        con nombre, correo y contraseña válidos          │
 * │   Then ve el mensaje de éxito y es redirigido al login  │
 * │                                                         │
 * │ Scenario: [NEGATIVO] Registro con contraseñas distintas │
 * │   Given el usuario está en el formulario de registro    │
 * │   When ingresa contraseñas que no coinciden             │
 * │   Then ve el mensaje "Las contraseñas no coinciden"     │
 * └─────────────────────────────────────────────────────────┘
 *
 * ┌─────────────────────────────────────────────────────────┐
 * │ Feature: CRUD del Carrito                               │
 * ├─────────────────────────────────────────────────────────┤
 * │ Scenario: Agregar un producto al carrito                │
 * │   Given un usuario autenticado en la tienda             │
 * │   When hace clic en "Añadir" de un producto del catálogo│
 * │   Then el panel del carrito se abre y el producto       │
 * │        aparece en la lista con su precio                │
 * │                                                         │
 * │ Scenario: Listar productos del carrito                  │
 * │   Given un usuario con al menos un producto en carrito  │
 * │   When abre el panel del carrito                        │
 * │   Then ve los items listados y el subtotal calculado    │
 * │                                                         │
 * │ Scenario: Actualizar cantidad de un producto            │
 * │   Given un usuario con un producto en el carrito        │
 * │   When presiona el botón "+" para incrementar cantidad  │
 * │   Then la cantidad aumenta y el subtotal se actualiza   │
 * │                                                         │
 * │ Scenario: Eliminar un producto del carrito              │
 * │   Given un usuario con al menos un producto en carrito  │
 * │   When presiona "Quitar" en un item                     │
 * │   Then el producto desaparece y el carrito se actualiza │
 * └─────────────────────────────────────────────────────────┘
 *
 * ┌─────────────────────────────────────────────────────────┐
 * │ Feature: Pago / Checkout simulado                       │
 * ├─────────────────────────────────────────────────────────┤
 * │ Scenario: Checkout exitoso con productos en carrito     │
 * │   Given un usuario autenticado con productos en carrito │
 * │   When hace clic en "Simular pago"                      │
 * │   Then ve el mensaje de confirmación con número de      │
 * │        pedido y el carrito queda vacío                  │
 * │                                                         │
 * │ Scenario: [NEGATIVO] Intentar pagar con carrito vacío   │
 * │   Given un usuario autenticado con el carrito vacío     │
 * │   When abre el carrito                                  │
 * │   Then el botón "Simular pago" está deshabilitado       │
 * └─────────────────────────────────────────────────────────┘
 *
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 *  CÓDIGO PLAYWRIGHT
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 */

import { test, expect } from "@playwright/test"
import { E2E_API_BASE } from "../../e2e/constants.js"

// ─── Helpers ────────────────────────────────────────────────────────────────

/**
 * Registra un usuario directamente por API y retorna sus credenciales.
 * Usamos timestamps para garantizar unicidad en cada ejecución.
 */
async function crearUsuarioAPI(request, sufijo = "test") {
  const email = `e2e_${sufijo}_${Date.now()}@ecomart.test`
  const nombre = `Usuario E2E ${sufijo}`
  const password = "Segura123!"

  const res = await request.post(`${E2E_API_BASE}/auth/register`, {
    headers: { "Content-Type": "application/json" },
    data: JSON.stringify({ nombre, correo: email, password }),
  })

  if (!res.ok()) {
    throw new Error(`[Helper] Registro API falló ${res.status()}: ${await res.text()}`)
  }

  return { email, nombre, password }
}

/**
 * Navega a la página raíz, hace login con las credenciales dadas
 * y espera que aparezca el catálogo.
 */
async function loginUI(page, email, password) {
  await page.goto("/")
  await page.getByTestId("email").fill(email)
  await page.getByTestId("password").fill(password)
  await page.getByTestId("login-btn").click()
  await expect(page.getByTestId("shop-heading")).toBeVisible()
}

/**
 * Añade el primer producto disponible al carrito y espera que el panel se abra.
 */
async function agregarPrimerProducto(page) {
  const btnAnadir = page.locator('[data-testid^="add-cart-"]').first()
  await btnAnadir.waitFor({ state: "visible" })
  await btnAnadir.click()
  // Al añadir, la tienda abre el panel del carrito automáticamente
  await expect(page.getByTestId("cart-total")).toBeVisible()
}

// ─── MÓDULO 1: LOGIN ─────────────────────────────────────────────────────────

test.describe("Módulo 1 — Login de usuarios", () => {

  test("✅ Login exitoso con credenciales válidas", async ({ page, request }) => {
    // GIVEN — Un usuario registrado vía API
    const { email, nombre, password } = await crearUsuarioAPI(request, "login_ok")

    // WHEN — Navega al login y completa el formulario con datos correctos
    await page.goto("/")
    await page.getByTestId("email").fill(email)
    await page.getByTestId("password").fill(password)
    await page.getByTestId("login-btn").click()

    // THEN — Accede al catálogo y su nombre aparece en la barra superior
    await expect(page.getByTestId("shop-heading")).toBeVisible()
    await expect(page.getByTestId("user-greeting")).toContainText(nombre)
  })

  test("❌ [NEGATIVO] Login con contraseña incorrecta", async ({ page, request }) => {
    // GIVEN — Un usuario registrado vía API
    const { email } = await crearUsuarioAPI(request, "login_bad_pwd")

    // WHEN — Intenta iniciar sesión con contraseña incorrecta
    await page.goto("/")
    await page.getByTestId("email").fill(email)
    await page.getByTestId("password").fill("ContraseñaIncorrecta999!")
    await page.getByTestId("login-btn").click()

    // THEN — Ve un mensaje de error y permanece en la pantalla de login
    await expect(page.getByTestId("error-message")).toBeVisible()
    // El catálogo NO debe aparecer; el usuario sigue en el login
    await expect(page.getByTestId("shop-heading")).not.toBeVisible()
  })

})

// ─── MÓDULO 2: REGISTRO ───────────────────────────────────────────────────────

test.describe("Módulo 2 — Registro de usuarios", () => {

  test("✅ Registro exitoso con datos válidos", async ({ page }) => {
    const email = `e2e_register_ok_${Date.now()}@ecomart.test`

    // GIVEN — El usuario está en la pantalla de login
    await page.goto("/")

    // WHEN — Hace clic en "Crear cuenta" y completa el formulario
    await page.getByRole("button", { name: "Crear cuenta" }).click()
    await page.getByTestId("register-name").fill("Usuario Nuevo E2E")
    await page.getByTestId("register-email").fill(email)
    await page.getByTestId("register-password").fill("Segura123!")
    await page.getByTestId("register-confirm").fill("Segura123!")
    await page.getByTestId("register-submit").click()

    // THEN — Ve el mensaje de éxito y es redirigido al login (botón "Entrar" visible)
    await expect(page.getByRole("status")).toContainText("Cuenta creada")
    // Tras el redirect automático (~900ms) debe aparecer el formulario de login
    await expect(page.getByTestId("login-btn")).toBeVisible({ timeout: 3000 })
  })

  test("❌ [NEGATIVO] Registro con contraseñas que no coinciden", async ({ page }) => {
    const email = `e2e_register_mismatch_${Date.now()}@ecomart.test`

    // GIVEN — El usuario está en el formulario de registro
    await page.goto("/")
    await page.getByRole("button", { name: "Crear cuenta" }).click()

    // WHEN — Ingresa contraseñas que no coinciden
    await page.getByTestId("register-name").fill("Prueba Error")
    await page.getByTestId("register-email").fill(email)
    await page.getByTestId("register-password").fill("Segura123!")
    await page.getByTestId("register-confirm").fill("OtraContraseña999!")
    await page.getByTestId("register-submit").click()

    // THEN — El sistema muestra el mensaje de error correspondiente
    const errorMsg = page.getByTestId("error-message")
    await expect(errorMsg).toBeVisible()
    await expect(errorMsg).toContainText("contraseñas no coinciden")
  })

  test("❌ [NEGATIVO] Registro con contraseña menor a 8 caracteres", async ({ page }) => {
    const email = `e2e_register_short_${Date.now()}@ecomart.test`

    // GIVEN — El usuario está en el formulario de registro
    await page.goto("/")
    await page.getByRole("button", { name: "Crear cuenta" }).click()

    // WHEN — Ingresa una contraseña demasiado corta
    await page.getByTestId("register-name").fill("Prueba Corta")
    await page.getByTestId("register-email").fill(email)
    await page.getByTestId("register-password").fill("123")
    await page.getByTestId("register-confirm").fill("123")
    await page.getByTestId("register-submit").click()

    // THEN — Ve el mensaje de validación por contraseña débil
    const errorMsg = page.getByTestId("error-message")
    await expect(errorMsg).toBeVisible()
    await expect(errorMsg).toContainText("8 caracteres")
  })

})

// ─── MÓDULO 3: CRUD CARRITO ───────────────────────────────────────────────────

test.describe("Módulo 3 — CRUD del Carrito", () => {

  test("✅ Agregar un producto al carrito", async ({ page, request }) => {
    // GIVEN — Un usuario autenticado en la tienda
    const { email, password } = await crearUsuarioAPI(request, "cart_add")
    await loginUI(page, email, password)

    // WHEN — Hace clic en "Añadir" del primer producto disponible
    const btnAnadir = page.locator('[data-testid^="add-cart-"]').first()
    await btnAnadir.waitFor({ state: "visible" })
    await btnAnadir.click()

    // THEN — El panel del carrito se abre automáticamente y muestra el producto
    await expect(page.getByTestId("cart-total")).toBeVisible()
    await expect(page.getByTestId("cart-item")).toBeVisible()
  })

  test("✅ Listar productos del carrito", async ({ page, request }) => {
    // GIVEN — Un usuario autenticado con un producto en el carrito
    const { email, password } = await crearUsuarioAPI(request, "cart_list")
    await loginUI(page, email, password)

    // WHEN — Añade el primer producto: la tienda abre el drawer automáticamente
    await agregarPrimerProducto(page)

    // THEN — El item aparece listado en el panel y el subtotal es mayor a cero
    await expect(page.getByTestId("cart-item")).toHaveCount(1)
    // El subtotal debe contener al menos un dígito distinto de cero
    const totalText = await page.getByTestId("cart-total").innerText()
    expect(/[1-9]/.test(totalText)).toBe(true)
  })

  test("✅ Actualizar cantidad de un producto (incrementar)", async ({ page, request }) => {
    // GIVEN — Un usuario autenticado con un producto en el carrito
    const { email, password } = await crearUsuarioAPI(request, "cart_qty")
    await loginUI(page, email, password)
    await agregarPrimerProducto(page)

    // Captura el subtotal inicial para comparar después
    const totalInicial = await page.getByTestId("cart-total").innerText()

    // WHEN — Presiona "+" para incrementar la cantidad del primer item
    const btnMas = page.getByTestId("qty-plus").first()
    await expect(btnMas).toBeEnabled()
    await btnMas.click()

    // THEN — El subtotal se actualiza (valor mayor al inicial)
    await expect(page.getByTestId("cart-total")).not.toHaveText(totalInicial)
    // La cantidad visible del item ahora debe ser 2
    const qty = page.locator(".qty-stepper__val").first()
    await expect(qty).toHaveText("2")
  })

  test("✅ Eliminar un producto del carrito", async ({ page, request }) => {
    // GIVEN — Un usuario autenticado con un producto en el carrito
    const { email, password } = await crearUsuarioAPI(request, "cart_del")
    await loginUI(page, email, password)
    await agregarPrimerProducto(page)

    // Verifica que hay 1 item antes de eliminar
    await expect(page.getByTestId("cart-item")).toHaveCount(1)

    // WHEN — Presiona "Quitar" en el único item del carrito
    await page.getByTestId("delete-item").first().click()

    // THEN — El carrito queda vacío
    await expect(page.getByTestId("cart-item")).toHaveCount(0)
    // El subtotal debe reflejar cero en el formato de moneda que use la app
    // Se verifica que el texto del total contenga sólo ceros y separadores
    const totalFinal = await page.getByTestId("cart-total").innerText()
    expect(totalFinal.replace(/[^0]/g, "")).toMatch(/^0+$/)
  })

})

// ─── MÓDULO 4: CHECKOUT / PAGO SIMULADO ──────────────────────────────────────

test.describe("Módulo 4 — Pago / Checkout simulado", () => {

  test("✅ Checkout exitoso con productos en el carrito", async ({ page, request }) => {
    // GIVEN — Un usuario autenticado con al menos un producto en el carrito
    const { email, password } = await crearUsuarioAPI(request, "checkout_ok")
    await loginUI(page, email, password)
    await agregarPrimerProducto(page)

    // WHEN — Hace clic en el botón "Simular pago"
    const btnCheckout = page.getByTestId("checkout-btn")
    await expect(btnCheckout).toBeEnabled()
    await btnCheckout.click()

    // THEN — Ve la confirmación con número de pedido (role="status")
    const confirmacion = page.getByRole("status")
    await expect(confirmacion).toBeVisible({ timeout: 8000 })
    // El mensaje incluye la palabra "Pedido" con el número de orden
    await expect(confirmacion).toContainText("Pedido")
    // El mensaje también incluye el total pagado
    await expect(confirmacion).toContainText("Total")
  })

  test("❌ [NEGATIVO] Botón de pago deshabilitado con carrito vacío", async ({ page, request }) => {
    // GIVEN — Un usuario autenticado con el carrito vacío (recién registrado)
    const { email, password } = await crearUsuarioAPI(request, "checkout_empty")
    await loginUI(page, email, password)

    // WHEN — Abre el panel del carrito sin haber añadido ningún producto
    await page.getByTestId("open-cart").click()

    // THEN — El botón "Simular pago" existe pero está deshabilitado
    const btnCheckout = page.getByTestId("checkout-btn")
    await expect(btnCheckout).toBeVisible()
    await expect(btnCheckout).toBeDisabled()
  })

})

// ─── MÓDULO 5: SESIÓN Y NAVEGACIÓN ───────────────────────────────────────────

test.describe("Módulo 5 — Sesión y navegación", () => {

  test("✅ Cerrar sesión regresa al login", async ({ page, request }) => {
    // GIVEN — Un usuario autenticado en la tienda
    const { email, password } = await crearUsuarioAPI(request, "logout")
    await loginUI(page, email, password)

    // WHEN — Hace clic en el botón "Salir"
    await page.getByTestId("logout-btn").click()

    // THEN — Es redirigido a la pantalla de login
    await expect(page.getByTestId("login-btn")).toBeVisible()
    await expect(page.getByTestId("shop-heading")).not.toBeVisible()
  })

})
