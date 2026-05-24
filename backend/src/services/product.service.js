const { getDb } = require("../db")

/**
 * Catálogo público de productos (solo lectura).
 */
function listProducts() {
  const db = getDb()
  return db
    .prepare(
      "SELECT id, nombre, precio, stock FROM products WHERE stock > 0 ORDER BY nombre"
    )
    .all()
}

module.exports = { listProducts }
