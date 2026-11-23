// Muestra estrellas (solo lectura) o permite elegirlas (si recibe onChange).
export default function Estrellas({ valor = 0, onChange }) {
  return (
    <span className="estrellas" aria-label={`${valor} de 5 estrellas`}>
      {[1, 2, 3, 4, 5].map((n) =>
        onChange ? (
          <button
            key={n}
            type="button"
            className={n <= valor ? 'llena' : ''}
            aria-label={`${n} estrellas`}
            onClick={() => onChange(n)}
          >
            ★
          </button>
        ) : (
          <span key={n} className={n <= Math.round(valor) ? 'llena' : ''}>★</span>
        ),
      )}
    </span>
  )
}

export function Nivel({ reputacion }) {
  if (!reputacion) return null
  const clase = { Recomendado: 'nivel-oro', 'Nivel 1': 'nivel-plata' }[reputacion.nivel] ?? 'nivel-nuevo'
  return (
    <span className={`insignia ${clase}`}>
      {reputacion.nivel === 'Recomendado' ? '🏅 ' : ''}
      {reputacion.nivel}
    </span>
  )
}
