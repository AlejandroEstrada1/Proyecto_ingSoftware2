import { useEffect, useState } from "react"
import Login from "./componentes/Login.jsx"
import Registro from "./componentes/Registro.jsx"
import Tienda from "./componentes/Tienda.jsx"

function leerUsuarioGuardado() {
  try {
    const raw = localStorage.getItem("ecmart_user")
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function estadoInicialSesion() {
  const token = localStorage.getItem("ecmart_token")
  const u = leerUsuarioGuardado()
  if (token && u) {
    return { pantalla: "tienda", usuario: u }
  }
  return { pantalla: "login", usuario: null }
}

function App() {
  const inicial = estadoInicialSesion()
  const [pantalla, setPantalla] = useState(inicial.pantalla)
  const [usuario, setUsuario] = useState(inicial.usuario)

  useEffect(() => {
    const onExpired = () => {
      setUsuario(null)
      setPantalla("login")
    }
    window.addEventListener("ecmart:session-expired", onExpired)
    return () => window.removeEventListener("ecmart:session-expired", onExpired)
  }, [])

  const autenticar = (u) => {
    setUsuario(u)
    setPantalla("tienda")
  }

  const cerrarSesion = () => {
    localStorage.removeItem("ecmart_token")
    localStorage.removeItem("ecmart_user")
    setUsuario(null)
    setPantalla("login")
  }

  return (
    <div className="app-root">
      {pantalla === "login" && (
        <Login
          onIrRegistro={() => setPantalla("registro")}
          onAutenticado={autenticar}
        />
      )}
      {pantalla === "registro" && (
        <Registro onIrLogin={() => setPantalla("login")} />
      )}
      {pantalla === "tienda" && usuario && (
        <Tienda usuario={usuario} onCerrarSesion={cerrarSesion} />
      )}
    </div>
  )
}

export default App
