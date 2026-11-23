// Mensaje de error o de éxito, visible y anunciado a lectores de pantalla.
export default function Aviso({ tipo = 'error', children }) {
  if (!children) return null
  return (
    <div className={`aviso aviso-${tipo}`} role={tipo === 'error' ? 'alert' : 'status'}>
      {children}
    </div>
  )
}
