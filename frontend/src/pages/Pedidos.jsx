// Mis pedidos: como cliente o como trabajador (RF5, RF6, RF7).
// La lista se maneja con useReducer: cargar, reemplazar un pedido actualizado y errores.
// Psicología aplicada:
// - Gradiente de meta (Kivetz, 2006): la línea de tiempo muestra cuánto falta; ver el avance motiva a terminar.
// - Prevención de errores (Nielsen): cancelar y rechazar piden confirmación con botones que dicen el resultado.
// - Regla pico-final (Kahneman): el final del pedido es lo que más se recuerda; por eso calificar es
//   un momento cálido y personal («¿Cómo te fue con Carlos?»), no un formulario frío.
import { useEffect, useReducer, useState } from 'react'
import { Link } from 'react-router'
import { Check, CheckCheck, Handshake, Search, Send, X } from 'lucide-react'
import api, { mensajeDeError, pesos } from '../api'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import DialogoConfirmacion from '../components/DialogoConfirmacion'
import { Avatar, EstadoVacio, Estrellas, SelectorEstrellas } from '../components/Ui'
import { IlustracionPedidos } from '../components/Ilustraciones'

function pedidosReducer(estado, accion) {
  switch (accion.type) {
    case 'CARGANDO':
      return { ...estado, cargando: true }
    case 'CARGADOS':
      return { lista: accion.pedidos, cargando: false }
    case 'ACTUALIZADO':
      return { ...estado, lista: estado.lista.map((p) => (p.id === accion.pedido.id ? accion.pedido : p)) }
    default:
      return estado
  }
}

const ETIQUETA = { pendiente: 'Esperando respuesta', aceptado: 'Aceptado', terminado: 'Terminado', rechazado: 'Rechazado', cancelado: 'Cancelado' }

// Qué botones ve cada quien según el estado (igual que la máquina de estados de la API).
const ACCIONES = {
  trabajador: {
    pendiente: [{ a: 'aceptado', texto: 'Aceptar', icono: Check }, { a: 'rechazado', texto: 'Rechazar', icono: X, peligro: true }],
    aceptado: [{ a: 'terminado', texto: 'Marcar terminado', icono: CheckCheck }, { a: 'cancelado', texto: 'Cancelar', icono: X, peligro: true }],
  },
  cliente: {
    pendiente: [{ a: 'cancelado', texto: 'Cancelar pedido', icono: X, peligro: true }],
    aceptado: [{ a: 'cancelado', texto: 'Cancelar pedido', icono: X, peligro: true }],
  },
}

function LineaTiempo({ pedido }) {
  const pasos = [
    { clave: 'enviado', texto: 'Enviado', icono: Send },
    { clave: 'aceptado', texto: 'Aceptado', icono: Handshake },
    { clave: 'terminado', texto: 'Terminado', icono: CheckCheck },
    { clave: 'calificado', texto: 'Calificado', icono: Check },
  ]
  const avance = { pendiente: 1, aceptado: 2, terminado: pedido.estrellas ? 4 : 3 }[pedido.estado]
  if (!avance) return null // rechazado o cancelado: no hay camino que mostrar
  return (
    <ol className="linea-tiempo" aria-label={`Progreso: ${avance} de 4 pasos`}>
      {pasos.map((p, i) => {
        const Icono = p.icono
        const clase = i < avance ? 'hecho' : i === avance ? 'actual' : ''
        return (
          <li key={p.clave} className={clase} aria-current={i === avance ? 'step' : undefined}>
            <span className="punto">{i < avance && <Icono aria-hidden="true" />}</span>
            {p.texto}
          </li>
        )
      })}
    </ol>
  )
}

function FormResena({ pedido, alGuardar }) {
  const [estrellas, setEstrellas] = useState(0)
  const [comentario, setComentario] = useState('')
  const [error, setError] = useState('')
  const [enviando, setEnviando] = useState(false)
  const nombre = pedido.servicio.trabajador.nombre.split(' ')[0]

  const enviar = async (e) => {
    e.preventDefault()
    if (!estrellas) return setError('Toca de 1 a 5 estrellas.')
    if (comentario.trim().length < 3) return setError('Escribe al menos unas palabras.')
    setEnviando(true)
    try {
      const { data } = await api.patch(`/pedidos/${pedido.id}/resena`, { estrellas, comentario })
      alGuardar(data, nombre)
    } catch (err) {
      setError(mensajeDeError(err))
      setEnviando(false)
    }
  }

  return (
    <form className="caja-resena" onSubmit={enviar}>
      <div>
        <strong>¿Cómo te fue con {nombre}?</strong>
        <p className="texto-sm suave">Tu reseña ayuda a tus vecinos a elegir y a {nombre} a crecer.</p>
      </div>
      <SelectorEstrellas valor={estrellas} onChange={(n) => { setEstrellas(n); setError('') }} />
      <label className="solo-lector" htmlFor={`comentario-${pedido.id}`}>Comentario</label>
      <textarea id={`comentario-${pedido.id}`} rows={2} maxLength={500} placeholder="Llegó puntual y dejó todo limpio."
        value={comentario} onChange={(e) => { setComentario(e.target.value); setError('') }} />
      {error && <span className="campo-error" role="alert">{error}</span>}
      <button className="boton" disabled={enviando}>{enviando ? 'Enviando…' : 'Publicar reseña'}</button>
    </form>
  )
}

