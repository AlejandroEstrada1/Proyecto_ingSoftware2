const { getDb } = require("../db")
const { AppError } = require("../errors/AppError")

/**
 * Lista el carrito del usuario con subtotales por línea y total.
 * @param {number} userId
 */
function getCart(userId) {
  const db = getDb()
  const rows = db
    .prepare(
      `SELECT ci.id AS cartItemId, ci.quantity, p.id AS productId, p.nombre, p.precio, p.stock
       FROM cart_items ci
       JOIN products p ON p.id = ci.product_id
       WHERE ci.user_id = ?
       ORDER BY ci.id`
    )
    .all(userId)

  const items = rows.map((r) => {
    const lineTotal = Math.round(r.precio * r.quantity * 100) / 100
    return {
      id: r.cartItemId,
      productId: r.productId,
      nombre: r.nombre,
      unitPrice: r.precio,
      quantity: r.quantity,
      stockAvailable: r.stock,
      lineTotal,
    }
  })

  const subtotal =
    Math.round(items.reduce((s, i) => s + i.lineTotal, 0) * 100) / 100

  return { items, subtotal }
}

/**
 * Añade o incrementa cantidad respetando stock del catálogo.
 * @param {number} userId
 * @param {{ productId: number, quantity: number }} input
 */
function addCartItem(userId, input) {
  const db = getDb()
  const product = db
    .prepare("SELECT id, stock FROM products WHERE id = ?")
    .get(input.productId)

  if (!product) {
    throw new AppError(404, "Producto no encontrado")
  }

  const existing = db
    .prepare(
      "SELECT id, quantity FROM cart_items WHERE user_id = ? AND product_id = ?"
    )
    .get(userId, input.productId)

  const newQty = (existing ? existing.quantity : 0) + input.quantity
  if (newQty > product.stock) {
    throw new AppError(
      400,
      "Cantidad superior al stock disponible",
      { requested: newQty, stock: product.stock }
    )
  }

  if (existing) {
    db.prepare("UPDATE cart_items SET quantity = ? WHERE id = ?").run(
      newQty,
      existing.id
    )
  } else {
    db.prepare(
      "INSERT INTO cart_items (user_id, product_id, quantity) VALUES (?, ?, ?)"
    ).run(userId, input.productId, input.quantity)
  }

  return getCart(userId)
}

/**
 * @param {number} userId
 * @param {number} cartItemId
 * @param {{ quantity: number }} input
 */
function updateCartItem(userId, cartItemId, input) {
  const db = getDb()
  const row = db
    .prepare(
      `SELECT ci.id, ci.product_id AS productId, p.stock
       FROM cart_items ci
       JOIN products p ON p.id = ci.product_id
       WHERE ci.id = ? AND ci.user_id = ?`
    )
    .get(cartItemId, userId)

  if (!row) {
    throw new AppError(404, "Ítem del carrito no encontrado")
  }

  if (input.quantity > row.stock) {
    throw new AppError(400, "Cantidad superior al stock disponible", {
      stock: row.stock,
    })
  }

  db.prepare("UPDATE cart_items SET quantity = ? WHERE id = ?").run(
    input.quantity,
    cartItemId
  )

  return getCart(userId)
}

/**
 * @param {number} userId
 * @param {number} cartItemId
 */
function deleteCartItem(userId, cartItemId) {
  const db = getDb()
  const info = db
    .prepare("DELETE FROM cart_items WHERE id = ? AND user_id = ?")
    .run(cartItemId, userId)

  if (info.changes === 0) {
    throw new AppError(404, "Ítem del carrito no encontrado")
  }

  return getCart(userId)
}

/**
 * Checkout simulado: valida stock, crea pedido, descuenta stock y vacía el carrito en una transacción.
 * @param {number} userId
 */
function checkout(userId) {
  const db = getDb()
  const cart = getCart(userId)

  if (cart.items.length === 0) {
    throw new AppError(400, "El carrito está vacío")
  }

  const orderResult = db.transaction(() => {
    for (const item of cart.items) {
      const p = db
        .prepare("SELECT stock FROM products WHERE id = ?")
        .get(item.productId)
      if (!p || p.stock < item.quantity) {
        throw new AppError(
          409,
          "Stock insuficiente para completar el pedido",
          { productId: item.productId }
        )
      }
    }

    const orderInfo = db
      .prepare("INSERT INTO orders (user_id, total) VALUES (?, ?)")
      .run(userId, cart.subtotal)

    const orderId = Number(orderInfo.lastInsertRowid)
    const insertLine = db.prepare(
      "INSERT INTO order_items (order_id, product_id, quantity, unit_price) VALUES (?, ?, ?, ?)"
    )

    for (const item of cart.items) {
      insertLine.run(
        orderId,
        item.productId,
        item.quantity,
        item.unitPrice
      )
      db.prepare(
        "UPDATE products SET stock = stock - ? WHERE id = ?"
      ).run(item.quantity, item.productId)
    }

    db.prepare("DELETE FROM cart_items WHERE user_id = ?").run(userId)

    return { orderId, total: cart.subtotal }
  })()

  return orderResult
}

module.exports = {
  getCart,
  addCartItem,
  updateCartItem,
  deleteCartItem,
  checkout,
}
