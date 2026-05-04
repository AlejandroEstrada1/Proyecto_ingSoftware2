import { useState } from "react"
import { api } from "../lib/api.js"
import { ApiError, formatValidationDetails } from "../lib/apiTypes.js"

function Login({ onIrRegistro, onAutenticado }) {
  const [correo, setCorreo] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [cargando, setCargando] = useState(false)

  const manejarLogin = async (e) => {
    e.preventDefault()
    setError("")
    if (!correo.trim() || !password) {
      setError("Completa correo y contraseña.")
      return
    }

    setCargando(true)
    try {
      const datos = await api("/auth/login", {
        method: "POST",
        body: JSON.stringify({ correo: correo.trim(), password }),
      })
      localStorage.setItem("ecmart_token", datos.token)
      localStorage.setItem("ecmart_user", JSON.stringify(datos.user))
      onAutenticado(datos.user)
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
    <div className="auth-shell">
      <div className="auth-panel auth-panel--form">
        <div className="brand-block">
          <span className="brand-mark" aria-hidden>
            ◎
          </span>
          <div>
            <p className="brand-kicker">Universidad · Proyecto final</p>
            <h1 className="brand-title">EcoMart</h1>
            <p className="brand-sub">
              Comercio digital con carrito persistente y checkout simulado.
            </p>
          </div>
        </div>

        <form className="form-card" onSubmit={manejarLogin} noValidate>
          <h2 className="form-title">Iniciar sesión</h2>
          <label className="field">
            <span>Correo</span>
            <input
              data-testid="email"
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
              data-testid="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mínimo 8 caracteres"
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

          <button
            data-testid="login-btn"
            className="btn btn--primary btn--block"
            type="submit"
            disabled={cargando}
          >
            {cargando ? "Entrando…" : "Entrar"}
          </button>

          <p className="form-footer">
            ¿No tienes cuenta?{" "}
            <button
              type="button"
              className="link-btn"
              onClick={onIrRegistro}
            >
              Crear cuenta
            </button>
          </p>
        </form>
      </div>

      <div className="auth-panel auth-panel--visual" aria-hidden>
        <div className="visual-gradient" />
        <div className="visual-quote">
          <p>
            “Inventario en tiempo real, carrito por usuario y API REST
            documentada.”
          </p>
        </div>
      </div>
    </div>
  )
}

export default Login
