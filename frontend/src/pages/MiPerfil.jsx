// Activar el perfil de trabajador (RF2) y publicar o pausar servicios (RF3).
import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import api, { mensajeDeError, pesos } from '../api'
import { useAuth } from '../context/AuthContext'
import { useCatalogo } from '../hooks/useCatalogo'
import Aviso from '../components/Aviso'

function FormPerfil() {
  const { usuario, actualizarUsuario } = useAuth()
  const { zonas } = useCatalogo()
  const [form, setForm] = useState({ descripcion: usuario.descripcion ?? '', zona: usuario.zona ?? '' })
  const [aviso, setAviso] = useState({ tipo: '', texto: '' })

  const guardar = async (e) => {
    e.preventDefault()
    try {
      const { data } = await api.put('/usuarios/me/trabajador', form)
      actualizarUsuario(data) // el contexto se actualiza y el menú cambia a «Mi perfil»
      setAviso({ tipo: 'exito', texto: 'Perfil guardado.' })
    } catch (err) {
      setAviso({ tipo: 'error', texto: mensajeDeError(err) })
    }
  }

  return (
    <form className="tarjeta formulario" onSubmit={guardar}>
      <h2>{usuario.es_trabajador ? 'Tu perfil de trabajador' : 'Activa tu perfil de trabajador'}</h2>
      {!usuario.es_trabajador && <p className="tenue">Con tu misma cuenta puedes ofrecer tus servicios.</p>}
      <label>¿Quién eres y qué sabes hacer?
        <textarea required minLength={10} maxLength={600} rows={3} value={form.descripcion}
          onChange={(e) => setForm({ ...form, descripcion: e.target.value })} />
      </label>
      <label>Zona donde trabajas
        <select required value={form.zona} onChange={(e) => setForm({ ...form, zona: e.target.value })}>
          <option value="">Elige…</option>
          {zonas.map((z) => <option key={z}>{z}</option>)}
        </select>
      </label>
      <Aviso tipo={aviso.tipo}>{aviso.texto}</Aviso>
      <button className="boton">{usuario.es_trabajador ? 'Guardar cambios' : 'Activar perfil'}</button>
      {usuario.es_trabajador && <Link to={`/trabajadores/${usuario.id}`}>Ver mi perfil público →</Link>}
    </form>
  )
}

const servicioVacio = { categoria_id: '', titulo: '', descripcion: '', precio_desde: '', tiempo_estimado: '' }

function MisServicios() {
  const { porGrupo } = useCatalogo()
  const [servicios, setServicios] = useState([])
  const [form, setForm] = useState(servicioVacio)
  const [aviso, setAviso] = useState({ tipo: '', texto: '' })

  useEffect(() => {
    api.get('/servicios/mios').then(({ data }) => setServicios(data)).catch(() => {})
  }, [])

  const cambiar = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const publicar = async (e) => {
    e.preventDefault()
    try {
      const { data } = await api.post('/servicios', {
        ...form,
        categoria_id: Number(form.categoria_id),
        precio_desde: Number(form.precio_desde),
      })
      setServicios([data, ...servicios])
      setForm(servicioVacio)
      setAviso({ tipo: 'exito', texto: '¡Servicio publicado! Ya aparece en la búsqueda.' })
    } catch (err) {
      setAviso({ tipo: 'error', texto: mensajeDeError(err) })
    }
  }

  const alternar = async (s) => {
    try {
      const { data } = await api.patch(`/servicios/${s.id}`, { activo: !s.activo })
      setServicios(servicios.map((x) => (x.id === s.id ? data : x)))
    } catch (err) {
      setAviso({ tipo: 'error', texto: mensajeDeError(err) })
    }
  }

  return (
    <>
      <form className="tarjeta formulario" onSubmit={publicar}>
        <h2>Publicar un servicio</h2>
        <label>Oficio
          <select name="categoria_id" required value={form.categoria_id} onChange={cambiar}>
            <option value="">Elige…</option>
            {Object.entries(porGrupo).map(([grupo, lista]) => (
              <optgroup key={grupo} label={grupo}>
                {lista.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
              </optgroup>
            ))}
          </select>
        </label>
        <label>Título<input name="titulo" required minLength={5} maxLength={120} placeholder="Ej.: Arreglo de fugas en baño y cocina" value={form.titulo} onChange={cambiar} /></label>
        <label>Descripción<textarea name="descripcion" required minLength={10} rows={3} value={form.descripcion} onChange={cambiar} /></label>
        <div className="fila">
          <label>Precio desde (COP)<input name="precio_desde" type="number" min={0} step={1000} required value={form.precio_desde} onChange={cambiar} /></label>
          <label>Tiempo estimado<input name="tiempo_estimado" required placeholder="Ej.: 2 horas" value={form.tiempo_estimado} onChange={cambiar} /></label>
        </div>
        <Aviso tipo={aviso.tipo}>{aviso.texto}</Aviso>
        <button className="boton">Publicar</button>
      </form>

      <h2>Mis servicios</h2>
      {servicios.length === 0 && <p className="tenue">Aún no has publicado servicios.</p>}
      <ul className="lista-simple">
        {servicios.map((s) => (
          <li key={s.id} className="tarjeta fila-servicio">
            <div>
              <Link to={`/servicios/${s.id}`}><strong>{s.titulo}</strong></Link>
              <div className="tenue">{s.categoria.nombre} · desde {pesos.format(s.precio_desde)}</div>
            </div>
            <button className={s.activo ? 'boton boton-secundario' : 'boton'} onClick={() => alternar(s)}>
              {s.activo ? 'Pausar' : 'Reactivar'}
            </button>
          </li>
        ))}
      </ul>
    </>
  )
}

export default function MiPerfil() {
  const { usuario } = useAuth()
  return (
    <div className="columnas">
      <FormPerfil />
      {usuario.es_trabajador && <div><MisServicios /></div>}
    </div>
  )
}
