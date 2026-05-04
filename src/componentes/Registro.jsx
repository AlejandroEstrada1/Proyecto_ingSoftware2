import { useState } from "react"

function Registro({ cambiarPantalla }) {
  const [nombre, setNombre] = useState("")
  const [correo, setCorreo] = useState("")
  const [password, setPassword] = useState("")
  const [confirmarPassword, setConfirmarPassword] = useState("")
  const [mensaje, setMensaje] = useState("")
  const [error, setError] = useState("")

  const manejarRegistro = async (e) => {
    e.preventDefault()

    if (!nombre || !correo || !password || !confirmarPassword) {
      setError("Todos los campos son obligatorios")
      setMensaje("")
      return
    }

    if (password !== confirmarPassword) {
      setError("Las contraseñas no coinciden")
      setMensaje("")
      return
    }

    try {
      const respuesta = await fetch("http://localhost:3001/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ nombre, correo, password }),
      })

      const datos = await respuesta.json()

      if (!respuesta.ok) {
        setError(datos.mensaje)
        setMensaje("")
        return
      }

      setMensaje("Usuario registrado correctamente")
      setError("")
      setNombre("")
      setCorreo("")
      setPassword("")
      setConfirmarPassword("")

      setTimeout(() => {
        cambiarPantalla("login")
      }, 1000)
    } catch (error) {
      setError("No se pudo conectar con el backend")
      setMensaje("")
    }
  }

  return (
    <div>
      <h2>Registro de usuario</h2>

      <form onSubmit={manejarRegistro}>
        <div>
          <label>Nombre:</label>
          <input
            type="text"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
          />
        </div>

        <div>
          <label>Correo:</label>
          <input
            type="email"
            value={correo}
            onChange={(e) => setCorreo(e.target.value)}
          />
        </div>

        <div>
          <label>Contraseña:</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        <div>
          <label>Confirmar contraseña:</label>
          <input
            type="password"
            value={confirmarPassword}
            onChange={(e) => setConfirmarPassword(e.target.value)}
          />
        </div>

        <button type="submit">Registrarse</button>
      </form>

      {error && <p style={{ color: "red" }}>{error}</p>}
      {mensaje && <p style={{ color: "green" }}>{mensaje}</p>}

      <p>
        ¿Ya tienes cuenta?{" "}
        <button type="button" onClick={() => cambiarPantalla("login")}>
          Iniciar sesión
        </button>
      </p>
    </div>
  )
}

export default Registro