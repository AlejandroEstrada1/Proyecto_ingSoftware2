import { useState } from "react"
import Login from "./componentes/Login.jsx"
import Registro from "./componentes/Registro.jsx"
import Dashboard from "./componentes/Dashboard.jsx"

function App() {
  const [pantalla, setPantalla] = useState(
    localStorage.getItem("sesion") === "activa" ? "dashboard" : "login"
  )

  const iniciarSesion = () => {
    setPantalla("dashboard")
  }

  const cerrarSesion = () => {
    localStorage.removeItem("sesion")
    setPantalla("login")
  }

  return (
    <div>
      {pantalla === "login" && (
        <Login cambiarPantalla={setPantalla} iniciarSesion={iniciarSesion} />
      )}

      {pantalla === "registro" && <Registro cambiarPantalla={setPantalla} />}

      {pantalla === "dashboard" && <Dashboard cerrarSesion={cerrarSesion} />}
    </div>
  )
}

export default App