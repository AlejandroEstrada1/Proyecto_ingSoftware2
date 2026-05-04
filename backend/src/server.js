require("dotenv").config()

const { createApp } = require("./app")
const { initDatabase } = require("./db")

/**
 * Solo desarrollo / demos locales: permite arrancar sin .env (Sonar: sustituir en producción).
 * En producción define siempre JWT_SECRET en el entorno.
 */
if (!process.env.JWT_SECRET && process.env.NODE_ENV !== "production") {
  process.env.JWT_SECRET =
    "dev-only-jwt-secret-minimum-32-characters-long!!"
  if (process.env.NODE_ENV !== "test") {
    console.warn(
      "[EcoMart] JWT_SECRET no definido; usando valor de desarrollo local."
    )
  }
}

initDatabase()
const app = createApp()

const PORT = Number(process.env.PORT) || 3001

app.listen(PORT, () => {
  console.log(`EcoMart API en http://localhost:${PORT}`)
})

module.exports = { app }
