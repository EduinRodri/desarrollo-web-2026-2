// Hook propio: cada pantalla pone su nombre en la pestaña del navegador.
// Sin esto, todas las páginas se llamaban igual en el historial, en las pestañas y al compartir.
import { useEffect } from 'react'

export const TITULO_BASE = 'Camellapp · Oficios de confianza en Malambo y Barranquilla'

// useTitulo('Mis pedidos') → «Mis pedidos · Camellapp». Sin argumento → el título de la portada.
export function useTitulo(titulo) {
  useEffect(() => {
    document.title = titulo ? `${titulo} · Camellapp` : TITULO_BASE
  }, [titulo])
}
