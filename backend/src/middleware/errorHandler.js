const { AppError } = require("../errors/AppError")

/**
 * Middleware central de errores: respuestas JSON consistentes y sin filtrar stack en producción.
 */
function errorHandler(err, req, res, next) {
  if (res.headersSent) {
    return next(err)
  }

  const status = err instanceof AppError ? err.status : err.statusCode || 500
  const message =
    err instanceof AppError
      ? err.message
      : status === 500
        ? "Error interno del servidor"
        : err.message || "Error"

  const body = { error: message }
  if (err instanceof AppError && err.details !== undefined) {
    body.details = err.details
  }

  if (process.env.NODE_ENV !== "test" && status === 500) {
    console.error(err)
  }

  res.status(status).json(body)
}

module.exports = { errorHandler }
