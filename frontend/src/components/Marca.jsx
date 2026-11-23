// Isotipo de Camellapp: un pin de ubicación (el servicio está cerca) con una «C»
// que cierra en un punto amarillo (el trabajo terminado). Dibujado a mano en SVG.
export function Isotipo({ className, titulo }) {
  return (
    <svg viewBox="0 0 64 64" className={className} role={titulo ? 'img' : undefined}
      aria-hidden={titulo ? undefined : true} aria-label={titulo}>
      <path fill="var(--color-accion)" d="M32 3C17.6 3 6 14.3 6 28.4 6 46.2 32 61 32 61s26-14.8 26-32.6C58 14.3 46.4 3 32 3Z" />
      <path fill="none" stroke="var(--color-superficie)" strokeLinecap="round" strokeWidth="6.5" d="M40.6 20.2a11.6 11.6 0 1 0 0 16.3" />
      <circle cx="42.3" cy="18.4" r="4.6" fill="var(--sol-500)" />
    </svg>
  )
}

export function Logo() {
  return (
    <>
      <Isotipo />
      <span>Camell<b>app</b></span>
    </>
  )
}

// El punto sol: activo distintivo de la marca. Significa «listo, bien hecho».
// Regla del manual: uno por composición; cierra los titulares de marca.
export function PuntoSol() {
  return <span className="punto-sol" aria-hidden="true" />
}
