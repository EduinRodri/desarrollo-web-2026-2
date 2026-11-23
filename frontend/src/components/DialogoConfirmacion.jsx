// Diálogo de confirmación con <dialog> nativo: el navegador bloquea el fondo, maneja Escape y el foco.
// NN/g: solo para acciones destructivas, y los botones dicen el RESULTADO, no «Sí / No».
import { useEffect, useRef } from 'react'
import { AlertTriangle } from 'lucide-react'

export default function DialogoConfirmacion({ abierto, titulo, mensaje, confirmar, mantener, onConfirmar, onCerrar }) {
  const ref = useRef(null)

  useEffect(() => {
    const d = ref.current
    if (abierto && !d.open) d.showModal()
    if (!abierto && d.open) d.close()
  }, [abierto])

  return (
    <dialog ref={ref} onClose={onCerrar} aria-labelledby="dialogo-titulo">
      <div className="dialogo-icono"><AlertTriangle aria-hidden="true" /></div>
      <h2 id="dialogo-titulo">{titulo}</h2>
      <p>{mensaje}</p>
      <div className="dialogo-acciones">
        <button type="button" className="boton boton-secundario" onClick={onCerrar} autoFocus>{mantener}</button>
        <button type="button" className="boton boton-peligro" onClick={onConfirmar}>{confirmar}</button>
      </div>
    </dialog>
  )
}
