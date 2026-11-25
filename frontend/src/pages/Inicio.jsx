// Página de inicio (landing). Estructura según la investigación:
// 1) propuesta de valor + acción en los primeros 10 segundos (NN/g), 2) oficios (Hick: 6 opciones),
// 3) cómo funciona, 4) prueba social real, 5) por qué confiar (honesto: Fogg, Stanford),
// 6) para trabajadores (el marketplace necesita oferta primero: Andrew Chen, «The Cold Start Problem»),
// 7) preguntas frecuentes que responden objeciones, 8) quién está detrás.
import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { ArrowRight, ChevronDown, HandCoins, MapPin, Search, ShieldCheck, Star, UserCheck } from 'lucide-react'
import api, { pesos } from '../api'
import { useAuth } from '../context/AuthContext'
import { useCatalogo } from '../hooks/useCatalogo'
import { puntaje } from '../reputacion'
import { Avatar, Calificacion, Estrellas, Nivel } from '../components/Ui'
import { Logo, PuntoSol } from '../components/Marca'
import { ICONOS_GRUPO } from '../components/oficios'

const PREGUNTAS = [
  ['¿Cuánto cuesta usar Camellapp?', 'Nada. Buscar, pedir y calificar es gratis. El precio del trabajo lo acuerdas directamente con el maestro; en la app ves un precio de referencia «desde».'],
  ['¿Cómo le pago al trabajador?', 'Directamente, como siempre: efectivo, Nequi o lo que acuerden. Camellapp no maneja tu dinero.'],
  ['¿Verifican a los trabajadores?', 'Todavía no verificamos identidad ni certificados, y preferimos decírtelo claro. Lo que sí garantizamos es que cada reseña viene de un pedido terminado en la app. La verificación llega en la próxima versión.'],
  ['¿Quién puede escribir una reseña?', 'Solo el cliente que pidió el servicio, y solo cuando el pedido está terminado. Una reseña por pedido. Nadie puede calificar su propio servicio.'],
  ['¿Puedo cancelar un pedido?', 'Sí, mientras no esté terminado. El trabajador también puede rechazarlo o cancelarlo.'],
  ['¿En qué zonas funciona?', 'Malambo, Soledad, Barranquilla, Galapa y Puerto Colombia.'],
]

// Oficios más pedidos: atajos debajo de la búsqueda (llevan a /buscar con el texto ya escrito).
const ATAJOS = ['Plomería', 'Aire acondicionado', 'Pintura', 'Electricidad']

// Tarjeta del héroe: un servicio REAL (el mejor calificado), dibujado como nuestra página de detalle.
// Es HTML, no una imagen: el elemento más grande de la pantalla vuelve a ser el titular (mejor LCP).
// Mientras llega la API ocupa el mismo alto, para que nada salte (CLS 0).
function TarjetaHeroe({ servicio }) {
  if (!servicio) return <div className="heroe-tarjeta heroe-tarjeta-cargando" aria-hidden="true"><div className="esqueleto" /></div>
  const { trabajador, categoria, reputacion } = servicio
  return (
    <Link to={`/servicios/${servicio.id}`} className="heroe-tarjeta" aria-label={`Ejemplo real: ${servicio.titulo}, con ${trabajador.nombre}`}>
      <span className="heroe-tarjeta-logo"><Logo /></span>
      <span className="texto-sm suave">Servicios / {categoria.nombre}</span>
      <strong className="heroe-tarjeta-titulo">{servicio.titulo}</strong>
      <span className="fila-flex"><Nivel reputacion={reputacion} /><Calificacion reputacion={reputacion} /></span>
      <span className="heroe-tarjeta-persona">
        <Avatar nombre={trabajador.nombre} />
        <span className="pila-xs">
          <strong className="persona-nombre">{trabajador.nombre}</strong>
          <span className="texto-xs suave">{trabajador.zona} · Ver perfil</span>
        </span>
      </span>
      <span className="texto-sm suave">Precio de referencia <strong className="texto-fuerte">Desde {pesos.format(servicio.precio_desde)}</strong></span>
    </Link>
  )
}

// «Lo dicen los vecinos»: reseñas REALES de pedidos terminados (GET /resenas/destacadas), nunca de ejemplo.
// En vez del barrio del cliente (no lo guardamos), cada una dice a quién califica y por qué oficio.
function Vecinos() {
  const [resenas, setResenas] = useState(null)
  useEffect(() => { api.get('/resenas/destacadas').then(({ data }) => setResenas(data)).catch(() => setResenas([])) }, [])
  if (resenas && resenas.length === 0) return null
  return (
    <section className="bloque" aria-labelledby="t-vecinos">
      <div className="bloque-cabeza"><h2 id="t-vecinos" className="titulo-marca">Lo dicen los vecinos<PuntoSol /></h2></div>
      <div className="rejilla">
        {(resenas ?? [1, 2, 3]).map((r, i) => r.cliente ? (
          <figure key={i} className="tarjeta vecino">
            <Estrellas valor={r.estrellas} />
            <blockquote>{r.comentario}</blockquote>
            <figcaption className="vecino-pie">
              <Avatar nombre={r.cliente} />
              <span className="pila-xs">
                <strong>{r.cliente}</strong>
                <Link to={`/trabajadores/${r.trabajador_id}`} className="texto-xs">sobre {r.trabajador} · {r.oficio}</Link>
              </span>
            </figcaption>
          </figure>
        ) : <div key={i} className="tarjeta vecino" aria-hidden="true"><div className="esqueleto" style={{ height: 150 }} /></div>)}
      </div>
    </section>
  )
}