export default function Pedidos() {
  const { usuario } = useAuth()
  const { avisar } = useToast()
  const [como, setComo] = useState('cliente')
  const [estado, dispatch] = useReducer(pedidosReducer, { lista: [], cargando: true })
  const [confirmar, setConfirmar] = useState(null) // { pedido, accion }

  useEffect(() => {
    dispatch({ type: 'CARGANDO' })
    api.get('/pedidos', { params: { como } })
      .then(({ data }) => dispatch({ type: 'CARGADOS', pedidos: data }))
      .catch((e) => { avisar(mensajeDeError(e), 'error'); dispatch({ type: 'CARGADOS', pedidos: [] }) })
  }, [como, avisar])

  const cambiarEstado = async (pedido, nuevo) => {
    setConfirmar(null)
    try {
      const { data } = await api.patch(`/pedidos/${pedido.id}`, { estado: nuevo })
      dispatch({ type: 'ACTUALIZADO', pedido: data })
      avisar({ aceptado: 'Aceptaste el pedido. Coordina la visita con el cliente.', terminado: 'Trabajo terminado. El cliente ya puede calificarte.', rechazado: 'Pedido rechazado', cancelado: 'Pedido cancelado' }[nuevo])
    } catch (e) {
      avisar(mensajeDeError(e), 'error')
    }
  }

  const pedirConfirmacion = (pedido, accion) => (accion.peligro ? setConfirmar({ pedido, accion }) : cambiarEstado(pedido, accion.a))

  return (
    <>
      <div className="seccion-titulo" style={{ marginTop: 'var(--esp-2)' }}><h1>Mis pedidos</h1></div>
      {usuario.es_trabajador && (
        <div className="pestanas" role="tablist" aria-label="Tipo de pedidos">
          <button role="tab" aria-selected={como === 'cliente'} onClick={() => setComo('cliente')}>Los que pedí</button>
          <button role="tab" aria-selected={como === 'trabajador'} onClick={() => setComo('trabajador')}>Los que me pidieron</button>
        </div>
      )}

      {estado.cargando ? (
        <div className="pila" aria-busy="true">{[1, 2].map((i) => <div key={i} className="tarjeta"><div className="esqueleto" style={{ height: 120 }} /></div>)}</div>
      ) : estado.lista.length === 0 ? (
        <EstadoVacio ilustracion={IlustracionPedidos}
          titulo={como === 'cliente' ? 'Todavía no has pedido nada' : 'Aún no te han pedido servicios'}
          accion={como === 'cliente' && <Link to="/" className="boton"><Search aria-hidden="true" /> Buscar un servicio</Link>}>
          {como === 'cliente' ? 'Cuando pidas un servicio, aquí verás cómo va.' : 'Cuando un cliente te pida, te aparecerá aquí para aceptarlo.'}
        </EstadoVacio>
      ) : (
        <ul className="lista-limpia pila">
          {estado.lista.map((p) => {
            const otro = como === 'cliente' ? p.servicio.trabajador : p.cliente
            return (
              <li key={p.id} className="tarjeta pedido">
                <div className="pedido-cabeza">
                  <span className={`estado estado-${p.estado}`}>{ETIQUETA[p.estado]}</span>
                  <span className="texto-xs suave">{new Date(p.fecha).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })}</span>
                </div>
                <div className="persona" style={{ marginBottom: 0, alignItems: 'flex-start' }}>
                  <Avatar nombre={otro.nombre} />
                  <div className="persona-datos">
                    <Link to={`/servicios/${p.servicio.id}`}>{p.servicio.titulo}</Link>
                    <div className="texto-sm suave">{como === 'cliente' ? 'Con' : 'Para'} {otro.nombre} · desde {pesos.format(p.servicio.precio_desde)}</div>
                  </div>
                </div>
                <LineaTiempo pedido={p} />
                <div className="acciones">
                  {(ACCIONES[como][p.estado] ?? []).map((acc) => {
                    const Icono = acc.icono
                    return (
                      <button key={acc.a} className={`boton boton-sm ${acc.peligro ? 'boton-secundario' : ''}`} onClick={() => pedirConfirmacion(p, acc)}>
                        <Icono aria-hidden="true" /> {acc.texto}
                      </button>
                    )
                  })}
                </div>
                {p.estrellas ? (
                  <div className="fila-flex texto-sm"><Estrellas valor={p.estrellas} /> <span className="suave">«{p.comentario}»</span></div>
                ) : como === 'cliente' && p.estado === 'terminado' ? (
                  <FormResena pedido={p} alGuardar={(data, nombre) => {
                    dispatch({ type: 'ACTUALIZADO', pedido: data })
                    avisar(`¡Gracias! Tu reseña ya ayuda a ${nombre}.`)
                  }} />
                ) : null}
              </li>
            )
          })}
        </ul>
      )}

      <DialogoConfirmacion
        abierto={Boolean(confirmar)}
        titulo={confirmar?.accion.a === 'rechazado' ? '¿Rechazar este pedido?' : '¿Cancelar este pedido?'}
        mensaje={confirmar && `«${confirmar.pedido.servicio.titulo}». ${confirmar.accion.a === 'rechazado' ? 'El cliente verá que no lo tomaste.' : 'La otra persona verá que se canceló.'} Esto no se puede deshacer.`}
        confirmar={confirmar?.accion.a === 'rechazado' ? 'Rechazar pedido' : 'Cancelar pedido'}
        mantener="Mantener pedido"
        onConfirmar={() => cambiarEstado(confirmar.pedido, confirmar.accion.a)}
        onCerrar={() => setConfirmar(null)}
      />
    </>
  )
}
