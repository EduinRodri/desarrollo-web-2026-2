// Hook propio: trae los oficios y las zonas UNA sola vez y los guarda en memoria.
// Si tres pantallas lo usan, la API se consulta una vez, no tres (rendimiento).
import { useEffect, useState } from 'react'
import api from '../api'

let cache = null

export function useCatalogo() {
  const [catalogo, setCatalogo] = useState(cache ?? { categorias: [], zonas: [] })

  useEffect(() => {
    if (cache) return
    let vigente = true
    Promise.all([api.get('/categorias'), api.get('/zonas')]).then(([c, z]) => {
      cache = { categorias: c.data, zonas: z.data }
      if (vigente) setCatalogo(cache)
    }).catch(() => {})
    return () => { vigente = false }
  }, [])

  // Agrupa los 43 oficios por grupo para el <select>.
  const porGrupo = catalogo.categorias.reduce((acc, c) => {
    (acc[c.grupo] ??= []).push(c)
    return acc
  }, {})

  return { ...catalogo, porGrupo }
}
