// Activar el perfil de trabajador (RF2) y publicar o pausar servicios (RF3).
// Psicología aplicada:
// - Motivación: antes de pedir datos se dice qué gana el trabajador (más clientes, reputación propia).
// - Ancla de precio honesta: la ayuda sugiere un precio «desde» realista, porque un precio que
//   después sube rompe la confianza.
// - Pausar en vez de borrar: es reversible, así que no necesita confirmación (NN/g).
import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { Eye, Megaphone, Pause, Play, Star, TrendingUp } from 'lucide-react'
import api, { mensajeDeError, pesos } from '../api'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { useCatalogo } from '../hooks/useCatalogo'
import { Aviso, Campo } from '../components/Ui'
import { useTitulo } from '../hooks/useTitulo'

function FormPerfil() {
  const { usuario, actualizarUsuario } = useAuth()
  const { avisar } = useToast()
  const { zonas } = useCatalogo()
  const [form, setForm] = useState({ descripcion: usuario.descripcion ?? '', zona: usuario.zona ?? '' })
  const [error, setError] = useState('')
  const [guardando, setGuardando] = useState(false)

  const guardar = async (e) => {
    e.preventDefault()
    setGuardando(true)
    setError('')
    try {
      const { data } = await api.put('/usuarios/me/trabajador', form)
      actualizarUsuario(data) // el contexto se actualiza y el menú cambia a «Mi perfil»
      avisar(usuario.es_trabajador ? 'Perfil actualizado' : 'Listo, ya puedes publicar tus servicios')
    } catch (err) {
      setError(mensajeDeError(err))
    } finally {
      setGuardando(false)
    }
  }

  return (
    <form className="tarjeta pila" onSubmit={guardar}>
      <div className="pila-sm">
        <h1>{usuario.es_trabajador ? 'Tu perfil de trabajador' : 'Ofrece tus servicios'}</h1>
        {!usuario.es_trabajador && (
          <ul className="beneficios">
            <li><Megaphone aria-hidden="true" /> Te encuentran clientes de tu zona</li>
            <li><Star aria-hidden="true" /> Cada trabajo bien hecho suma a tu reputación</li>
            <li><TrendingUp aria-hidden="true" /> Con buenas reseñas llegas a «Recomendado»</li>
          </ul>
        )}
      </div>
      <Campo etiqueta="Cuéntale a tus clientes quién eres" ayuda="Tu experiencia y qué te diferencia. Mínimo 10 caracteres.">
        {(a11y) => <textarea {...a11y} required minLength={10} maxLength={600} rows={4} value={form.descripcion}
          placeholder="Plomero con 10 años de experiencia. Llevo mis herramientas y doy garantía."
          onChange={(e) => setForm({ ...form, descripcion: e.target.value })} />}
      </Campo>
      <Campo etiqueta="Zona donde trabajas">
        {(a11y) => (
          <select {...a11y} required value={form.zona} onChange={(e) => setForm({ ...form, zona: e.target.value })}>
            <option value="">Elige tu municipio</option>
            {zonas.map((z) => <option key={z}>{z}</option>)}
          </select>
        )}
      </Campo>
      <Aviso>{error}</Aviso>
      <button className="boton" disabled={guardando}>{guardando ? 'Guardando…' : usuario.es_trabajador ? 'Guardar cambios' : 'Activar mi perfil'}</button>
      {usuario.es_trabajador && <Link to={`/trabajadores/${usuario.id}`} className="boton boton-fantasma"><Eye aria-hidden="true" /> Ver mi perfil público</Link>}
    </form>
  )
}

const servicioVacio = { categoria_id: '', titulo: '', descripcion: '', precio_desde: '', tiempo_estimado: '' }

