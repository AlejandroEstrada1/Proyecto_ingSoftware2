import { useState } from "react"

function Dashboard({ cerrarSesion }) {
  const [solicitudes, setSolicitudes] = useState(
    JSON.parse(localStorage.getItem("solicitudes")) || []
  )

  const [titulo, setTitulo] = useState("")
  const [descripcion, setDescripcion] = useState("")
  const [estado, setEstado] = useState("Pendiente")
  const [editandoId, setEditandoId] = useState(null)
  const [error, setError] = useState("")

  const guardarEnLocalStorage = (lista) => {
    localStorage.setItem("solicitudes", JSON.stringify(lista))
    setSolicitudes(lista)
  }

  const manejarSubmit = (e) => {
    e.preventDefault()

    if (!titulo || !descripcion || !estado) {
      setError("Todos los campos son obligatorios")
      return
    }

    if (editandoId) {
      const listaActualizada = solicitudes.map((solicitud) =>
        solicitud.id === editandoId
          ? { ...solicitud, titulo, descripcion, estado }
          : solicitud
      )

      guardarEnLocalStorage(listaActualizada)
      setEditandoId(null)
    } else {
      const nuevaSolicitud = {
        id: Date.now(),
        titulo,
        descripcion,
        estado,
        fecha: new Date().toLocaleDateString(),
      }

      guardarEnLocalStorage([...solicitudes, nuevaSolicitud])
    }

    setTitulo("")
    setDescripcion("")
    setEstado("Pendiente")
    setError("")
  }

  const editarSolicitud = (solicitud) => {
    setTitulo(solicitud.titulo)
    setDescripcion(solicitud.descripcion)
    setEstado(solicitud.estado)
    setEditandoId(solicitud.id)
  }

  const eliminarSolicitud = (id) => {
    const confirmar = confirm("¿Seguro que desea eliminar esta solicitud?")

    if (confirmar) {
      const listaFiltrada = solicitudes.filter(
        (solicitud) => solicitud.id !== id
      )
      guardarEnLocalStorage(listaFiltrada)
    }
  }

  return (
    <div>
      <h1>Panel principal</h1>
      <button onClick={cerrarSesion}>Cerrar sesión</button>

      <h2>{editandoId ? "Editar solicitud" : "Crear solicitud"}</h2>

      <form onSubmit={manejarSubmit}>
        <div>
          <label>Título:</label>
          <input
            type="text"
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
          />
        </div>

        <div>
          <label>Descripción:</label>
          <input
            type="text"
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
          />
        </div>

        <div>
          <label>Estado:</label>
          <select value={estado} onChange={(e) => setEstado(e.target.value)}>
            <option value="Pendiente">Pendiente</option>
            <option value="En proceso">En proceso</option>
            <option value="Finalizada">Finalizada</option>
          </select>
        </div>

        <button type="submit">
          {editandoId ? "Actualizar solicitud" : "Guardar solicitud"}
        </button>
      </form>

      {error && <p style={{ color: "red" }}>{error}</p>}

      <h2>Lista de solicitudes</h2>

      {solicitudes.length === 0 ? (
        <p>No hay solicitudes registradas.</p>
      ) : (
        <ul>
          {solicitudes.map((solicitud) => (
            <li key={solicitud.id}>
              <strong>{solicitud.titulo}</strong> - {solicitud.descripcion} -{" "}
              {solicitud.estado} - {solicitud.fecha}
              <br />
              <button onClick={() => editarSolicitud(solicitud)}>Editar</button>
              <button onClick={() => eliminarSolicitud(solicitud.id)}>
                Eliminar
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default Dashboard