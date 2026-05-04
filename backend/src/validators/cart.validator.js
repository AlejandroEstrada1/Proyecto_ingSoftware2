const { z } = require("zod")
const { AppError } = require("../errors/AppError")

const addItemSchema = z.object({
  productId: z.coerce.number().int().positive(),
  quantity: z.coerce.number().int().positive(),
})

const updateItemSchema = z.object({
  quantity: z.coerce.number().int().positive(),
})

/**
 * @param {unknown} body
 */
function parseAddCartItem(body) {
  const r = addItemSchema.safeParse(body)
  if (!r.success) {
    throw new AppError(400, "Datos de ítem inválidos", r.error.flatten())
  }
  return r.data
}

/**
 * @param {unknown} body
 */
function parseUpdateCartItem(body) {
  const r = updateItemSchema.safeParse(body)
  if (!r.success) {
    throw new AppError(400, "Cantidad inválida", r.error.flatten())
  }
  return r.data
}

/**
 * @param {string|undefined} idParam
 */
function parseCartItemIdParam(idParam) {
  const id = Number(idParam)
  if (!Number.isInteger(id) || id <= 0) {
    throw new AppError(400, "Identificador de ítem inválido")
  }
  return id
}

module.exports = { parseAddCartItem, parseUpdateCartItem, parseCartItemIdParam }
