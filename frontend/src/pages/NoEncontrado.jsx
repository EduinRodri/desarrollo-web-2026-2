import { Link } from 'react-router'

export default function NoEncontrado() {
  return (
    <div className="vacio">
      <h1>404</h1>
      <p>Esta página no existe.</p>
      <Link to="/" className="boton">Ir a buscar servicios</Link>
    </div>
  )
}