// Un servicio por trabajador, los mejores según el promedio bayesiano.
// «Mejor calificados» solo si de verdad lo son: 3+ reseñas y promedio de 4 o más.
function mejores(servicios) {
  if (!servicios) return null
  const vistos = new Set()
  return [...servicios].sort((a, b) => puntaje(b) - puntaje(a))
    .filter((s) => s.reputacion?.resenas >= 3 && s.reputacion.promedio >= 4 && !vistos.has(s.trabajador.id) && vistos.add(s.trabajador.id))
}

function Destacados({ top }) {
  if (top && top.length === 0) return null
  return (
    <section className="bloque" aria-labelledby="t-destacados">
      <div className="bloque-cabeza">
        <h2 id="t-destacados">Mejor calificados por tus vecinos</h2>
        <Link to="/buscar" className="enlace-flecha">Ver todos <ArrowRight aria-hidden="true" /></Link>
      </div>
      <div className="rejilla">
        {(top ?? [1, 2, 3]).map((s, i) => s.id ? (
          <Link key={s.id} to={`/trabajadores/${s.trabajador.id}`} className="tarjeta destacado">
            <Avatar nombre={s.trabajador.nombre} tam="avatar-lg" />
            <div className="pila-sm" style={{ minWidth: 0 }}>
              <strong className="persona-nombre">{s.trabajador.nombre}</strong>
              <span className="texto-sm suave">{s.categoria.nombre}</span>
              <span className="meta"><MapPin aria-hidden="true" /> {s.trabajador.zona}</span>
              <div className="fila-flex"><Nivel reputacion={s.reputacion} /><Calificacion reputacion={s.reputacion} /></div>
            </div>
          </Link>
        ) : <div key={i} className="tarjeta destacado" aria-hidden="true"><div className="esqueleto" style={{ height: 96, width: '100%' }} /></div>)}
      </div>
    </section>
  )
}

