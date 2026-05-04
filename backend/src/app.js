const express = require("express")
const cors = require("cors")
const { errorHandler } = require("./middleware/errorHandler")
const authRoutes = require("./routes/auth.routes")
const cartRoutes = require("./routes/cart.routes")
const productRoutes = require("./routes/product.routes")

/**
 * Crea la aplicación Express con rutas REST y manejo de errores.
 */
/**
 * El paquete `cors` no aplica bien `RegExp` como `origin`; usamos función explícita.
 * Así el front en http://localhost:PUERTO puede llamar a http://127.0.0.1:3001.
 */
function resolveCorsOrigin(origin, callback) {
  if (!origin) {
    return callback(null, true)
  }
  const devLocal =
    /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(origin) === true
  if (devLocal) {
    return callback(null, true)
  }
  const list = (process.env.CORS_ORIGIN || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
  if (list.length && list.includes(origin)) {
    return callback(null, true)
  }
  return callback(null, false)
}

function createApp() {
  const app = express()

  app.use(
    cors({
      origin: resolveCorsOrigin,
      credentials: true,
    })
  )
  app.use(express.json({ limit: "64kb" }))

  app.get("/health", (req, res) => {
    res.json({ ok: true, service: "EcoMart API" })
  })

  app.use("/auth", authRoutes)
  app.use("/cart", cartRoutes)
  app.use("/products", productRoutes)

  app.use((req, res) => {
    res.status(404).json({ error: "Ruta no encontrada" })
  })

  app.use(errorHandler)

  return app
}

module.exports = { createApp }
