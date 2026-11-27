// Reporte para el equipo del emprendimiento (RF9).
import { useEffect, useState } from 'react'
import { AlertTriangle } from 'lucide-react'
import api, { mensajeDeError } from '../api'
import { Aviso } from '../components/Ui'
import { useTitulo } from '../hooks/useTitulo'

const numero = new Intl.NumberFormat('es-CO', { minimumFractionDigits: 1, maximumFractionDigits: 1 })

function Barras({ titulo, filas, clave }) {
  const max = Math.max(1, ...filas.map((f) => f.pedidos))
  return (
    <section className="tarjeta">
      <h2>{titulo}</h2>
      {filas.length === 0 ? <p className="suave">Sin pedidos todavía.</p> : (
        <div style={{ marginTop: 'var(--esp-3)' }}>
          {filas.map((f) => (
            <div key={f[clave]} className="barra-fila">
              <span title={f[clave]}>{f[clave]}</span>
              <div className="barra-fondo" aria-hidden="true"><div className="barra-valor" style={{ width: `${(f.pedidos / max) * 100}%` }} /></div>
              <strong>{f.pedidos}</strong>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}

export default function Reportes() {
  useTitulo('Reportes')
  const [datos, setDatos] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    api.get('/reportes').then(({ data }) => setDatos(data)).catch((e) => setError(mensajeDeError(e)))
  }, [])

  if (error) return <Aviso>{error}</Aviso>
  if (!datos) return <div className="tarjeta" aria-busy="true"><div className="esqueleto" style={{ height: 200 }} /></div>

  const bajos = datos.trabajadores_promedio_bajo
  return (
    <div className="pila">
      <div><h1>Reportes</h1><p className="suave">Para decidir dónde crecer y a quién acompañar.</p></div>
      <div className="columnas">
        <Barras titulo="Pedidos por oficio" filas={datos.pedidos_por_oficio} clave="oficio" />
        <Barras titulo="Pedidos por zona" filas={datos.pedidos_por_zona} clave="zona" />
      </div>
      <section className="tarjeta">
        <h2>Trabajadores con promedio menor que 3</h2>
        {bajos.length === 0 ? <p className="suave">Ninguno por ahora.</p> : (
          <ul className="lista-limpia">
            {bajos.map((t) => (
              <li key={t.id} className="fila-servicio">
                <span className="fila-flex"><AlertTriangle aria-hidden="true" size={18} color="var(--color-error)" /> {t.nombre}</span>
                <span className="texto-sm suave">{numero.format(t.promedio)} · {t.resenas} reseñas</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