export default function Inicio() {
  const { usuario } = useAuth()
  const { porGrupo } = useCatalogo()
  const navegar = useNavigate()
  const [texto, setTexto] = useState('')
  // Una sola consulta de servicios para la tarjeta del héroe y los destacados
  const [servicios, setServicios] = useState(null)
  useEffect(() => { api.get('/servicios', { params: { limite: 50 } }).then(({ data }) => setServicios(data)).catch(() => setServicios([])) }, [])
  const top = useMemo(() => mejores(servicios), [servicios])

  const buscar = (e) => {
    e.preventDefault()
    navegar(texto.trim() ? `/buscar?q=${encodeURIComponent(texto.trim())}` : '/buscar')
  }

  return (
    <>
      {/* Héroe (diseño del equipo, 24 nov): titular en la voz de la Costa + búsqueda + atajos + un servicio real.
          Se mantiene la búsqueda (no un botón «Buscar camello»: en la Costa eso suena a «buscar empleo»). */}
      <section className="heroe">
        <div className="heroe-col">
          <p className="sobretitulo">Malambo, Barranquilla y su área metropolitana</p>
          <h1>Ajá, ¿y ese camello quién te lo hace?<PuntoSol /></h1>
          <p className="heroe-texto">Plomeros, electricistas, técnicos y emprendedores de tu barrio, con reseñas de vecinos que ya los contrataron.</p>
          <form className="heroe-busqueda" role="search" onSubmit={buscar}>
            <label htmlFor="q-inicio" className="solo-lector">¿Qué necesitas arreglar?</label>
            <Search aria-hidden="true" />
            <input id="q-inicio" type="search" enterKeyHint="search" placeholder="Fuga, pintura, aire…" value={texto}
              onChange={(e) => setTexto(e.target.value)} autoComplete="off" />
            <button className="boton">Buscar</button>
          </form>
          <nav className="heroe-atajos" aria-label="Oficios más buscados">
            {ATAJOS.map((a) => <Link key={a} to={`/buscar?q=${encodeURIComponent(a)}`} className="chip">{a}</Link>)}
          </nav>
        </div>
        <TarjetaHeroe servicio={top?.[0]} />
      </section>

      <section className="bloque" aria-labelledby="t-oficios">
        <div className="bloque-cabeza"><h2 id="t-oficios">¿Qué tipo de camello necesitas?</h2></div>
        <div className="oficios">
          {/* Los 6 grupos son fijos: se dibujan de una vez para que la página no salte (CLS) mientras llega la API */}
          {Object.keys(ICONOS_GRUPO).map((g) => {
            const Icono = ICONOS_GRUPO[g]
            return (
              <Link key={g} to={`/buscar?grupo=${encodeURIComponent(g)}`} className="oficio">
                <span className="oficio-icono"><Icono aria-hidden="true" /></span>
                <strong>{g}</strong>
                <span className="texto-xs suave">{porGrupo[g] ? `${porGrupo[g].length} oficios` : ' '}</span>
              </Link>
            )
          })}
        </div>
      </section>

      {/* Inspirado en las páginas de producto de Apple: en computador el título se queda fijo (sticky)
          mientras los pasos pasan, y cada paso se ilumina al llegar al centro. Solo CSS, sin descargas extra. */}
      <section className="bloque como-funciona" aria-labelledby="t-como">
        <div className="como-fijo">
          <h2 id="t-como">Así de fácil</h2>
          <p className="suave">Tres pasos, sin pagar nada en la app. Tú decides con quién trabajar.</p>
        </div>
        <ol className="pasos-grandes">
          <li><span>1</span><strong>Busca</strong><p>Elige el oficio y tu municipio. Compara precios de referencia y reseñas.</p></li>
          <li><span>2</span><strong>Pide</strong><p>El maestro acepta y acuerdan la visita y el precio final. Pedir no cuesta nada.</p></li>
          <li><span>3</span><strong>Califica</strong><p>Cuando termine, cuenta cómo te fue. Tu reseña cuida al próximo vecino.</p></li>
        </ol>
      </section>

      <Vecinos />

      <Destacados top={top?.slice(0, 3)} />

      <section className="bloque" aria-labelledby="t-confianza">
        <div className="bloque-cabeza"><h2 id="t-confianza">Por qué confiar</h2></div>
        <div className="garantias" style={{ marginTop: 0 }}>
          <div><ShieldCheck aria-hidden="true" /><span><strong>Reseñas de trabajos reales</strong>Solo califica quien terminó un pedido, una vez por pedido.</span></div>
          <div><Star aria-hidden="true" /><span><strong>Reputación a la vista</strong>Nuevo, Nivel 1 o Recomendado: el nivel se gana con reseñas, no se compra.</span></div>
          <div><HandCoins aria-hidden="true" /><span><strong>Sin cobros escondidos</strong>Camellapp no cobra comisión ni maneja tu dinero.</span></div>
        </div>
      </section>

      {/* Banda para maestros y emprendedores (diseño del equipo, 24 nov). La tarjeta es una vista previa de SU perfil,
          con lo que de verdad tendrá al empezar: insignia «Nuevo» y sin reseñas (no 5 estrellas ni «fotos»,
          que la app todavía no permite subir). Decorativa para lectores de pantalla: el texto ya lo dice. */}
      <section className="banda-trabajador" aria-labelledby="t-trabajador">
        <div className="banda-texto">
          <p className="sobretitulo">Para maestros y emprendedores</p>
          <h2 id="t-trabajador">Tu talento merece clientes<PuntoSol /></h2>
          <p>Crea tu perfil gratis, publica tus servicios y deja que te encuentren en tu barrio. Cada trabajo bien hecho suma a tu reputación.</p>
          <Link to={usuario ? '/mi-perfil' : '/registro'} className="boton boton-claro">
            <UserCheck aria-hidden="true" /> {usuario?.es_trabajador ? 'Ir a mi perfil' : 'Crear mi perfil'}
          </Link>
        </div>
        <div className="perfil-previa" aria-hidden="true">
          <span className="heroe-tarjeta-persona">
            <span className="avatar avatar-lg avatar-tu">TU</span>
            <span className="pila-xs">
              <strong className="perfil-previa-nombre">Tu nombre</strong>
              <span className="texto-sm suave">Tu barrio, Malambo</span>
            </span>
          </span>
          <span className="fila-flex"><span className="chip">Tu servicio</span><span className="chip">Otro servicio</span></span>
          <span className="perfil-previa-hueco">Aquí llegan las reseñas de tus clientes</span>
          <span className="fila-flex"><Nivel reputacion={{ nivel: 'Nuevo' }} /><span className="texto-sm suave">Sin reseñas aún</span></span>
        </div>
      </section>

      <section className="bloque" aria-labelledby="t-faq">
        <div className="bloque-cabeza"><h2 id="t-faq">Preguntas frecuentes</h2></div>
        <div className="faq">
          {PREGUNTAS.map(([p, r]) => (
            <details key={p}>
              <summary>{p}<ChevronDown aria-hidden="true" /></summary>
              <p>{r}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="bloque quienes" aria-labelledby="t-quienes">
        <h2 id="t-quienes">Quién está detrás</h2>
        <p>Camellapp es un emprendimiento de tres estudiantes de Ingeniería de Software de la Corporación Universitaria Iberoamericana. Lo hacemos para que el trabajo de oficio de nuestra región se encuentre fácil y se valore como merece.</p>
        <p className="texto-sm suave">Proyecto académico en desarrollo · <Link to="/privacidad">Tratamiento de datos</Link> · <Link to="/marca">Manual de marca</Link></p>
      </section>
    </>
  )
}
