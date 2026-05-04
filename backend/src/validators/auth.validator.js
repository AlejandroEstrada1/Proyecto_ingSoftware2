const { z } = require("zod")
const { AppError } = require("../errors/AppError")

const registerSchema = z.object({
  nombre: z.string().trim().min(2, "El nombre debe tener al menos 2 caracteres").max(120),
  correo: z.string().trim().email("Correo no válido").max(255),
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres").max(128),
})

const loginSchema = z.object({
  correo: z.string().trim().email("Correo no válido").max(255),
  password: z.string().min(1, "La contraseña es obligatoria").max(128),
})

/**
 * @param {unknown} body
 * @returns {{ nombre: string, correo: string, password: string }}
 */
function parseRegister(body) {
  const r = registerSchema.safeParse(body)
  if (!r.success) {
    throw new AppError(400, "Datos de registro inválidos", r.error.flatten())
  }
  return r.data
}

/**
 * @param {unknown} body
 * @returns {{ correo: string, password: string }}
 */
function parseLogin(body) {
  const r = loginSchema.safeParse(body)
  if (!r.success) {
    throw new AppError(400, "Datos de login inválidos", r.error.flatten())
  }
  return r.data
}

module.exports = { parseRegister, parseLogin, registerSchema, loginSchema }
