// Rutas y navegación de Camellapp.
// Cada pantalla se carga solo cuando se visita (React.lazy): la primera carga es más liviana.
import { lazy, Suspense } from 'react'
import { Link, Route, Routes, useLocation } from 'react-router'
import Navbar from './components/Navbar'
import RutaProtegida from './components/RutaProtegida'
import { Logo } from './components/Marca'
// El inicio es la pantalla de entrada: se carga con la app para no esperar una segunda descarga (mejor LCP).
import Inicio from './pages/Inicio'

const Buscar = lazy(() => import('./pages/Buscar'))
const Servicio = lazy(() => import('./pages/Servicio'))
const Marca = lazy(() => import('./pages/Marca'))
const Privacidad = lazy(() => import('./pages/Privacidad'))
const Trabajador = lazy(() => import('./pages/Trabajador'))
const Ingresar = lazy(() => import('./pages/Ingresar'))
const Registro = lazy(() => import('./pages/Registro'))
const MiPerfil = lazy(() => import('./pages/MiPerfil'))
const Pedidos = lazy(() => import('./pages/Pedidos'))
const Reportes = lazy(() => import('./pages/Reportes'))
const NoEncontrado = lazy(() => import('./pages/NoEncontrado'))

export default function App() {
  const { pathname } = useLocation()
  return (
    <>
      <a href="#contenido" className="saltar">Saltar al contenido</a>
      <Navbar />
      <main id="contenido" className="contenedor">
        {/* key: cada página entra con una transición suave al navegar */}
        <div key={pathname} className="pagina">
          <Suspense fallback={null}>
            <Routes>
              <Route path="/" element={<Inicio />} />
              <Route path="/buscar" element={<Buscar />} />
              <Route path="/marca" element={<Marca />} />
              <Route path="/privacidad" element={<Privacidad />} />
              <Route path="/servicios/:id" element={<Servicio />} />
              <Route path="/trabajadores/:id" element={<Trabajador />} />
              <Route path="/ingresar" element={<Ingresar />} />
              <Route path="/registro" element={<Registro />} />
              {/* Rutas que exigen sesión */}
              <Route element={<RutaProtegida />}>
                <Route path="/mi-perfil" element={<MiPerfil />} />
                <Route path="/pedidos" element={<Pedidos />} />
              </Route>
              <Route element={<RutaProtegida soloAdmin />}>
                <Route path="/reportes" element={<Reportes />} />
              </Route>
              <Route path="*" element={<NoEncontrado />} />
            </Routes>
          </Suspense>
        </div>
      </main>
      <footer className="pie">
        <div className="pie-interior">
          <Link to="/" className="logo" aria-label="Camellapp, inicio"><Logo /></Link>
          <span>Oficios de confianza en Malambo y el área metropolitana de Barranquilla.</span>
          <span className="pie-enlaces"><Link to="/privacidad">Tus datos</Link><Link to="/marca">Marca</Link><span>Proyecto académico · 2026</span></span>
        </div>
      </footer>
    </>
  )
}
