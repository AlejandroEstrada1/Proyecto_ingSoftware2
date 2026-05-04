const express = require("express")
const cors = require("cors")
const { usuarios, productos } = require("./data")

const app = express()
const PORT = 3001

app.use(cors())
app.use(express.json())

app.get("/", (req, res) => {
  res.send("Backend EcoMart funcionando")
})

// REGISTRO
app.post("/api/auth/register", (req, res) => {
  const { nombre, correo, password } = req.body

  if (!nombre || !correo || !password) {
    return res.status(400).json({ mensaje: "Todos los campos son obligatorios" })
  }

  const existeUsuario = usuarios.find((u) => u.correo === correo)

  if (existeUsuario) {
    return res.status(400).json({ mensaje: "El correo ya está registrado" })
  }

  const nuevoUsuario = {
    id: Date.now(),
    nombre,
    correo,
    password,
  }

  usuarios.push(nuevoUsuario)

  res.status(201).json({
    mensaje: "Usuario registrado correctamente",
    usuario: {
      id: nuevoUsuario.id,
      nombre: nuevoUsuario.nombre,
      correo: nuevoUsuario.correo,
    },
  })
})

// LOGIN
app.post("/api/auth/login", (req, res) => {
  const { correo, password } = req.body

  if (!correo || !password) {
    return res.status(400).json({ mensaje: "Correo y contraseña son obligatorios" })
  }

  const usuario = usuarios.find(
    (u) => u.correo === correo && u.password === password
  )

  if (!usuario) {
    return res.status(401).json({ mensaje: "Credenciales incorrectas" })
  }

  res.json({
    mensaje: "Login exitoso",
    usuario: {
      id: usuario.id,
      nombre: usuario.nombre,
      correo: usuario.correo,
    },
  })
})

// LISTAR PRODUCTOS
app.get("/api/productos", (req, res) => {
  res.json(productos)
})

// CREAR PRODUCTO
app.post("/api/productos", (req, res) => {
  const { nombre, precio, cantidad } = req.body

  if (!nombre || !precio || !cantidad) {
    return res.status(400).json({ mensaje: "Todos los campos son obligatorios" })
  }

  if (Number(precio) <= 0 || Number(cantidad) <= 0) {
    return res.status(400).json({ mensaje: "Precio y cantidad deben ser mayores a 0" })
  }

  const nuevoProducto = {
    id: Date.now(),
    nombre,
    precio: Number(precio),
    cantidad: Number(cantidad),
  }

  productos.push(nuevoProducto)
  res.status(201).json(nuevoProducto)
})

// EDITAR PRODUCTO
app.put("/api/productos/:id", (req, res) => {
  const id = Number(req.params.id)
  const { nombre, precio, cantidad } = req.body

  const producto = productos.find((p) => p.id === id)

  if (!producto) {
    return res.status(404).json({ mensaje: "Producto no encontrado" })
  }

  if (!nombre || !precio || !cantidad) {
    return res.status(400).json({ mensaje: "Todos los campos son obligatorios" })
  }

  if (Number(precio) <= 0 || Number(cantidad) <= 0) {
    return res.status(400).json({ mensaje: "Precio y cantidad deben ser mayores a 0" })
  }

  producto.nombre = nombre
  producto.precio = Number(precio)
  producto.cantidad = Number(cantidad)

  res.json(producto)
})

// ELIMINAR PRODUCTO
app.delete("/api/productos/:id", (req, res) => {
  const id = Number(req.params.id)
  const index = productos.findIndex((p) => p.id === id)

  if (index === -1) {
    return res.status(404).json({ mensaje: "Producto no encontrado" })
  }

  productos.splice(index, 1)
  res.json({ mensaje: "Producto eliminado correctamente" })
})

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`)
})