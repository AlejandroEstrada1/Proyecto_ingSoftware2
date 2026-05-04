import { useState } from "react"

function Login({ cambiarPantalla, iniciarSesion }) {
  const [correo, setCorreo] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")

  const manejarLogin = (e) => {
    e.preventDefault()

    if (!correo || !password) {
      setError("Todos los campos son obligatorios")
      return
    }

    const usuarioGuardado = JSON.parse(localStorage.getItem("usuario"))

    if (!usuarioGuardado) {
      setError("No hay usuario registrado")
      return
    }

    if (
      usuarioGuardado.correo === correo &&
      usuarioGuardado.password === password
    ) {
      localStorage.setItem("sesion", "activa")
      alert("Login exitoso")
    setError("")
    iniciarSesion()
    } else {
      setError("Credenciales incorrectas")
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