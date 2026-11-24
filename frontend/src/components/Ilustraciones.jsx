// Ilustraciones propias para los estados vacíos (SVG, sin licencias de terceros).
// Usan los tokens de color, así que cambian solas en modo oscuro.
import { useId } from 'react'
import { PaintRoller, Wrench, Zap } from 'lucide-react'
const base = { fill: 'var(--color-accion-suave)' }
const linea = { fill: 'none', stroke: 'var(--color-accion)', strokeWidth: 4, strokeLinecap: 'round', strokeLinejoin: 'round' }

export function IlustracionBusqueda() {
  return (
    <svg className="ilustracion" viewBox="0 0 200 150" aria-hidden="true">
      <ellipse cx="100" cy="134" rx="78" ry="10" fill="var(--color-borde)" />
      <path {...base} d="M30 40h110a10 10 0 0 1 10 10v66a10 10 0 0 1-10 10H30a10 10 0 0 1-10-10V50a10 10 0 0 1 10-10Z" />
      <path stroke="var(--color-borde-fuerte)" strokeWidth="3" strokeDasharray="6 7" fill="none" d="M34 108c22-20 36 6 56-14s34 0 46-18" />
      <path fill="var(--color-accion)" d="M58 52c-8 0-14 6-14 13 0 10 14 18 14 18s14-8 14-18c0-7-6-13-14-13Z" />
      <circle cx="58" cy="65" r="5" fill="var(--color-superficie)" />
      <circle cx="132" cy="70" r="30" fill="var(--color-superficie)" />
      <circle {...linea} cx="132" cy="70" r="30" />
      <path {...linea} strokeWidth="8" d="m154 92 22 22" />
      <path {...linea} d="M122 66c2-6 8-8 12-6" />
      <circle cx="176" cy="30" r="6" fill="var(--sol-500)" />
    </svg>
  )
}

export function IlustracionPedidos() {
  return (
    <svg className="ilustracion" viewBox="0 0 200 150" aria-hidden="true">
      <ellipse cx="100" cy="136" rx="70" ry="9" fill="var(--color-borde)" />
      <rect {...base} x="56" y="18" width="88" height="112" rx="12" />
      <rect x="80" y="10" width="40" height="18" rx="6" fill="var(--color-accion)" />
      <rect x="72" y="46" width="56" height="8" rx="4" fill="var(--color-borde-fuerte)" />
      <rect x="72" y="66" width="40" height="8" rx="4" fill="var(--color-borde-fuerte)" />
      <rect x="72" y="86" width="48" height="8" rx="4" fill="var(--color-borde-fuerte)" />
      <circle cx="140" cy="104" r="22" fill="var(--color-accion)" />
      <path fill="none" stroke="var(--color-superficie)" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" d="m130 104 7 7 13-14" />
      <circle cx="42" cy="40" r="5" fill="var(--sol-500)" />
    </svg>
  )
}

// Portada (héroe) — «Tu barrio, a un camello de distancia».
// Se construye con los activos de la marca, no con clipart:
//  · El PIN del isotipo es la ventana al barrio (está cerca).
//  · Adentro, una fachada costeña de Malambo: casa baja con pretil, arcos de terraza, mecedoras y palma.
//  · La «C» del logo se vuelve una ruta punteada que pasa por tres oficios y TERMINA EN EL PUNTO SOL,
//    igual que la C del isotipo: tu barrio → el maestro → el camello bien hecho.
// Colores: terracota, terracota suave y sol + superficie como espacio negativo. Un solo punto sol.
// Íconos: Lucide (el manual lo exige). Va en línea: sin descargas (CSP) y no compite por el LCP.
const PIN = 'M32 3C17.6 3 6 14.3 6 28.4 6 46.2 32 61 32 61s26-14.8 26-32.6C58 14.3 46.4 3 32 3Z'

function Mecedora(props) {
  // Mecedora costeña de perfil: balancín curvo, patas, asiento y espaldar inclinado.
  return (
    <path {...props} fill="none" stroke="var(--color-accion)" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"
      d="M2 36q16 8 32 0M10 38l3-18h17l-2 18M13 20 8 1h7l3 19" />
  )
}

