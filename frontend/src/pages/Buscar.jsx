// Pantalla principal: buscar servicios (RF4).
// Psicología aplicada:
// - Ley de Hick: 6 grupos con ícono en vez de una lista de 43 oficios → se decide más rápido.
// - Reducir el riesgo percibido: tres garantías visibles antes de pedir.
// - Prueba social bien calculada: se ordena con un promedio bayesiano, para que un 5,0 con 1 reseña
//   no le gane a un 4,8 con 50 (Baymard: la gente confía más en muchas reseñas que en un promedio alto).
// Los filtros viven en la URL (?grupo=Vehículos&zona=Malambo): se pueden compartir por WhatsApp.
import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router'
import { HandCoins, LayoutGrid, Search, ShieldCheck, UserCheck } from 'lucide-react'
import api, { mensajeDeError } from '../api'
import { useCatalogo } from '../hooks/useCatalogo'
import TarjetaServicio from '../components/TarjetaServicio'
import { Aviso, EstadoVacio, TarjetaEsqueleto } from '../components/Ui'
import { IlustracionBusqueda } from '../components/Ilustraciones'
import { ICONOS_GRUPO, NOMBRE_CORTO } from '../components/oficios'
import { puntaje } from '../reputacion'


export default function Buscar() {
  const { grupos, zonas } = useCatalogo()
  const [params, setParams] = useSearchParams()
  const grupo = params.get('grupo') ?? ''
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

  // «Debounce»: espera 400 ms después de la última tecla antes de buscar.
  useEffect(() => {
    const t = setTimeout(() => {
      if (texto.trim() !== q) cambiarFiltro('q', texto.trim())
    }, 400)
    return () => clearTimeout(t)
  }, [texto]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const control = new AbortController() // cancela la búsqueda anterior si llega una nueva
    setCargando(true)
    setError('')
    api
      .get('/servicios', {
        params: { grupo: grupo || undefined, zona: zona || undefined, q: q || undefined },
        signal: control.signal,
      })
      .then(({ data }) => setServicios(data))
      .catch((e) => { if (e.name !== 'CanceledError') setError(mensajeDeError(e)) })
      .finally(() => { if (!control.signal.aborted) setCargando(false) })
    return () => control.abort()
  }, [grupo, zona, q])

  const ordenados = useMemo(() => [...servicios].sort((a, b) => puntaje(b) - puntaje(a)), [servicios])
  const hayFiltros = grupo || zona || q

  return (
    <>
      <section className="portada">
        <h1>¿Qué necesitas arreglar hoy?</h1>
        <p>Trabajadores de tu zona, con reseñas de clientes reales.</p>

        <form className="buscador" role="search" onSubmit={(e) => e.preventDefault()}>
          <div className="caja-busqueda">
            <Search aria-hidden="true" />
            <label htmlFor="q" className="solo-lector">Buscar un servicio</label>
            <input id="q" type="search" enterKeyHint="search" placeholder="Fuga, aire, pintura…"
              value={texto} onChange={(e) => setTexto(e.target.value)} autoComplete="off" />
          </div>
          <div>
            <label htmlFor="zona" className="solo-lector">Zona</label>
            <select id="zona" value={zona} onChange={(e) => cambiarFiltro('zona', e.target.value)}>
              <option value="">Todas las zonas</option>
              {zonas.map((z) => <option key={z}>{z}</option>)}
            </select>
          </div>
        </form>
      </section>

      <div className="chips" role="group" aria-label="Filtrar por tipo de oficio">
        <button type="button" className="chip" aria-pressed={!grupo} onClick={() => cambiarFiltro('grupo', '')}>
          <LayoutGrid aria-hidden="true" /> Todos
        </button>
        {Object.keys(ICONOS_GRUPO).filter((g) => grupos.includes(g)).map((g) => {
          const Icono = ICONOS_GRUPO[g] ?? LayoutGrid
          return (
            <button key={g} type="button" className="chip" aria-pressed={grupo === g}
              onClick={(e) => { cambiarFiltro('grupo', grupo === g ? '' : g); e.currentTarget.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' }) }} title={g}>
              <Icono aria-hidden="true" /> {NOMBRE_CORTO[g] ?? g}
            </button>
          )
        })}
      </div>

      <div className="barra-resultados">
        <h2 className="texto-sm suave" style={{ fontWeight: 500 }} aria-live="polite">
          {cargando ? 'Buscando…' : `${ordenados.length} ${ordenados.length === 1 ? 'servicio' : 'servicios'}${zona ? ` en ${zona}` : ''}`}
        </h2>
        {hayFiltros && !cargando && (
          <button type="button" className="boton boton-fantasma boton-sm"
            onClick={() => { setTexto(''); setParams({}, { replace: true }) }}>Quitar filtros</button>
        )}
      </div>

      <Aviso>{error}</Aviso>
      {cargando ? (
        <div className="rejilla" aria-busy="true">
          {Array.from({ length: 6 }, (_, i) => <TarjetaEsqueleto key={i} />)}
        </div>
      ) : ordenados.length === 0 && !error ? (
        <EstadoVacio ilustracion={IlustracionBusqueda} titulo="No encontramos ese servicio por aquí"
          accion={hayFiltros && <button className="boton boton-secundario" onClick={() => { setTexto(''); setParams({}, { replace: true }) }}>Ver todos los servicios</button>}>
          Prueba con otra palabra, otro tipo de oficio o todas las zonas.
        </EstadoVacio>
      ) : (
        <div className="rejilla">
          {ordenados.map((s) => <TarjetaServicio key={s.id} servicio={s} />)}
        </div>
      )}

      <section className="garantias" aria-label="Cómo te cuidamos">
        <div><ShieldCheck aria-hidden="true" /><span><strong>Reseñas reales</strong>Solo califica quien terminó un pedido.</span></div>
        <div><HandCoins aria-hidden="true" /><span><strong>Pedir no cuesta</strong>El precio final lo acuerdas con el trabajador.</span></div>
        <div><UserCheck aria-hidden="true" /><span><strong>Tú decides</strong>Puedes cancelar mientras no esté terminado.</span></div>
      </section>
    </>
  )
}
