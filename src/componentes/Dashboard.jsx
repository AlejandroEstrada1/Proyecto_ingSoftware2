import { useEffect, useState } from "react"

function Dashboard({ cerrarSesion }) {
  const [productos, setProductos] = useState([])
  const [nombre, setNombre] = useState("")
  const [precio, setPrecio] = useState("")
  const [cantidad, setCantidad] = useState("")
  const [editandoId, setEditandoId] = useState(null)
  const [error, setError] = useState("")
  const [mensaje, setMensaje] = useState("")

  const API = "http://localhost:3001/api/productos"

  const obtenerProductos = async () => {
    try {
      const respuesta = await fetch(API)

      if (!respuesta.ok) {
        throw new Error("Error al obtener productos")
      }

      const datos = await respuesta.json()
      setProductos(datos)
    } catch (error) {
      setError("No se pudo conectar con el backend para listar productos")
    }
  }

  useEffect(() => {
    obtenerProductos()
  }, [])

  const manejarSubmit = async (e) => {
    e.preventDefault()

    if (!nombre || !precio || !cantidad) {
      setError("Todos los campos son obligatorios")
      setMensaje("")
      return
    }

    if (Number(precio) <= 0 || Number(cantidad) <= 0) {
      setError("Precio y cantidad deben ser mayores a 0")
      setMensaje("")
      return
    }

    const producto = {
      nombre,
      precio: Number(precio),
      cantidad: Number(cantidad),
    }

    try {
      let respuesta

      if (editandoId) {
        respuesta = await fetch(`${API}/${editandoId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(producto),
        })
      } else {
        respuesta = await fetch(API, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(producto),
        })
      }

      const datos = await respuesta.json()

      if (!respuesta.ok) {
        setError(datos.mensaje || "Error al guardar el producto")
        setMensaje("")
        return
      }

      setMensaje(
        editandoId
          ? "Producto actualizado correctamente"
          : "Producto guardado correctamente"
      )

      setError("")
      setNombre("")
      setPrecio("")
      setCantidad("")
      setEditandoId(null)

      obtenerProductos()
    } catch (error) {
      setError("No se pudo conectar con el backend para guardar el producto")
      setMensaje("")
    }
  }

  const editarProducto = (producto) => {
    setNombre(producto.nombre)
    setPrecio(producto.precio)
    setCantidad(producto.cantidad)
    setEditandoId(producto.id)
    setError("")
    setMensaje("")
  }

  const eliminarProducto = async (id) => {
    const confirmar = confirm("¿Seguro que desea eliminar este producto?")

    if (!confirmar) return

    try {
      const respuesta = await fetch(`${API}/${id}`, {
        method: "DELETE",
      })

      const datos = await respuesta.json()

      if (!respuesta.ok) {
        setError(datos.mensaje || "Error al eliminar el producto")
        setMensaje("")
        return
      }

      setMensaje("Producto eliminado correctamente")
      setError("")
      obtenerProductos()
    } catch (error) {
      setError("No se pudo conectar con el backend para eliminar el producto")
      setMensaje("")
    }
  }

  const totalCarrito = productos.reduce(
    (total, producto) => total + producto.precio * producto.cantidad,
    0
  )

  return (
    <div>
      <h1>Panel EcoMart</h1>
      <button onClick={cerrarSesion}>Cerrar sesión</button>

      <h2>{editandoId ? "Editar producto" : "Agregar producto"}</h2>

      <form onSubmit={manejarSubmit}>
        <input
          type="text"
          placeholder="Nombre del producto"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
        />

        <input
          type="number"
          placeholder="Precio"
          value={precio}
          onChange={(e) => setPrecio(e.target.value)}
        />

        <input
          type="number"
          placeholder="Cantidad"
          value={cantidad}
          onChange={(e) => setCantidad(e.target.value)}
        />

        <button type="submit">
          {editandoId ? "Actualizar producto" : "Guardar producto"}
        </button>
      </form>

      {error && <p style={{ color: "red" }}>{error}</p>}
      {mensaje && <p style={{ color: "green" }}>{mensaje}</p>}

      <h2>Productos del carrito</h2>

      {productos.length === 0 ? (
        <p>No hay productos registrados.</p>
      ) : (
        <ul>
          {productos.map((producto) => (
            <li key={producto.id}>
              <strong>{producto.nombre}</strong> - Precio: ${producto.precio} -
              Cantidad: {producto.cantidad}
              <br />
              <button onClick={() => editarProducto(producto)}>Editar</button>
              <button onClick={() => eliminarProducto(producto.id)}>
                Eliminar
              </button>
            </li>
          ))}
        </ul>
      )}

      <h3>Total del carrito: ${totalCarrito}</h3>
    </div>
  )
}

export default Dashboard