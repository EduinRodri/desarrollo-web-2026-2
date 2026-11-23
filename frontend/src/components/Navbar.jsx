import { startTransition, useEffect, useState } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router'
import { BarChart3, ClipboardList, LogIn, LogOut, Menu, Search, UserRound, X } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { Logo } from './Marca'

export default function Navbar() {
  const { usuario, salir } = useAuth()
  const [abierto, setAbierto] = useState(false) // menú en el celular
  const navegar = useNavigate()
  const { pathname } = useLocation()

  useEffect(() => setAbierto(false), [pathname]) // al cambiar de página, el menú se cierra

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
        <Link to="/" className="logo" aria-label="Camellapp, inicio"><Logo /></Link>
        <button className="boton-icono menu-boton" aria-label={abierto ? 'Cerrar menú' : 'Abrir menú'}
          aria-expanded={abierto} aria-controls="menu-principal" onClick={() => setAbierto(!abierto)}>
          {abierto ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
        </button>
        <nav id="menu-principal" className={abierto ? 'menu abierto' : 'menu'} aria-label="Principal">
          <NavLink to="/buscar"><Search aria-hidden="true" size={18} /> Buscar</NavLink>
          {usuario ? (
            <>
              <NavLink to="/pedidos"><ClipboardList aria-hidden="true" size={18} /> Mis pedidos</NavLink>
              <NavLink to="/mi-perfil"><UserRound aria-hidden="true" size={18} /> {usuario.es_trabajador ? 'Mi perfil' : 'Ofrecer servicios'}</NavLink>
              {usuario.es_admin && <NavLink to="/reportes"><BarChart3 aria-hidden="true" size={18} /> Reportes</NavLink>}
              <button className="boton-menu" onClick={cerrarSesion}>
                <LogOut aria-hidden="true" size={18} /> Salir ({usuario.nombre.split(' ')[0]})
              </button>
            </>
          ) : (
            <>
              <NavLink to="/ingresar"><LogIn aria-hidden="true" size={18} /> Ingresar</NavLink>
              <Link to="/registro" className="boton boton-sm">Crear cuenta</Link>
            </>
          )}
        </nav>
      </div>
    </header>
  )
}
