// Si no hay sesión, manda a /ingresar y recuerda a dónde quería ir la persona.
// Ojo: esto es comodidad para el usuario. La seguridad real la pone la API (401/403).
import { Navigate, Outlet, useLocation } from 'react-router'
import { useAuth } from '../context/AuthContext'

export default function RutaProtegida({ soloAdmin = false }) {
  const { usuario, cargando } = useAuth()
  const ubicacion = useLocation()

  if (cargando) return null // se está validando el token guardado; es casi instantáneo
  if (!usuario) return <Navigate to="/ingresar" replace state={{ desde: ubicacion.pathname }} />
  if (soloAdmin && !usuario.es_admin) return <Navigate to="/" replace />
  return <Outlet />
}
