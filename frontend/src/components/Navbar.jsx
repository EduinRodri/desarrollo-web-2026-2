import { startTransition, useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router'
import { useAuth } from '../context/AuthContext'

export default function Navbar() {
  const { usuario, salir } = useAuth()
  const [abierto, setAbierto] = useState(false) // menú en el celular
  const navegar = useNavigate()

  const cerrarSesion = () => {
    // React Router cambia de ruta dentro de una transición. Si la sesión se borrara por fuera,
    // la ruta protegida alcanzaría a mandar a «Ingresar»; juntas, se aplican al mismo tiempo.
    setAbierto(false)
    startTransition(() => {
      navegar('/', { replace: true })
      salir()
    })
  }

  return (
    <header className="barra">
      <div className="barra-interior">
        <Link to="/" className="logo" onClick={() => setAbierto(false)}>
          🛠️ Camell<span>app</span>
        </Link>
        <button className="menu-boton" aria-label="Abrir menú" onClick={() => setAbierto(!abierto)}>
          ☰
        </button>
        <nav className={abierto ? 'menu abierto' : 'menu'} onClick={() => setAbierto(false)}>
          <NavLink to="/" end>Buscar</NavLink>
          {usuario ? (
            <>
              <NavLink to="/pedidos">Mis pedidos</NavLink>
              <NavLink to="/mi-perfil">{usuario.es_trabajador ? 'Mi perfil' : 'Ofrecer servicios'}</NavLink>
              {usuario.es_admin && <NavLink to="/reportes">Reportes</NavLink>}
              <button className="boton-texto" onClick={cerrarSesion}>
                Salir ({usuario.nombre.split(' ')[0]})
              </button>
            </>
          ) : (
            <>
              <NavLink to="/ingresar">Ingresar</NavLink>
              <NavLink to="/registro" className="boton boton-chico">Crear cuenta</NavLink>
            </>
          )}
        </nav>
      </div>
    </header>
  )
}
