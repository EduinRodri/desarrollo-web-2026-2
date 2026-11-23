// Perfil público del trabajador: nivel, servicios y reseñas (RF8).
// Psicología: la distribución de estrellas deja ver también las reseñas malas. Esconderlas genera
// desconfianza; mostrarlas genera credibilidad (Baymard: la gente busca activamente las negativas).
import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router'
import { MapPin } from 'lucide-react'
import api, { mensajeDeError } from '../api'
import TarjetaServicio from '../components/TarjetaServicio'
import { Avatar, EstadoVacio, Estrellas, MIN_RESENAS_PROMEDIO, Nivel } from '../components/Ui'
import { IlustracionPerdido } from '../components/Ilustraciones'

const numero = new Intl.NumberFormat('es-CO', { minimumFractionDigits: 1, maximumFractionDigits: 1 })

export default function Trabajador() {
  const { id } = useParams()
  const [perfil, setPerfil] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    api.get(`/trabajadores/${id}`).then(({ data }) => setPerfil(data)).catch((e) => setError(mensajeDeError(e)))
  }, [id])

  if (error) {
    return <EstadoVacio ilustracion={IlustracionPerdido} titulo="No encontramos este perfil"
      accion={<Link to="/buscar" className="boton">Buscar trabajadores</Link>}>{error}</EstadoVacio>
  }
  if (!perfil) return <div className="tarjeta" aria-busy="true"><div className="esqueleto" style={{ height: 180 }} /></div>

  const { trabajador, reputacion: rep, servicios, resenas } = perfil
  const conteo = [5, 4, 3, 2, 1].map((n) => ({ n, c: resenas.filter((r) => r.estrellas === n).length }))
  const nombre = trabajador.nombre.split(' ')[0]

  return (
    <>
      <section className="tarjeta">
        <div className="perfil-cabeza">
          <Avatar nombre={trabajador.nombre} tam="avatar-xl" />
          <div className="pila-sm">
            <h1>{trabajador.nombre}</h1>
            <span className="meta"><MapPin aria-hidden="true" /> {trabajador.zona}</span>
            <div><Nivel reputacion={rep} /></div>
          </div>
        </div>
        {trabajador.descripcion && <p style={{ marginTop: 'var(--esp-4)' }}>{trabajador.descripcion}</p>}
        <div className="estadisticas">
          <div className="estadistica">
            <strong>{rep.resenas >= MIN_RESENAS_PROMEDIO ? numero.format(rep.promedio) : '—'}</strong>
            <span>Promedio</span>
          </div>
          <div className="estadistica"><strong>{rep.resenas}</strong><span>Reseñas</span></div>
          <div className="estadistica"><strong>{servicios.length}</strong><span>Servicios</span></div>
        </div>
      </section>

      <div className="seccion-titulo"><h2>Servicios de {nombre}</h2></div>
      <div className="rejilla">
        {servicios.map((s) => <TarjetaServicio key={s.id} servicio={s} mostrarPersona={false} />)}
      </div>

      <div className="seccion-titulo"><h2>Reseñas</h2></div>
      {resenas.length === 0 ? (
        <p className="suave">{nombre} todavía no tiene reseñas. Todos empiezan como «Nuevo»: ¡puedes ser su primer cliente!</p>
      ) : (
        <div className="columnas">
          {rep.resenas >= MIN_RESENAS_PROMEDIO && (
            <div className="tarjeta">
              <div className="distribucion" aria-label="Distribución de calificaciones">
                {conteo.map(({ n, c }) => (
                  <div key={n} className="distribucion-fila">
                    <span>{n} ★</span>
                    <div className="barra-fondo"><div className="barra-valor" style={{ width: `${(c / resenas.length) * 100}%` }} /></div>
                    <span className="suave">{c}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          <div className="tarjeta" style={{ paddingTop: 0, paddingBottom: 0 }}>
            {resenas.map((r, i) => (
              <div key={i} className="resena">
                <div className="fila-flex"><Estrellas valor={r.estrellas} /> <strong className="texto-sm">{r.cliente}</strong>
                  <span className="texto-xs suave">· {new Date(r.fecha).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' })}</span></div>
                <p className="texto-sm">{r.comentario}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  )
}
