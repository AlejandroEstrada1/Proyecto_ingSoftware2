const { z } = require("zod")
const { AppError } = require("../errors/AppError")

const addItemSchema = z.object({
  productId: z.coerce.number().int().positive(),
  quantity: z.coerce.number().int().positive(),
})

const updateItemSchema = z.object({
  quantity: z.coerce.number().int().positive(),
})

const checkoutSchema = z.object({
  payment: z.object({
    cardholder: z.string().trim().min(3).max(120),
    cardNumber: z.string().regex(/^\d{16}$/),
    expiry: z
      .string()
      .regex(/^(0[1-9]|1[0-2])\/\d{2}$/)
      .refine(isFutureExpiry, "La tarjeta esta vencida"),
    cvv: z.string().regex(/^\d{3,4}$/),
  }),
})

function isFutureExpiry(value) {
  const [monthText, yearText] = value.split("/")
  const month = Number(monthText)
  const year = 2000 + Number(yearText)
  const now = new Date()
  const currentMonth = now.getMonth() + 1
  const currentYear = now.getFullYear()
  return year > currentYear || (year === currentYear && month >= currentMonth)
}

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

/**
 * @param {unknown} body
 */
function parseCheckout(body) {
  const r = checkoutSchema.safeParse(body)
  if (!r.success) {
    throw new AppError(400, "Datos de pago invalidos", r.error.flatten())
  }
  return r.data
}

module.exports = {
  parseAddCartItem,
  parseUpdateCartItem,
  parseCartItemIdParam,
  parseCheckout,
  checkoutSchema,
}
