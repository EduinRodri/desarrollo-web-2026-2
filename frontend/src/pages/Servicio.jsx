// Detalle de un servicio y botón para pedirlo (RF5).
// Psicología aplicada:
// - Ley de Fitts: en el celular el botón «Pedir» queda fijo abajo, grande y al alcance del pulgar.
// - Menos incertidumbre = menos abandono: «Cómo funciona» en 3 pasos y «no pagas nada ahora».
// - Prueba social: las últimas reseñas del trabajador, con nombre y fecha.
import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { ChevronLeft, ChevronRight, Clock, MapPin, Send } from 'lucide-react'
import api, { esNoEncontrado, mensajeDeError, pesos } from '../api'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { useTitulo } from '../hooks/useTitulo'
import { Aviso, Avatar, Calificacion, EstadoVacio, Estrellas, Nivel, SinConexion } from '../components/Ui'
import { CamelloEsperando } from '../components/Camello'

function Esqueleto() {
  return (
    <div className="detalle" aria-busy="true">
      <div className="tarjeta pila">
        <div className="esqueleto" style={{ height: 14, width: 180 }} />
        <div className="esqueleto" style={{ height: 32, width: '80%' }} />
        <div className="esqueleto" style={{ height: 64 }} />
        <div className="esqueleto" style={{ height: 96 }} />
      </div>
      <div className="tarjeta"><div className="esqueleto" style={{ height: 180 }} /></div>
    </div>
  )
}

