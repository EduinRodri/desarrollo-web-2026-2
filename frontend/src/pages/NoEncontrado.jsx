import { Link } from 'react-router'
import { EstadoVacio } from '../components/Ui'
import { IlustracionPerdido } from '../components/Ilustraciones'

export default function NoEncontrado() {
  return (
    <EstadoVacio ilustracion={IlustracionPerdido} titulo="Esta página no existe"
      accion={<Link to="/" className="boton">Ir a buscar servicios</Link>}>
      Puede que el enlace esté mal escrito o que el servicio ya no esté publicado.
    </EstadoVacio>
  )
}
