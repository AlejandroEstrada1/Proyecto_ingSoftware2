const express = require("express")
const cors = require("cors")
const { productos } = require("./data")

const app = express()
const PORT = 3001

app.use(cors())
app.use(express.json())

app.get("/", (req, res) => {
  res.send("Backend EcoMart funcionando")
})

app.get("/api/productos", (req, res) => {
  res.json(productos)
})

app.post("/api/productos", (req, res) => {
  const { nombre, precio, cantidad } = req.body

  if (!nombre || !precio || !cantidad) {
    return res.status(400).json({ mensaje: "Todos los campos son obligatorios" })
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

app.put("/api/productos/:id", (req, res) => {
  const id = Number(req.params.id)
  const { nombre, precio, cantidad } = req.body

  const producto = productos.find((p) => p.id === id)

  if (!producto) {
    return res.status(404).json({ mensaje: "Producto no encontrado" })
  }

  producto.nombre = nombre
  producto.precio = Number(precio)
  producto.cantidad = Number(cantidad)

  res.json(producto)
})

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