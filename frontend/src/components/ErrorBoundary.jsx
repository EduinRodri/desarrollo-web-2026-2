// Límite de errores: si una pantalla falla, se muestra un mensaje con salida en vez de una página en blanco.
// (React solo permite capturar errores de render con un componente de clase.)
import { Component } from 'react'
import { RotateCw } from 'lucide-react'
import { IlustracionPerdido } from './Ilustraciones'

export default class ErrorBoundary extends Component {
  state = { error: null }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error) {
    console.error('Error en la pantalla:', error)
  }

  render() {
    if (!this.state.error) return this.props.children
    return (
      <div className="vacio" role="alert">
        <IlustracionPerdido />
        <h2>Algo no cargó bien</h2>
        <p>Puede ser la conexión o que acabamos de publicar una versión nueva. Recarga para seguir.</p>
        <button className="boton" onClick={() => window.location.reload()}>
          <RotateCw aria-hidden="true" /> Recargar
        </button>
      </div>
    )
  }
}
