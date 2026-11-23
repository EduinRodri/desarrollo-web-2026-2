// Cliente HTTP de Camellapp con Axios.
// Una sola instancia para toda la app: la dirección de la API y el token se ponen aquí,
// no en cada pantalla.
import axios from 'axios'

export const CLAVE_TOKEN = 'camellapp_token'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
  timeout: 15000,
})

// Interceptor de petición: si hay sesión, agrega "Authorization: Bearer <token>".
api.interceptors.request.use((config) => {
  const token = localStorage.getItem(CLAVE_TOKEN)
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Interceptor de respuesta: si la API dice 401 (sesión vencida), avisa a la app para cerrar sesión.
api.interceptors.response.use(
  (respuesta) => respuesta,
  (error) => {
    if (error.response?.status === 401 && localStorage.getItem(CLAVE_TOKEN)) {
      window.dispatchEvent(new Event('sesion-vencida'))
    }
    return Promise.reject(error)
  },
)

// Convierte cualquier error de Axios en un mensaje para mostrarle a la persona.
export function mensajeDeError(error) {
  if (!error.response) {
    return error.code === 'ECONNABORTED'
      ? 'El servidor tardó demasiado. Intenta de nuevo.'
      : 'No hay conexión con el servidor. Revisa tu internet.'
  }
  const detalle = error.response.data?.detail
  if (typeof detalle === 'string') return detalle
  // 422: FastAPI manda una lista con cada campo que falló.
  if (Array.isArray(detalle)) {
    return detalle.map((d) => `${d.loc?.at(-1) ?? 'dato'}: ${traducir(d.msg)}`).join(' · ')
  }
  return 'Ocurrió un error inesperado.'
}

function traducir(msg = '') {
  if (msg.includes('valid email')) return 'correo no válido'
  if (msg.includes('at least')) return 'muy corto'
  if (msg.includes('at most')) return 'muy largo'
  if (msg.includes('pattern')) return 'formato no válido'
  if (msg.includes('greater than') || msg.includes('less than')) return 'valor fuera de rango'
  return msg
}

export const pesos = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
})

export default api