function MisServicios() {
  const { porGrupo } = useCatalogo()
  const { avisar } = useToast()
  const [servicios, setServicios] = useState(null)
  const [form, setForm] = useState(servicioVacio)
  const [error, setError] = useState('')
  const [publicando, setPublicando] = useState(false)

  useEffect(() => {
    api.get('/servicios/mios').then(({ data }) => setServicios(data)).catch(() => setServicios([]))
  }, [])

  const cambiar = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const publicar = async (e) => {
    e.preventDefault()
    setPublicando(true)
    setError('')
    try {
      const { data } = await api.post('/servicios', {
        ...form, categoria_id: Number(form.categoria_id), precio_desde: Number(form.precio_desde),
      })
      setServicios([data, ...servicios])
      setForm(servicioVacio)
      avisar('Servicio publicado. Ya aparece en la búsqueda.')
    } catch (err) {
      setError(mensajeDeError(err))
    } finally {
      setPublicando(false)
    }
  }

  const alternar = async (s) => {
    try {
      const { data } = await api.patch(`/servicios/${s.id}`, { activo: !s.activo })
      setServicios(servicios.map((x) => (x.id === s.id ? data : x)))
      avisar(data.activo ? 'Servicio visible otra vez' : 'Servicio pausado: ya no aparece en la búsqueda')
    } catch (err) {
      avisar(mensajeDeError(err), 'error')
    }
  }

  return (
    <div className="pila">
      <section className="tarjeta">
        <h2>Tus servicios</h2>
        {servicios === null ? <div className="esqueleto" style={{ height: 60, marginTop: 12 }} /> :
          servicios.length === 0 ? <p className="suave" style={{ marginTop: 8 }}>Aún no has publicado servicios. Empieza con el que más te piden.</p> : (
            <ul className="lista-limpia">
              {servicios.map((s) => (
                <li key={s.id} className="fila-servicio">
                  <div style={{ minWidth: 0 }}>
                    <Link to={`/servicios/${s.id}`}>{s.titulo}</Link>
                    <div className="texto-sm suave">{s.categoria.nombre} · desde {pesos.format(s.precio_desde)}{!s.activo && ' · Pausado'}</div>
                  </div>
                  <button className="boton boton-secundario boton-sm" onClick={() => alternar(s)} aria-label={`${s.activo ? 'Pausar' : 'Reactivar'} ${s.titulo}`}>
                    {s.activo ? <><Pause aria-hidden="true" /> Pausar</> : <><Play aria-hidden="true" /> Reactivar</>}
                  </button>
                </li>
              ))}
            </ul>
          )}
      </section>

      <form className="tarjeta pila" onSubmit={publicar}>
        <h2>Publicar un servicio</h2>
        <Campo etiqueta="Oficio">
          {(a11y) => (
            <select {...a11y} name="categoria_id" required value={form.categoria_id} onChange={cambiar}>
              <option value="">Elige el oficio</option>
              {Object.entries(porGrupo).map(([grupo, lista]) => (
                <optgroup key={grupo} label={grupo}>{lista.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}</optgroup>
              ))}
            </select>
          )}
        </Campo>
        <Campo etiqueta="Título" ayuda="Lo que el cliente busca, en pocas palabras.">
          {(a11y) => <input {...a11y} name="titulo" required minLength={5} maxLength={120} placeholder="Arreglo de fugas en baño y cocina" value={form.titulo} onChange={cambiar} />}
        </Campo>
        <Campo etiqueta="Qué incluye">
          {(a11y) => <textarea {...a11y} name="descripcion" required minLength={10} rows={3} placeholder="Reviso tuberías y llaves, encuentro la fuga y la reparo." value={form.descripcion} onChange={cambiar} />}
        </Campo>
        <div className="dos-columnas">
          <Campo etiqueta="Precio desde (COP)" ayuda="Un precio realista genera confianza.">
            {(a11y) => <input {...a11y} name="precio_desde" type="number" inputMode="numeric" min={0} step={1000} required placeholder="40000" value={form.precio_desde} onChange={cambiar} />}
          </Campo>
          <Campo etiqueta="Tiempo estimado" ayuda="Lo que normalmente tardas.">
            {(a11y) => <input {...a11y} name="tiempo_estimado" required placeholder="2 horas" value={form.tiempo_estimado} onChange={cambiar} />}
          </Campo>
        </div>
        <Aviso>{error}</Aviso>
        <button className="boton" disabled={publicando}>{publicando ? 'Publicando…' : 'Publicar servicio'}</button>
      </form>
    </div>
  )
}

export default function MiPerfil() {
  useTitulo('Mi perfil')
  const { usuario } = useAuth()
  return (
    <div className={usuario.es_trabajador ? 'columnas' : ''} style={usuario.es_trabajador ? undefined : { maxWidth: 560, margin: '0 auto' }}>
      <FormPerfil />
      {usuario.es_trabajador && <MisServicios />}
    </div>
  )
}
