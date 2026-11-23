// Ilustraciones propias para los estados vacíos (SVG, sin licencias de terceros).
// Usan los tokens de color, así que cambian solas en modo oscuro.
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
