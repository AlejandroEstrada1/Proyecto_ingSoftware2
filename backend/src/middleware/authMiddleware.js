const jwt = require("jsonwebtoken")
const { AppError } = require("../errors/AppError")

/**
 * Verifica Bearer JWT y adjunta req.userId (sub del token).
 */
function authMiddleware(req, res, next) {
  const header = req.headers.authorization
  if (!header || !header.startsWith("Bearer ")) {
    return next(new AppError(401, "Token no proporcionado"))
  }

  const token = header.slice(7)
  const secret = process.env.JWT_SECRET
  if (!secret) {
    return next(new AppError(500, "Configuración JWT ausente"))
  }

  try {
    const payload = jwt.verify(token, secret)
    if (typeof payload.sub !== "number" && typeof payload.sub !== "string") {
      return next(new AppError(401, "Token inválido"))
    }
    req.userId = Number(payload.sub)
    if (!Number.isFinite(req.userId)) {
      return next(new AppError(401, "Token inválido"))
    }
    next()
  } catch (e) {
    if (e.name === "TokenExpiredError") {
      return next(new AppError(401, "Token expirado"))
    }
    return next(new AppError(401, "Token inválido"))
  }
}

module.exports = { authMiddleware }
