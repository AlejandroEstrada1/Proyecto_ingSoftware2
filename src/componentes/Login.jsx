import { useState } from "react"

function Login({ cambiarPantalla, iniciarSesion }) {
  const [correo, setCorreo] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [mensaje, setMensaje] = useState("")

  const manejarLogin = async (e) => {
    e.preventDefault()

    if (!correo || !password) {
      setError("Todos los campos son obligatorios")
      setMensaje("")
      return
    }

    try {
      const respuesta = await fetch("http://localhost:3001/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ correo, password }),
      })

      const datos = await respuesta.json()

      if (!respuesta.ok) {
        setError(datos.mensaje)
        setMensaje("")
        return
      }

      localStorage.setItem("sesion", "activa")
      localStorage.setItem("usuario", JSON.stringify(datos.usuario))

      setMensaje("Login exitoso")
      setError("")
      iniciarSesion()
    } catch (error) {
      setError("No se pudo conectar con el backend")
      setMensaje("")
    }
  }

  return (
    <div>
      <h2>Iniciar sesión</h2>

      <form onSubmit={manejarLogin}>
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

        <button type="submit">Ingresar</button>
      </form>

      {error && <p style={{ color: "red" }}>{error}</p>}
      {mensaje && <p style={{ color: "green" }}>{mensaje}</p>}

      <p>
        ¿No tienes cuenta?{" "}
        <button type="button" onClick={() => cambiarPantalla("registro")}>
          Registrarse
        </button>
      </p>
    </div>
  )
}

export default Login