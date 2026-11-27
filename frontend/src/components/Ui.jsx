// Componentes base del sistema de diseño de Camellapp.
import { useId, useState } from 'react'
import { AlertCircle, BadgeCheck, CheckCircle2, Eye, EyeOff, Info, RotateCw, Sparkles, Star } from 'lucide-react'
import { CamelloSinSenal } from './Camello'

const numero = new Intl.NumberFormat('es-CO', { minimumFractionDigits: 1, maximumFractionDigits: 1 })

// ---------- Avatar con iniciales; el color sale del nombre (siempre el mismo para la misma persona) ----------
export function Avatar({ nombre, tam = '' }) {
  const iniciales = nombre.split(' ').filter(Boolean).slice(0, 2).map((p) => p[0]).join('').toUpperCase()
  let h = 0
  for (const c of nombre) h = (h * 31 + c.charCodeAt(0)) % 360
  return (
    <span className={`avatar ${tam}`} style={{ '--tono': h }} aria-hidden="true">{iniciales}</span>
  )
}

// ---------- Calificación: promedio + número de reseñas (Baymard). Con menos de 3 reseñas no se muestra promedio (Airbnb) ----------
export const MIN_RESENAS_PROMEDIO = 3
export function Calificacion({ reputacion }) {
  if (!reputacion || reputacion.resenas < MIN_RESENAS_PROMEDIO) {
    const n = reputacion?.resenas ?? 0
    return <span className="calificacion suave">{n === 0 ? 'Sin reseñas aún' : `${n} ${n === 1 ? 'reseña' : 'reseñas'}`}</span>
  }
  return (
    <span className="calificacion" aria-label={`${numero.format(reputacion.promedio)} de 5, ${reputacion.resenas} reseñas`}>
      <Star aria-hidden="true" /> <strong>{numero.format(reputacion.promedio)}</strong>
      <span className="suave">({reputacion.resenas})</span>
    </span>
  )
}

export function Estrellas({ valor }) {
  return (
    <span className="estrellas" role="img" aria-label={`${valor} de 5 estrellas`}>
      {[1, 2, 3, 4, 5].map((n) => <Star key={n} className={n <= Math.round(valor) ? 'llena' : ''} aria-hidden="true" />)}
    </span>
  )
}

export function SelectorEstrellas({ valor, onChange }) {
  const textos = ['', 'Malo', 'Regular', 'Bueno', 'Muy bueno', 'Excelente']
  return (
    <div>
      <div className="selector-estrellas" role="radiogroup" aria-label="Calificación">
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} type="button" role="radio" aria-checked={valor === n} aria-label={`${n} estrellas: ${textos[n]}`}
            className={n <= valor ? 'llena' : ''} onClick={() => onChange(n)}>
            <Star aria-hidden="true" />
          </button>
        ))}
      </div>
      <span className="texto-sm suave" aria-live="polite">{textos[valor] || 'Toca una estrella'}</span>
    </div>
  )
}

// ---------- Insignia de nivel (RF8) ----------
export function Nivel({ reputacion }) {
  if (!reputacion) return null
  if (reputacion.nivel === 'Recomendado') {
    return <span className="insignia insignia-recomendado"><BadgeCheck aria-hidden="true" /> Recomendado</span>
  }
  if (reputacion.nivel === 'Nivel 1') return <span className="insignia insignia-nivel1">Nivel 1</span>
  return <span className="insignia insignia-nuevo"><Sparkles aria-hidden="true" /> Nuevo</span>
}

// ---------- Avisos ----------
const iconosAviso = { error: AlertCircle, exito: CheckCircle2, info: Info }
export function Aviso({ tipo = 'error', children }) {
  if (!children) return null
  const Icono = iconosAviso[tipo]
  return (
    <div className={`aviso aviso-${tipo}`} role={tipo === 'error' ? 'alert' : 'status'}>
      <Icono aria-hidden="true" /> <div>{children}</div>
    </div>
  )
}

// ---------- Campo de formulario: etiqueta arriba, ayuda y error enlazados (GOV.UK, web.dev) ----------
export function Campo({ etiqueta, ayuda, error, children }) {
  const id = useId()
  const idAyuda = ayuda ? `${id}-ayuda` : undefined
  const idError = error ? `${id}-error` : undefined
  const control = children({
    id,
    'aria-describedby': [idAyuda, idError].filter(Boolean).join(' ') || undefined,
    'aria-invalid': error ? true : undefined,
  })
  return (
    <div className="campo">
      <label className="campo-etiqueta" htmlFor={id}>{etiqueta}</label>
      {ayuda && <span id={idAyuda} className="campo-ayuda">{ayuda}</span>}
      {control}
      {error && <span id={idError} className="campo-error"><AlertCircle aria-hidden="true" />{error}</span>}
    </div>
  )
}

export function CampoContrasena({ etiqueta = 'Contraseña', ayuda, error, ...props }) {
  const [ver, setVer] = useState(false)
  return (
    <Campo etiqueta={etiqueta} ayuda={ayuda} error={error}>
      {(a11y) => (
        <div className="con-boton">
          <input {...a11y} {...props} type={ver ? 'text' : 'password'} />
          <button type="button" onClick={() => setVer(!ver)} aria-label={ver ? 'Ocultar contraseña' : 'Mostrar contraseña'} aria-pressed={ver}>
            {ver ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}
          </button>
        </div>
      )}
    </Campo>
  )
}

// ---------- Skeleton con la forma real de la tarjeta: la página no salta al cargar ----------
export function TarjetaEsqueleto() {
  return (
    <div className="tarjeta servicio-tarjeta" aria-hidden="true">
      <div className="persona">
        <div className="esqueleto" style={{ width: 44, height: 44, borderRadius: 999 }} />
        <div style={{ flex: 1 }} className="pila-sm">
          <div className="esqueleto" style={{ height: 14, width: '60%' }} />
          <div className="esqueleto" style={{ height: 12, width: '40%' }} />
        </div>
      </div>
      <div className="esqueleto" style={{ height: 18, width: '85%' }} />
      <div className="esqueleto" style={{ height: 14, width: '50%' }} />
      <div className="servicio-pie" style={{ borderTop: 0 }}>
        <div className="esqueleto" style={{ height: 28, width: 110 }} />
        <div className="esqueleto" style={{ height: 16, width: 70 }} />
      </div>
    </div>
  )
}

// esPagina: cuando el estado vacío ES la pantalla (404, «no encontrado», sin conexión), su título es el h1.
export function EstadoVacio({ ilustracion: Ilustracion, titulo, children, accion, esPagina = false }) {
  const Titulo = esPagina ? 'h1' : 'h2'
  return (
    <div className="vacio">
      {Ilustracion && <Ilustracion />}
      <Titulo className={esPagina ? 'vacio-titulo' : undefined}>{titulo}</Titulo>
      {children && <p>{children}</p>}
      {accion}
    </div>
  )
}

// Sin señal: pasa seguido con datos móviles. Se dice qué pasó y se da la salida (reintentar), sin culpar.
// Escena propia (manual §10.5): el camello echado (espera), preocupado pero calmado, con el ícono de sin señal.
export function SinConexion({ onReintentar }) {
  return (
    <EstadoVacio esPagina ilustracion={CamelloSinSenal} titulo="Sin conexión"
      accion={<button type="button" className="boton" onClick={onReintentar}><RotateCw aria-hidden="true" /> Reintentar</button>}>
      No pudimos conectarnos con Camellapp. Revisa tus datos o el wifi e intenta de nuevo.
    </EstadoVacio>
  )
}
