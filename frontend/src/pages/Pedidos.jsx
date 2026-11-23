// Mis pedidos: como cliente o como trabajador (RF5, RF6, RF7).
// La lista se maneja con useReducer: cargar, reemplazar un pedido actualizado y errores.
import { useEffect, useReducer, useState } from 'react'
import { Link, useLocation } from 'react-router'
import api, { mensajeDeError, pesos } from '../api'
import { useAuth } from '../context/AuthContext'
import Estrellas from '../components/Estrellas'
import Cargando from '../components/Cargando'
import Aviso from '../components/Aviso'

function pedidosReducer(estado, accion) {
  switch (accion.type) {
    case 'CARGANDO':
      return { ...estado, cargando: true, error: '' }
    case 'CARGADOS':
      return { lista: accion.pedidos, cargando: false, error: '' }
    case 'ACTUALIZADO':
      return { ...estado, error: '', lista: estado.lista.map((p) => (p.id === accion.pedido.id ? accion.pedido : p)) }
    case 'ERROR':
      return { ...estado, cargando: false, error: accion.mensaje }
    default:
      return estado
  }
}

// Qué botones ve cada quien según el estado (igual que la máquina de estados de la API).
const ACCIONES = {
  trabajador: {
    pendiente: [['aceptado', 'Aceptar'], ['rechazado', 'Rechazar']],
    aceptado: [['terminado', 'Marcar terminado'], ['cancelado', 'Cancelar']],
  },
  cliente: {
    pendiente: [['cancelado', 'Cancelar']],
    aceptado: [['cancelado', 'Cancelar']],
  },
}

function FormResena({ pedido, alGuardar }) {
  const [estrellas, setEstrellas] = useState(0)
  const [comentario, setComentario] = useState('')
  const [error, setError] = useState('')

  const enviar = async (e) => {
    e.preventDefault()
    if (!estrellas) return setError('Elige de 1 a 5 estrellas.')
    try {
      const { data } = await api.patch(`/pedidos/${pedido.id}/resena`, { estrellas, comentario })
      alGuardar(data)
    } catch (err) {
      setError(mensajeDeError(err))
    }
  }

  return (
    <form className="resena" onSubmit={enviar}>
      <strong>¿Cómo te fue?</strong> <Estrellas valor={estrellas} onChange={setEstrellas} />
      <textarea required minLength={3} rows={2} placeholder="Cuéntale a otros clientes cómo fue el trabajo"
        value={comentario} onChange={(e) => setComentario(e.target.value)} />
      <Aviso>{error}</Aviso>
      <button className="boton boton-chico">Enviar reseña</button>
    </form>
  )
}

export default function Pedidos() {
  const { usuario } = useAuth()
  const ubicacion = useLocation()
  const [como, setComo] = useState('cliente')
  const [estado, dispatch] = useReducer(pedidosReducer, { lista: [], cargando: true, error: '' })

  useEffect(() => {
    dispatch({ type: 'CARGANDO' })
    api
      .get('/pedidos', { params: { como } })
      .then(({ data }) => dispatch({ type: 'CARGADOS', pedidos: data }))
      .catch((e) => dispatch({ type: 'ERROR', mensaje: mensajeDeError(e) }))
  }, [como])

  const cambiarEstado = async (pedido, nuevo) => {
    try {
      const { data } = await api.patch(`/pedidos/${pedido.id}`, { estado: nuevo })
      dispatch({ type: 'ACTUALIZADO', pedido: data })
    } catch (e) {
      dispatch({ type: 'ERROR', mensaje: mensajeDeError(e) })
    }
  }

  return (
    <>
      <h1>Mis pedidos</h1>
      <Aviso tipo="exito">{ubicacion.state?.aviso}</Aviso>
      {usuario.es_trabajador && (
        <div className="pestanas" role="tablist">
          <button role="tab" aria-selected={como === 'cliente'} onClick={() => setComo('cliente')}>Los que pedí</button>
          <button role="tab" aria-selected={como === 'trabajador'} onClick={() => setComo('trabajador')}>Los que me pidieron</button>
        </div>
      )}
      <Aviso>{estado.error}</Aviso>
      {estado.cargando ? <Cargando /> : estado.lista.length === 0 ? (
        <div className="vacio">
          <p>No hay pedidos todavía.</p>
          {como === 'cliente' && <Link to="/" className="boton">Buscar un servicio</Link>}
        </div>
      ) : (
        <ul className="lista-simple">
          {estado.lista.map((p) => (
            <li key={p.id} className="tarjeta pedido">
              <div className="pedido-cabeza">
                <Link to={`/servicios/${p.servicio.id}`}><strong>{p.servicio.titulo}</strong></Link>
                <span className={`estado estado-${p.estado}`}>{p.estado}</span>
              </div>
              <div className="tenue">
                {como === 'cliente' ? `Trabajador: ${p.servicio.trabajador.nombre}` : `Cliente: ${p.cliente.nombre}`}
                {' · '}desde {pesos.format(p.servicio.precio_desde)} · {new Date(p.fecha).toLocaleDateString('es-CO')}
              </div>
              <div className="acciones">
                {(ACCIONES[como][p.estado] ?? []).map(([nuevo, texto]) => (
                  <button key={nuevo} className={nuevo === 'cancelado' || nuevo === 'rechazado' ? 'boton boton-secundario' : 'boton'}
                    onClick={() => cambiarEstado(p, nuevo)}>{texto}</button>
                ))}
              </div>
              {p.estrellas ? (
                <p><Estrellas valor={p.estrellas} /> {p.comentario}</p>
              ) : como === 'cliente' && p.estado === 'terminado' ? (
                <FormResena pedido={p} alGuardar={(data) => dispatch({ type: 'ACTUALIZADO', pedido: data })} />
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </>
  )
}
