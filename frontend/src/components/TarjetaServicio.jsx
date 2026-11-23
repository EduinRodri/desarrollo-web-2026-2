import { memo } from 'react'
import { Link } from 'react-router'
import { pesos } from '../api'
import Estrellas, { Nivel } from './Estrellas'

// memo: si los datos del servicio no cambian, la tarjeta no se vuelve a dibujar.
function TarjetaServicio({ servicio }) {
  const { reputacion: rep, trabajador } = servicio
  return (
    <Link to={`/servicios/${servicio.id}`} className="tarjeta tarjeta-servicio">
      <div className="tarjeta-cabeza">
        <span className="etiqueta">{servicio.categoria.nombre}</span>
        <Nivel reputacion={rep} />
      </div>
      <h3>{servicio.titulo}</h3>
      <p className="tenue recorte">{servicio.descripcion}</p>
      <div className="tarjeta-pie">
        <div>
          <strong>{trabajador.nombre}</strong>
          <div className="tenue">📍 {trabajador.zona}</div>
        </div>
        <div className="derecha">
          <div className="precio">Desde {pesos.format(servicio.precio_desde)}</div>
          {rep?.resenas ? (
            <small><Estrellas valor={rep.promedio} /> ({rep.resenas})</small>
          ) : (
            <small className="tenue">Sin reseñas aún</small>
          )}
        </div>
      </div>
    </Link>
  )
}

export default memo(TarjetaServicio)
