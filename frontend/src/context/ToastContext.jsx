// Notificaciones breves (toasts) para toda la app, con Context API.
// Carbon: máximo dos líneas y se cierran solas a los 5 s.
import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import { AlertCircle, CheckCircle2 } from 'lucide-react'

const ToastContext = createContext(null)
const DURACION = 5000

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const avisar = useCallback((texto, tipo = 'exito') => {
    const id = crypto.randomUUID()
    setToasts((lista) => [...lista.slice(-2), { id, texto, tipo }])
    setTimeout(() => setToasts((lista) => lista.filter((t) => t.id !== id)), DURACION)
  }, [])

  const valor = useMemo(() => ({ avisar }), [avisar])

  return (
    <ToastContext.Provider value={valor}>
      {children}
      <div className="toasts" role="status" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className={`toast toast-${t.tipo}`}>
            {t.tipo === 'error' ? <AlertCircle aria-hidden="true" /> : <CheckCircle2 aria-hidden="true" />}
            {t.texto}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const contexto = useContext(ToastContext)
  if (!contexto) throw new Error('useToast debe usarse dentro de <ToastProvider>')
  return contexto
}
