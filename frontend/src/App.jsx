// Rutas y navegación de Camellapp.
// Cada pantalla se carga solo cuando se visita (React.lazy): la primera carga es más liviana.
import { lazy, Suspense } from 'react'
import { Route, Routes } from 'react-router'
import Navbar from './components/Navbar'
import RutaProtegida from './components/RutaProtegida'
import Cargando from './components/Cargando'

const Buscar = lazy(() => import('./pages/Buscar'))
const Servicio = lazy(() => import('./pages/Servicio'))
const Trabajador = lazy(() => import('./pages/Trabajador'))
const Ingresar = lazy(() => import('./pages/Ingresar'))
const Registro = lazy(() => import('./pages/Registro'))
const MiPerfil = lazy(() => import('./pages/MiPerfil'))
const Pedidos = lazy(() => import('./pages/Pedidos'))
const Reportes = lazy(() => import('./pages/Reportes'))
const NoEncontrado = lazy(() => import('./pages/NoEncontrado'))

export default function App() {
  return (
    <>
      <Navbar />
      <main className="contenedor">
        <Suspense fallback={<Cargando />}>
          <Routes>
            <Route path="/" element={<Buscar />} />
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
      </main>
      <footer className="pie">Camellapp · Malambo y área metropolitana de Barranquilla · Proyecto académico 2026</footer>
    </>
  )
}
