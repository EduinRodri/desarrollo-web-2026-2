// Detalle de un servicio y botón para pedirlo (RF5).
import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import api, { mensajeDeError, pesos } from '../api'
import { useAuth } from '../context/AuthContext'
import Estrellas, { Nivel } from '../components/Estrellas'
import Cargando from '../components/Cargando'
import Aviso from '../components/Aviso'

export default function Servicio() {
  const { id } = useParams() // el :id de la ruta /servicios/:id
  const { usuario } = useAuth()
  const navegar = useNavigate()
  const [servicio, setServicio] = useState(null)
  const [error, setError] = useState('')
  const [enviando, setEnviando] = useState(false)

  useEffect(() => {
    api.get(`/servicios/${id}`).then(({ data }) => setServicio(data)).catch((e) => setError(mensajeDeError(e)))
  }, [id])

  const pedir = async () => {
    if (!usuario) return navegar('/ingresar', { state: { desde: `/servicios/${id}` } })
    setEnviando(true)
    setError('')
    try {
      await api.post('/pedidos', { servicio_id: Number(id) })
      navegar('/pedidos', { state: { aviso: '¡Pedido enviado! El trabajador debe aceptarlo.' } })
    } catch (e) {
      setError(mensajeDeError(e))
    } finally {
      setEnviando(false)
    }
  }

  if (error && !servicio) return <Aviso>{error}</Aviso>
  if (!servicio) return <Cargando />

  const { trabajador, reputacion: rep } = servicio
  const esMio = usuario?.id === trabajador.id

  return (
    <article className="tarjeta detalle">
      <Link to="/" className="volver">← Volver a la búsqueda</Link>
      <span className="etiqueta">{servicio.categoria.grupo} · {servicio.categoria.nombre}</span>
      <h1>{servicio.titulo}</h1>
      <p className="precio grande">Desde {pesos.format(servicio.precio_desde)}</p>
      <p>⏱️ Tiempo estimado: {servicio.tiempo_estimado}</p>
      <p className="descripcion">{servicio.descripcion}</p>

      <div className="caja-trabajador">
        <div className="avatar" aria-hidden="true">{trabajador.nombre[0]}</div>
        <div>
          <Link to={`/trabajadores/${trabajador.id}`}><strong>{trabajador.nombre}</strong></Link>
          <div className="tenue">📍 {trabajador.zona}</div>
          <div><Nivel reputacion={rep} /> {rep.resenas > 0 && <><Estrellas valor={rep.promedio} /> {rep.promedio} ({rep.resenas} reseñas)</>}</div>
        </div>
      </div>

      <Aviso>{error}</Aviso>
      {esMio ? (
        <p className="tenue">Este es tu servicio. Puedes editarlo en «Mi perfil».</p>
      ) : (
        <button className="boton boton-grande" onClick={pedir} disabled={enviando || !servicio.activo}>
          {enviando ? 'Enviando…' : usuario ? 'Pedir este servicio' : 'Ingresa para pedirlo'}
        </button>
      )}
    </article>
  )
}
