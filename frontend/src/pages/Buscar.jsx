// Pantalla principal: buscar servicios por oficio, zona y texto (RF4).
// Los filtros viven en la URL (?categoria=1&zona=Malambo): se pueden compartir por WhatsApp.
import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router'
import api, { mensajeDeError } from '../api'
import { useCatalogo } from '../hooks/useCatalogo'
import TarjetaServicio from '../components/TarjetaServicio'
import Cargando from '../components/Cargando'
import Aviso from '../components/Aviso'

export default function Buscar() {
  const { porGrupo, zonas } = useCatalogo()
  const [params, setParams] = useSearchParams()
  const categoria = params.get('categoria') ?? ''
  const zona = params.get('zona') ?? ''
  const q = params.get('q') ?? ''

  const [texto, setTexto] = useState(q)
  const [servicios, setServicios] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')

  const cambiarFiltro = (clave, valor) => {
    const nuevos = new URLSearchParams(params)
    valor ? nuevos.set(clave, valor) : nuevos.delete(clave)
    setParams(nuevos, { replace: true })
  }

  // "Debounce": espera 400 ms después de la última tecla antes de buscar,
  // para no mandar una petición por cada letra.
  useEffect(() => {
    const t = setTimeout(() => {
      if (texto !== q) cambiarFiltro('q', texto.trim())
    }, 400)
    return () => clearTimeout(t)
  }, [texto]) // eslint-disable-line react-hooks/exhaustive-deps

  // Cada vez que cambian los filtros, se consulta la API.
  useEffect(() => {
    const control = new AbortController() // cancela la búsqueda anterior si llega una nueva
    setCargando(true)
    setError('')
    api
      .get('/servicios', {
        params: { categoria_id: categoria || undefined, zona: zona || undefined, q: q || undefined },
        signal: control.signal,
      })
      .then(({ data }) => setServicios(data))
      .catch((e) => {
        if (e.name !== 'CanceledError') setError(mensajeDeError(e))
      })
      .finally(() => setCargando(false))
    return () => control.abort()
  }, [categoria, zona, q])

  return (
    <>
      <section className="portada">
        <h1>Encuentra quién te haga el trabajo, cerca de ti</h1>
        <p>Plomeros, electricistas, mecánicos y más en Malambo y el área metropolitana de Barranquilla.</p>
      </section>

      <form className="filtros tarjeta" onSubmit={(e) => e.preventDefault()} role="search">
        <label>
          ¿Qué necesitas?
          <input
            type="search"
            placeholder="Ej.: fuga, pintura, aire…"
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
          />
        </label>
        <label>
          Oficio
          <select value={categoria} onChange={(e) => cambiarFiltro('categoria', e.target.value)}>
            <option value="">Todos los oficios</option>
            {Object.entries(porGrupo).map(([grupo, lista]) => (
              <optgroup key={grupo} label={grupo}>
                {lista.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
              </optgroup>
            ))}
          </select>
        </label>
        <label>
          Zona
          <select value={zona} onChange={(e) => cambiarFiltro('zona', e.target.value)}>
            <option value="">Todas las zonas</option>
            {zonas.map((z) => <option key={z}>{z}</option>)}
          </select>
        </label>
      </form>

      <Aviso>{error}</Aviso>
      {cargando ? (
        <Cargando texto="Buscando servicios…" />
      ) : servicios.length === 0 && !error ? (
        <div className="vacio">
          <p>😕 No encontramos servicios con esos filtros.</p>
          <p className="tenue">Prueba con otra zona u otro oficio.</p>
        </div>
      ) : (
        <div className="rejilla">
          {servicios.map((s) => <TarjetaServicio key={s.id} servicio={s} />)}
        </div>
      )}
    </>
  )
}