function Oficio({ x, y, Icono, tam = 60 }) {
  const m = tam / 2, i = tam / 4
  return (
    <g>
      <rect x={x - m} y={y - m} width={tam} height={tam} rx={tam * 0.3} fill="var(--color-superficie)"
        stroke="var(--color-accion)" strokeWidth="3" />
      <Icono x={x - i} y={y - i} width={m} height={m} color="var(--color-accion)" strokeWidth={2.25} aria-hidden="true" />
    </g>
  )
}

export function IlustracionHeroe({ className }) {
  // useId: la ilustración puede aparecer dos veces en la página (héroe y «Así de fácil»),
  // y cada recorte necesita un id único o el segundo usaría el del primero.
  const recorte = useId()
  return (
    <svg viewBox="0 0 460 420" className={className} aria-hidden="true" focusable="false">
      <defs>
        <clipPath id={recorte}><path d={PIN} transform="translate(93 56) scale(4.6)" /></clipPath>
      </defs>

      {/* La C del logo como ruta: abre a la derecha y cierra arriba en el punto sol */}
      <path d="M374 344A190 190 0 1 1 374 76" fill="none" stroke="var(--color-accion)" strokeWidth="4"
        strokeLinecap="round" strokeDasharray="0.1 13" />

      {/* Ventana al barrio con forma de pin */}
      <g clipPath={`url(#${recorte})`}>
        <rect x="80" y="50" width="300" height="300" fill="var(--color-accion-suave)" />
        {/* Palma */}
        {/* Árbol de patio (mango o almendro): la sombra de la terraza en Malambo. No es palma: Malambo no tiene playa */}
        <path d="M166 256v-70M166 214l-14-14M166 204l12-12" fill="none" stroke="var(--color-accion)" strokeWidth="7" strokeLinecap="round" />
        <path d="M128 170c-10-26 10-48 30-46 6-20 36-22 44 0 18 2 26 22 16 38-4 16-22 22-38 16-14 10-40 8-52-8Z" fill="var(--color-accion)" />
        {/* Fachada costeña: pretil, muro y tres arcos (terraza, puerta, terraza) */}
        <rect x="184" y="166" width="150" height="90" fill="var(--color-superficie)" stroke="var(--color-accion)" strokeWidth="4" />
        <rect x="176" y="150" width="166" height="20" rx="6" fill="var(--color-accion)" />
        <path d="M194 256v-44a16 16 0 0 1 32 0v44ZM292 256v-44a16 16 0 0 1 32 0v44Z" fill="var(--color-accion-suave)" />
        <path d="M243 256v-44a16 16 0 0 1 32 0v44Z" fill="var(--color-accion)" />
        <Mecedora transform="translate(196 222) scale(.82)" />
        <Mecedora transform="translate(322 222) scale(-.82 .82)" />
        {/* Calle del barrio */}
        <rect x="80" y="256" width="300" height="100" fill="var(--color-accion)" />
        <path d="M150 292h24M196 292h24M242 292h24M288 292h24" stroke="var(--color-superficie)" strokeWidth="5" strokeLinecap="round" />
      </g>
      <path d={PIN} transform="translate(93 56) scale(4.6)" fill="none" stroke="var(--color-accion)" strokeWidth={4 / 4.6} />

      {/* Tres oficios sobre la ruta */}
      <Oficio x={84} y={101} Icono={Wrench} />
      <Oficio x={66} y={300} Icono={Zap} />
      <Oficio x={374} y={344} Icono={PaintRoller} />

      {/* Punto sol: donde termina la C (uno por composición) */}
      <circle cx="374" cy="76" r="17" fill="var(--sol-500)" />
    </svg>
  )
}

export function IlustracionPerdido() {
  return (
    <svg className="ilustracion" viewBox="0 0 200 150" aria-hidden="true">
      <ellipse cx="100" cy="134" rx="74" ry="10" fill="var(--color-borde)" />
      <path stroke="var(--color-borde-fuerte)" strokeWidth="3" strokeDasharray="6 7" fill="none" d="M24 120c30-30 50 10 80-20s50-10 72-40" />
      <path fill="var(--color-accion)" d="M100 22c-17 0-30 13-30 29 0 22 30 40 30 40s30-18 30-40c0-16-13-29-30-29Z" />
      <text x="100" y="62" textAnchor="middle" fontSize="30" fontWeight="700" fill="var(--color-superficie)" fontFamily="var(--fuente)">?</text>
      <circle cx="160" cy="34" r="6" fill="var(--sol-500)" />
    </svg>
  )
}
