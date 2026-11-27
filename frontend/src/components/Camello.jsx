// El camello de Camellapp (manual de marca §10.6). SVG en línea con los tokens: cambia solo en modo oscuro.
// Un personaje, dos poses: «pie» (acción) y «echado» (espera). Cuatro expresiones: solo cambian ojo, boca y oreja.
// La joroba es la C del isotipo abierta al frente y termina en el punto sol (el único sol de la composición).
// Se para sobre el anillo de «estás aquí»: la idea de «cerca de ti». Decorativo: aria-hidden.
import { WifiOff } from 'lucide-react'

const ACCION = 'var(--color-accion)'
const CLARO = 'var(--color-superficie)'
const trazo = (ancho, color = ACCION) => ({ fill: 'none', stroke: color, strokeWidth: ancho, strokeLinecap: 'round', strokeLinejoin: 'round' })

// Ojo y boca de cada expresión, en coordenadas de la cabeza (4,25 × 2,5 u)
const CARAS = {
  contento:   { ojo: <path {...trazo(0.3, CLARO)} d="M2.1 0.95Q2.5 0.4 2.9 0.95" />,
                boca: <path {...trazo(0.25, CLARO)} d="M3.05 1.75Q3.45 2.1 3.85 1.75" />, oreja: 0 },
  buscando:   { ojo: <circle cx="2.6" cy="0.65" r="0.45" fill={CLARO} />,
                boca: <path {...trazo(0.25, CLARO)} d="M3.1 1.85H3.8" />, oreja: -30 },
  preocupado: { ojo: <circle cx="2.5" cy="0.9" r="0.38" fill={CLARO} />,
                boca: <path {...trazo(0.25, CLARO)} d="M3.1 1.95Q3.45 1.7 3.8 1.95" />, oreja: -40 },
  celebrando: { ojo: <path {...trazo(0.3, CLARO)} d="M2.1 0.95Q2.5 0.4 2.9 0.95" />,
                boca: <path fill={CLARO} d="M3 1.55H3.9A0.45 0.45 0 0 1 3 1.55Z" />, oreja: 0 },
}

function Cabeza({ x, y, expresion }) {
  const cara = CARAS[expresion] ?? CARAS.contento
  return (
    <g transform={`translate(${x} ${y})`}>
      <path fill={ACCION} transform={`rotate(${cara.oreja} 1 0.15)`} d="M0.4 0.15a0.6 0.6 0 0 1 1.2 0z" />
      <rect x="0" y="0" width="4.25" height="2.5" rx="1.25" fill={ACCION} />
      {cara.ojo}
      {cara.boca}
    </g>
  )
}

// Anillo de «estás aquí» (en vez de una sombra plana)
function Ubicacion({ cx, cy, rx }) {
  return (
    <>
      <ellipse cx={cx} cy={cy} rx={rx} ry="1.25" {...trazo(0.5)} />
      <ellipse cx={cx} cy={cy} rx={rx - 2.5} ry="0.75" fill="var(--color-accion-suave)" />
    </>
  )
}

function DePie({ expresion }) {
  const celebra = expresion === 'celebrando'
  return (
    <>
      <Ubicacion cx={8.75} cy={18.5} rx={7} />
      <path {...trazo(0.5)} d="M3.75 10.5Q2.75 11.25 3 13" />
      <path {...trazo(1.5)} d={`M5 12.5V18M7 12.5V17.75M11 12.5V18${celebra ? 'M12.75 12.5L14.5 15.75' : 'M12.75 12.5V17.75'}`} />
      <rect x="3.5" y="8.75" width="10" height="4.5" rx="2.25" fill={ACCION} />
      <path {...trazo(2.25)} d="M12.5 10.5Q16 12.5 16.25 7.25" />
      <Cabeza x={15} y={5.25} expresion={expresion} />
      <path {...trazo(2)} d="M5.25 9A3.25 3.25 0 0 1 10.8 6.7" />
      <circle cx="10.8" cy="6.7" r="1.35" fill="var(--sol-500)" />
    </>
  )
}

function Echado({ expresion, senal }) {
  return (
    <>
      <Ubicacion cx={9.25} cy={17.75} rx={7.25} />
      <path {...trazo(0.5)} d="M3.75 11.75Q2.75 12.25 3 14" />
      <rect x="4" y="15.25" width="3.75" height="1.75" rx="0.875" fill={ACCION} />
      <rect x="10" y="15.25" width="4" height="1.75" rx="0.875" fill={ACCION} />
      <rect x="3.5" y="10.5" width="10" height="5.75" rx="2.875" fill={ACCION} />
      <path {...trazo(2.25)} d="M13 12.5Q16.75 13.5 16.75 8.75" />
      <Cabeza x={15.5} y={6.75} expresion={expresion} />
      <path {...trazo(2)} d="M5.25 10.75A3.25 3.25 0 0 1 10.8 8.45" />
      <circle cx="10.8" cy="8.45" r="1.35" fill="var(--sol-500)" />
      {senal === false && (
        <WifiOff x={15.25} y={1.5} width={4} height={4} strokeWidth={3} color="var(--color-texto-suave)" aria-hidden="true" />
      )}
    </>
  )
}

// Escenas listas para EstadoVacio (manual §10.5: una situación, una escena).
export const CamelloPrimerUso = () => <Camello pose="pie" expresion="contento" />            // cliente sin pedidos
export const CamelloEsperando = () => <Camello pose="echado" expresion="buscando" />         // maestro sin pedidos · no encontrado · 404
export const CamelloError = () => <Camello pose="echado" expresion="preocupado" />           // la pantalla falló
export const CamelloSinSenal = () => <Camello pose="echado" expresion="preocupado" senal={false} />

/**
 * @param {'pie'|'echado'} pose
 * @param {'contento'|'buscando'|'preocupado'|'celebrando'} expresion
 * @param {boolean} [senal] false = dibuja el ícono de «sin señal» (solo en la pose echado)
 */
export function Camello({ pose = 'pie', expresion = 'contento', senal, className = 'ilustracion' }) {
  return (
    <svg className={className} viewBox="0 0 20 20" aria-hidden="true" focusable="false">
      {pose === 'echado' ? <Echado expresion={expresion} senal={senal} /> : <DePie expresion={expresion} />}
    </svg>
  )
}
