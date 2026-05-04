const fs = require("fs")
const path = require("path")
const Database = require("better-sqlite3")

let dbInstance = null

function getDb() {
  if (!dbInstance) {
    throw new Error("Base de datos no inicializada. Llama a initDatabase() primero.")
  }
  return dbInstance
}

/**
 * Inicializa SQLite, migraciones y datos de ejemplo.
 * @param {string} [databasePath] Ruta al archivo .db o ':memory:' para tests
 */
function initDatabase(databasePath) {
  const resolved =
    databasePath ||
    process.env.DATABASE_PATH ||
    path.join(__dirname, "..", "data", "ecmart.db")

  if (resolved !== ":memory:") {
    const dir = path.dirname(resolved)
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }
  }

  dbInstance = new Database(resolved)
  dbInstance.pragma("foreign_keys = ON")
  migrate(dbInstance)
  seedCatalogIfEmpty(dbInstance)
  return dbInstance
}

function migrate(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT NOT NULL,
      correo TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT NOT NULL,
      precio REAL NOT NULL CHECK (precio > 0),
      stock INTEGER NOT NULL CHECK (stock >= 0)
    );

    CREATE TABLE IF NOT EXISTS cart_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      product_id INTEGER NOT NULL,
      quantity INTEGER NOT NULL CHECK (quantity > 0),
      UNIQUE (user_id, product_id),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      total REAL NOT NULL CHECK (total >= 0),
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL,
      product_id INTEGER NOT NULL,
      quantity INTEGER NOT NULL,
      unit_price REAL NOT NULL,
      FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
      FOREIGN KEY (product_id) REFERENCES products(id)
    );
  `)
}

function seedCatalogIfEmpty(db) {
  const count = db.prepare("SELECT COUNT(*) AS c FROM products").get().c
  if (count > 0) return

  const insert = db.prepare(
    "INSERT INTO products (nombre, precio, stock) VALUES (?, ?, ?)"
  )
  const seed = [
    ["Agua mineral 600ml", 0.99, 200],
    ["Café orgánico 250g", 8.5, 80],
    ["Avena integral 500g", 3.2, 120],
    ["Aceite de oliva 500ml", 6.75, 60],
    ["Chocolate 70% 100g", 2.4, 150],
  ]
  const tx = db.transaction(() => {
    for (const row of seed) {
      insert.run(row[0], row[1], row[2])
    }
  })
  tx()
}

/**
 * Cierra la conexión (útil en tests).
 */
function closeDatabase() {
  if (dbInstance) {
    dbInstance.close()
    dbInstance = null
  }
}

module.exports = { getDb, initDatabase, closeDatabase }