export default function Servicio() {
  const { id } = useParams() // el :id de la ruta /servicios/:id
  const { usuario } = useAuth()
  const { avisar } = useToast()
  const navegar = useNavigate()
  const [servicio, setServicio] = useState(null)
  const [resenas, setResenas] = useState([])
  const [error, setError] = useState('')
  const [enviando, setEnviando] = useState(false)
  // Por qué falló la carga: 'no-existe' (404) o 'sin-conexion' (no hubo respuesta o el servidor falló)
  const [fallo, setFallo] = useState(null)
  const [intento, setIntento] = useState(0) // cambiarlo vuelve a cargar (botón «Reintentar»)
  useTitulo(servicio ? servicio.titulo : fallo === 'no-existe' ? 'Servicio no encontrado' : 'Servicio')

  useEffect(() => {
    setServicio(null)
    setFallo(null)
    api.get(`/servicios/${id}`)
      .then(({ data }) => {
        setServicio(data)
        // Las reseñas son un extra: si fallan, la página igual sirve para pedir
        return api.get(`/trabajadores/${data.trabajador.id}`)
          .then(({ data: perfil }) => setResenas(perfil.resenas.slice(0, 3)))
          .catch(() => setResenas([]))
      })
      .catch((e) => setFallo(esNoEncontrado(e) ? 'no-existe' : 'sin-conexion'))
  }, [id, intento])

  const pedir = async () => {
    if (!usuario) return navegar('/ingresar', { state: { desde: `/servicios/${id}` } })
    setEnviando(true)
    setError('')
    try {
      await api.post('/pedidos', { servicio_id: Number(id) })
      avisar(`Pedido enviado. ${servicio.trabajador.nombre.split(' ')[0]} lo verá y te responderá.`)
      navegar('/pedidos')
    } catch (e) {
      setError(mensajeDeError(e))
    } finally {
      setEnviando(false)
    }
  }

  if (fallo === 'sin-conexion') return <SinConexion onReintentar={() => setIntento((n) => n + 1)} />
  if (fallo === 'no-existe') {
    return <EstadoVacio esPagina ilustracion={CamelloEsperando} titulo="No encontramos este servicio"
      accion={<Link to="/buscar" className="boton">Buscar otros servicios</Link>}>
      Puede que el maestro lo haya pausado o que el enlace esté mal escrito.
    </EstadoVacio>
  }
  if (!servicio) return <Esqueleto />

  const { trabajador, reputacion: rep } = servicio
  const esMio = usuario?.id === trabajador.id
  const nombre = trabajador.nombre.split(' ')[0]

  const botonPedir = esMio ? (
    <Link to="/mi-perfil" className="boton boton-secundario boton-bloque">Es tu servicio · Editar</Link>
  ) : (
    <button className="boton boton-bloque boton-pedir" onClick={pedir} disabled={enviando || !servicio.activo}>
      <Send aria-hidden="true" /> {enviando ? 'Enviando…' : usuario ? 'Pedir este servicio' : 'Ingresa para pedirlo'}
    </button>
  )

  return (
    <div className="con-cta-movil">
      <nav className="miga" aria-label="Ruta">
        <Link to="/buscar"><ChevronLeft aria-hidden="true" /> Servicios</Link>
        <span aria-hidden="true">/</span>
        <Link to={`/buscar?grupo=${encodeURIComponent(servicio.categoria.grupo)}`}>{servicio.categoria.grupo}</Link>
      </nav>

      <div className="detalle">
        <article className="tarjeta">
          <span className="texto-sm suave">{servicio.categoria.nombre}</span>
          <h1>{servicio.titulo}</h1>
          <div className="fila-flex"><Nivel reputacion={rep} /> <Calificacion reputacion={rep} /></div>

          {/* En el celular, quién hace el trabajo va arriba: es lo que más genera confianza */}
          <Link to={`/trabajadores/${trabajador.id}`} className="persona caja-persona solo-movil">
            <Avatar nombre={trabajador.nombre} />
            <div className="persona-datos" style={{ flex: 1 }}>
              <div className="persona-nombre">{trabajador.nombre}</div>
              <span className="meta"><MapPin aria-hidden="true" /> {trabajador.zona} · Ver perfil</span>
            </div>
            <ChevronRight aria-hidden="true" className="suave" />
          </Link>

          <div className="datos-clave">
            <div className="dato"><span>Precio de referencia</span><strong>Desde {pesos.format(servicio.precio_desde)}</strong></div>
            <div className="dato"><span><Clock aria-hidden="true" /> Tiempo estimado</span><strong>{servicio.tiempo_estimado}</strong></div>
          </div>

          <h2 className="texto-md">Qué incluye</h2>
          <p className="descripcion" style={{ marginTop: 'var(--esp-2)' }}>{servicio.descripcion}</p>

          <h2 className="texto-md" style={{ marginTop: 'var(--esp-6)' }}>Cómo funciona</h2>
          <ol className="pasos">
            <li>Pides el servicio. No pagas nada en la app.</li>
            <li>{nombre} acepta y acuerdan la visita y el precio final.</li>
            <li>Cuando termine, lo calificas para ayudar a tus vecinos.</li>
          </ol>

          {resenas.length > 0 && (
            <>
              <div className="seccion-titulo">
                <h2 className="texto-md">Lo que dicen de {nombre}</h2>
                <Link to={`/trabajadores/${trabajador.id}`} className="texto-sm">Ver todas</Link>
              </div>
              {resenas.map((r, i) => (
                <div key={i} className="resena">
                  <div className="fila-flex"><Estrellas valor={r.estrellas} /> <strong className="texto-sm">{r.cliente}</strong>
                    <span className="texto-xs suave">· {new Date(r.fecha).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })}</span></div>
                  <p className="texto-sm">{r.comentario}</p>
                </div>
              ))}
            </>
          )}
          <p className="texto-xs suave solo-movil" style={{ textAlign: 'center', marginTop: 'var(--esp-4)' }}>No pagas nada ahora · Puedes cancelar antes de que termine</p>
        </article>

        <aside className="tarjeta panel-pedido pila solo-escritorio">
          <Link to={`/trabajadores/${trabajador.id}`} className="persona" style={{ textDecoration: 'none', color: 'inherit' }}>
            <Avatar nombre={trabajador.nombre} tam="avatar-lg" />
            <div className="persona-datos">
              <div className="persona-nombre">{trabajador.nombre}</div>
              <span className="meta"><MapPin aria-hidden="true" /> {trabajador.zona}</span>
            </div>
          </Link>
          {trabajador.descripcion && <p className="texto-sm suave">{trabajador.descripcion}</p>}
          <Aviso>{error}</Aviso>
          {botonPedir}
          {!esMio && <p className="texto-xs suave" style={{ textAlign: 'center' }}>No pagas nada ahora · Puedes cancelar antes de que termine</p>}
        </aside>
      </div>

      {!esMio && (
        <div className="cta-movil">
          <div>
            <span className="precio-etiqueta">Desde</span>
            <span className="precio">{pesos.format(servicio.precio_desde)}</span>
          </div>
          <button className="boton" onClick={pedir} disabled={enviando || !servicio.activo}>
            <Send aria-hidden="true" /> {enviando ? 'Enviando…' : usuario ? 'Pedir servicio' : 'Ingresa para pedir'}
          </button>
        </div>
      )}
    </div>
  )
}
