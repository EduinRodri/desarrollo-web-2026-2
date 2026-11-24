import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router'
import '@fontsource-variable/figtree/wght.css' // fuente autohospedada (OFL), con font-display: swap
import './estilos/tokens.css'
import './estilos/app.css'
import './estilos/marca.css'
import App from './App'
import { AuthProvider } from './context/AuthContext'
import { ToastProvider } from './context/ToastContext'

// Si se publica una versión nueva mientras alguien tiene la app abierta, los archivos de las pantallas
// cambian de nombre y la descarga falla. En ese caso se recarga una sola vez para traer la versión nueva.
window.addEventListener('vite:preloadError', (evento) => {
  const ultima = Number(sessionStorage.getItem('recarga-version') || 0)
  if (Date.now() - ultima > 10_000) {
    evento.preventDefault()
    sessionStorage.setItem('recarga-version', String(Date.now()))
    window.location.reload()
  }
})

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <App />
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)
