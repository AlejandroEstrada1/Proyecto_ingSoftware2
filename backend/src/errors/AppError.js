/**
 * Error HTTP controlado con código de estado y detalles opcionales para la API.
 * @param {number} status Código HTTP (400, 401, 404, 409, 500, …)
 * @param {string} message Mensaje corto para el cliente
 * @param {unknown} [details] Información adicional (p. ej. errores de validación)
 */
class AppError extends Error {
  constructor(status, message, details) {
    super(message)
    this.name = "AppError"
    this.status = status
    this.details = details
  }
}

module.exports = { AppError }
