// En una SPA el navegador no recarga la página al navegar: si estabas abajo (por ejemplo, en el pie,
// tocando «Tus datos»), la página nueva aparecía al final. Esto la sube al inicio en cada cambio de ruta.
// - Solo cuando cambia la RUTA (pathname): cambiar un filtro de /buscar (?grupo=…) no debe mover la vista.
// - Con «atrás/adelante» (POP) no se toca: el navegador devuelve a la persona a donde iba.
import { useLayoutEffect } from 'react'
import { useLocation, useNavigationType } from 'react-router'

export default function SubirAlCambiarDePagina() {
  const { pathname } = useLocation()
  const tipo = useNavigationType()

  // useLayoutEffect: sube ANTES de pintar, así no se ve un salto
  useLayoutEffect(() => {
    if (tipo !== 'POP') window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
  }, [pathname, tipo])

  return null
}
