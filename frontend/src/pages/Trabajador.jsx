// Perfil público del trabajador: nivel, servicios y reseñas (RF8).
import { useEffect, useState } from 'react'
import { useParams } from 'react-router'
import api, { mensajeDeError } from '../api'
import Estrellas, { Nivel } from '../components/Estrellas'
import TarjetaServicio from '../components/TarjetaServicio'
import Cargando from '../components/Cargando'
import Aviso from '../components/Aviso'

export default function Trabajador() {
  const { id } = useParams()
  const [perfil, setPerfil] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    api.get(`/trabajadores/${id}`).then(({ data }) => setPerfil(data)).catch((e) => setError(mensajeDeError(e)))
  }, [id])

  if (error) return <Aviso>{error}</Aviso>
  if (!perfil) return <Cargando />
  const { trabajador, reputacion: rep, servicios, resenas } = perfil

  return (
    <>
      <section className="tarjeta perfil">
        <div className="avatar grande" aria-hidden="true">{trabajador.nombre[0]}</div>
        <div>
          <h1>{trabajador.nombre}</h1>
          <p className="tenue">📍 {trabajador.zona}</p>
          <p><Nivel reputacion={rep} /> {rep.resenas > 0 ? <><Estrellas valor={rep.promedio} /> {rep.promedio} · {rep.resenas} reseñas</> : 'Aún sin reseñas'}</p>
          <p>{trabajador.descripcion}</p>
        </div>
      </section>

      <h2>Servicios</h2>
      <div className="rejilla">
        {servicios.map((s) => <TarjetaServicio key={s.id} servicio={s} />)}
      </div>

      <h2>Reseñas</h2>
      {resenas.length === 0 && <p className="tenue">Todavía nadie lo ha calificado.</p>}
      <ul className="lista-resenas">
        {resenas.map((r, i) => (
          <li key={i} className="tarjeta">
            <Estrellas valor={r.estrellas} /> <strong>{r.cliente}</strong>{' '}
            <span className="tenue">· {new Date(r.fecha).toLocaleDateString('es-CO')}</span>
            <p>{r.comentario}</p>
          </li>
        ))}
      </ul>
    </>
  )
}
