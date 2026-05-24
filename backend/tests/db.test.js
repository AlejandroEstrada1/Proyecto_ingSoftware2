const fs = require("fs")
const os = require("os")
const path = require("path")
const Database = require("better-sqlite3")
const { closeDatabase, getDb, initDatabase } = require("../src/db")

describe("db", () => {
  let tempDirs = []

  afterEach(() => {
    closeDatabase()
    for (const dir of tempDirs) {
      fs.rmSync(dir, { recursive: true, force: true })
    }
    tempDirs = []
  })

  function createTempDir() {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "ecomart-db-"))
    tempDirs.push(dir)
    return dir
  }

  it("lanza error si se consulta antes de inicializar", () => {
    closeDatabase()

    expect(() => getDb()).toThrow("Base de datos no inicializada")
  })

  it("crea directorios faltantes y siembra catalogo", () => {
    const dbPath = path.join(createTempDir(), "data", "nested", "ecmart.db")

    initDatabase(dbPath)

    expect(fs.existsSync(dbPath)).toBe(true)
    expect(getDb().prepare("SELECT COUNT(*) AS total FROM products").get().total)
      .toBeGreaterThan(0)
  })

  it("usa DATABASE_PATH cuando no se pasa ruta y no duplica seed", () => {
    const previous = process.env.DATABASE_PATH
    const dbPath = path.join(createTempDir(), "env", "ecmart.db")
    process.env.DATABASE_PATH = dbPath

    initDatabase()
    const firstCount = getDb()
      .prepare("SELECT COUNT(*) AS total FROM products")
      .get().total
    closeDatabase()
    initDatabase()
    const secondCount = getDb()
      .prepare("SELECT COUNT(*) AS total FROM products")
      .get().total

    expect(firstCount).toBeGreaterThan(0)
    expect(secondCount).toBe(firstCount)
    if (previous === undefined) {
      delete process.env.DATABASE_PATH
    } else {
      process.env.DATABASE_PATH = previous
    }
  })

  it("usa ruta por defecto cuando no hay argumento ni DATABASE_PATH", () => {
    const previous = process.env.DATABASE_PATH
    const dbPath = path.join(createTempDir(), "default", "ecmart.db")
    delete process.env.DATABASE_PATH
    const joinSpy = jest.spyOn(path, "join").mockReturnValue(dbPath)

    initDatabase()

    expect(fs.existsSync(dbPath)).toBe(true)
    joinSpy.mockRestore()
    if (previous === undefined) {
      delete process.env.DATABASE_PATH
    } else {
      process.env.DATABASE_PATH = previous
    }
  })

  it("migra una tabla orders antigua agregando columnas de pago", () => {
    const dbPath = path.join(createTempDir(), "legacy.db")
    const legacy = new Database(dbPath)
    legacy.exec(`
      CREATE TABLE users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre TEXT NOT NULL,
        correo TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );

      CREATE TABLE orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        total REAL NOT NULL CHECK (total >= 0),
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
    `)
    legacy.close()

    initDatabase(dbPath)

    const columns = getDb()
      .prepare("PRAGMA table_info(orders)")
      .all()
      .map((column) => column.name)
    expect(columns).toEqual(
      expect.arrayContaining([
        "payment_status",
        "payment_reference",
        "card_last4",
      ])
    )
  })
})
