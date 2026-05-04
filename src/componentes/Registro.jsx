import { useState } from "react"
import { api } from "../lib/api.js"
import { ApiError, formatValidationDetails } from "../lib/apiTypes.js"

function Registro({ onIrLogin }) {
  const [nombre, setNombre] = useState("")
  const [correo, setCorreo] = useState("")
  const [password, setPassword] = useState("")
  const [confirmar, setConfirmar] = useState("")
  const [error, setError] = useState("")
  const [ok, setOk] = useState(false)
  const [cargando, setCargando] = useState(false)

  const manejarRegistro = async (e) => {
    e.preventDefault()
    setError("")
    setOk(false)

    const nombreLimpio = nombre.trim()
    if (!nombreLimpio || !correo.trim() || !password || !confirmar) {
      setError("Todos los campos son obligatorios.")
      return
    }
    if (nombreLimpio.length < 2) {
      setError("El nombre debe tener al menos 2 caracteres.")
      return
    }
    if (password.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres.")
      return
    }
    if (password !== confirmar) {
      setError("Las contraseñas no coinciden.")
      return
    }

    setCargando(true)
    try {
      await api("/auth/register", {
        method: "POST",
        body: JSON.stringify({
          nombre: nombreLimpio,
          correo: correo.trim(),
          password,
        }),
      })
      setOk(true)
      setNombre("")
      setCorreo("")
      setPassword("")
      setConfirmar("")
      setTimeout(() => onIrLogin(), 900)
    } catch (err) {
      if (err instanceof ApiError) {
        const detalle = formatValidationDetails(err.details)
        setError(detalle || err.message)
      } else {
        setError("No se pudo conectar con el servidor.")
      }
    } finally {
      setCargando(false)
    }
  }

  return (
    <div className="auth-shell auth-shell--single">
      <div className="auth-panel auth-panel--form auth-panel--center">
        <div className="brand-block brand-block--compact">
          <span className="brand-mark" aria-hidden>
            ◎
          </span>
          <div>
            <h1 className="brand-title">Crear cuenta</h1>
            <p className="brand-sub">
              Contraseña segura (mín. 8 caracteres), validación en servidor y
              hash bcrypt.
            </p>
          </div>
        </div>

        <form className="form-card" onSubmit={manejarRegistro} noValidate>
          <label className="field">
            <span>Nombre</span>
            <input
              data-testid="register-name"
              type="text"
              autoComplete="name"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Tu nombre"
            />
          </label>
          <label className="field">
            <span>Correo</span>
            <input
              data-testid="register-email"
              type="email"
              autoComplete="email"
              value={correo}
              onChange={(e) => setCorreo(e.target.value)}
              placeholder="tu@correo.edu"
            />
          </label>
          <label className="field">
            <span>Contraseña</span>
            <input
              data-testid="register-password"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mínimo 8 caracteres"
            />
          </label>
          <label className="field">
            <span>Confirmar contraseña</span>
            <input
              data-testid="register-confirm"
              type="password"
              autoComplete="new-password"
              value={confirmar}
              onChange={(e) => setConfirmar(e.target.value)}
              placeholder="Repite la contraseña"
            />
          </label>

          {error ? (
            <p
              className="alert alert--error"
              role="alert"
              data-testid="error-message"
            >
              {error}
            </p>
          ) : null}
          {ok ? (
            <p className="alert alert--success" role="status">
              Cuenta creada. Redirigiendo al inicio de sesión…
            </p>
          ) : null}

          <button
            data-testid="register-submit"
            className="btn btn--primary btn--block"
            type="submit"
            disabled={cargando}
          >
            {cargando ? "Creando…" : "Registrarse"}
          </button>

          <p className="form-footer">
            ¿Ya tienes cuenta?{" "}
            <button type="button" className="link-btn" onClick={onIrLogin}>
              Iniciar sesión
            </button>
          </p>
        </form>
      </div>
    </div>
  )
}

export default Registro
