import { memo } from 'react'
import { Link } from 'react-router'
import { MapPin } from 'lucide-react'
import { pesos } from '../api'
import { Avatar, Calificacion, Nivel } from './Ui'

// Orden de lectura pensado para decidir rápido (Thumbtack / Baymard):
// quién es → qué hace → qué tan confiable es → cuánto cuesta.
// memo: si los datos no cambian, la tarjeta no se vuelve a dibujar.
function TarjetaServicio({ servicio, mostrarPersona = true }) {
  const { reputacion: rep, trabajador } = servicio
  return (
    <Link to={`/servicios/${servicio.id}`} className="tarjeta servicio-tarjeta">
      {mostrarPersona && (
        <div className="persona">
          <Avatar nombre={trabajador.nombre} />
          <div className="persona-datos">
            <div className="persona-nombre">{trabajador.nombre}</div>
            <span className="meta"><MapPin aria-hidden="true" /> {trabajador.zona}</span>
          </div>
        </div>
      )}
      <div className="pila-sm">
        <span className="texto-xs suave">{servicio.categoria.nombre}</span>
        <h3>{servicio.titulo}</h3>
      </div>
      <div className="fila-flex">
        <Nivel reputacion={rep} />
        <Calificacion reputacion={rep} />
      </div>
      <div className="servicio-pie">
        <span><span className="precio-etiqueta">Desde</span><span className="precio">{pesos.format(servicio.precio_desde)}</span></span>
        <span className="texto-sm suave">{servicio.tiempo_estimado}</span>
      </div>
    </Link>
  )
}

export default memo(TarjetaServicio)
