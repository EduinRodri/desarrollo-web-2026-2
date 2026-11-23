// Reporte para el equipo del emprendimiento (RF9).
import { useEffect, useState } from 'react'
import api, { mensajeDeError } from '../api'
import Cargando from '../components/Cargando'
import Aviso from '../components/Aviso'

function Barras({ titulo, filas, clave }) {
  const max = Math.max(1, ...filas.map((f) => f.pedidos))
  return (
    <section className="tarjeta">
      <h2>{titulo}</h2>
      {filas.length === 0 && <p className="tenue">Sin datos todavía.</p>}
      {filas.map((f) => (
        <div key={f[clave]} className="barra-fila">
          <span>{f[clave]}</span>
          <div className="barra-fondo"><div className="barra-valor" style={{ width: `${(f.pedidos / max) * 100}%` }} /></div>
          <strong>{f.pedidos}</strong>
        </div>
      ))}
    </section>
  )
}

export default function Reportes() {
  const [datos, setDatos] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    api.get('/reportes').then(({ data }) => setDatos(data)).catch((e) => setError(mensajeDeError(e)))
  }, [])

  if (error) return <Aviso>{error}</Aviso>
  if (!datos) return <Cargando />

  return (
    <>
      <h1>Reportes</h1>
      <div className="columnas">
        <Barras titulo="Pedidos por oficio" filas={datos.pedidos_por_oficio} clave="oficio" />
        <Barras titulo="Pedidos por zona" filas={datos.pedidos_por_zona} clave="zona" />
      </div>
      <section className="tarjeta">
        <h2>Trabajadores con promedio menor que 3</h2>
        {datos.trabajadores_promedio_bajo.length === 0 ? <p className="tenue">Ninguno. 👍</p> : (
          <ul>{datos.trabajadores_promedio_bajo.map((t) => <li key={t.id}>{t.nombre}: {t.promedio} ({t.resenas} reseñas)</li>)}</ul>
        )}
      </section>
    </>
  )
}
