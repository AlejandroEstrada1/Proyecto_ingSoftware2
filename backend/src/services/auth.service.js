const bcrypt = require("bcrypt")
const jwt = require("jsonwebtoken")
const { getDb } = require("../db")
const { AppError } = require("../errors/AppError")

const BCRYPT_ROUNDS = 10

/**
 * Registra un usuario con contraseña hasheada (bcrypt).
 * @param {{ nombre: string, correo: string, password: string }} input
 * @returns {{ id: number, nombre: string, correo: string }}
 */
function registerUser(input) {
  const db = getDb()
  const hash = bcrypt.hashSync(input.password, BCRYPT_ROUNDS)

  try {
    const info = db
      .prepare(
        "INSERT INTO users (nombre, correo, password_hash) VALUES (?, ?, ?)"
      )
      .run(input.nombre, input.correo, hash)

    return {
      id: Number(info.lastInsertRowid),
      nombre: input.nombre,
      correo: input.correo,
    }
  } catch (e) {
    if (e && e.code === "SQLITE_CONSTRAINT_UNIQUE") {
      throw new AppError(409, "El correo ya está registrado")
    }
    throw e
  }
}

/**
 * Valida credenciales y devuelve datos públicos del usuario.
 * @param {{ correo: string, password: string }} input
 * @returns {{ id: number, nombre: string, correo: string }}
 */
function loginUser(input) {
  const db = getDb()
  const row = db
    .prepare("SELECT id, nombre, correo, password_hash FROM users WHERE correo = ?")
    .get(input.correo)

  if (!row || !bcrypt.compareSync(input.password, row.password_hash)) {
    throw new AppError(401, "Credenciales incorrectas")
  }

  return {
    id: row.id,
    nombre: row.nombre,
    correo: row.correo,
  }
}

/**
 * Genera JWT firmado con expiración configurada por entorno.
 * @param {{ id: number, correo: string }} user
 */
function signToken(user) {
  const secret = process.env.JWT_SECRET
  if (!secret) {
    throw new AppError(500, "JWT_SECRET no configurado")
  }
  const expiresIn = process.env.JWT_EXPIRES_IN || "8h"
  return jwt.sign({ sub: user.id, correo: user.correo }, secret, { expiresIn })
}

module.exports = { registerUser, loginUser, signToken, BCRYPT_ROUNDS }
