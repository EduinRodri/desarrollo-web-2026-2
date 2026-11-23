// Context API + useReducer: la sesión del usuario disponible en TODA la app
// sin pasarla de componente en componente (sin "prop drilling").
import { createContext, useCallback, useContext, useEffect, useMemo, useReducer } from 'react'
import api, { CLAVE_TOKEN } from '../api'

const AuthContext = createContext(null)

const estadoInicial = {
  usuario: null,
  token: localStorage.getItem(CLAVE_TOKEN),
  cargando: Boolean(localStorage.getItem(CLAVE_TOKEN)), // si hay token, hay que validarlo
}

// El reducer decide cómo cambia la sesión según la acción. Toda la lógica está en un solo lugar.
function sesionReducer(estado, accion) {
  switch (accion.type) {
    case 'INICIAR':
      return { usuario: accion.usuario, token: accion.token, cargando: false }
    case 'ACTUALIZAR_USUARIO':
      return { ...estado, usuario: accion.usuario }
    case 'SALIR':
      return { usuario: null, token: null, cargando: false }
    default:
      throw new Error(`Acción desconocida: ${accion.type}`)
  }
}

export function AuthProvider({ children }) {
  const [estado, dispatch] = useReducer(sesionReducer, estadoInicial)

  const salir = useCallback(() => {
    localStorage.removeItem(CLAVE_TOKEN)
    dispatch({ type: 'SALIR' })
  }, [])

  // Al abrir la app: si quedó un token guardado, se pregunta a la API quién es el usuario.
  useEffect(() => {
    if (!estado.token || estado.usuario) return
    api
      .get('/usuarios/me')
      .then(({ data }) => dispatch({ type: 'INICIAR', usuario: data, token: estado.token }))
      .catch(salir)
  }, [estado.token, estado.usuario, salir])

  // Si Axios detecta un 401, se cierra la sesión.
  useEffect(() => {
    window.addEventListener('sesion-vencida', salir)
    return () => window.removeEventListener('sesion-vencida', salir)
  }, [salir])

  const ingresar = useCallback(async (correo, contrasena) => {
    // El estándar OAuth2 de FastAPI recibe el correo en el campo "username", como formulario.
    const datos = new URLSearchParams({ username: correo, password: contrasena })
    const { data } = await api.post('/sesion', datos)
    localStorage.setItem(CLAVE_TOKEN, data.access_token)
    dispatch({ type: 'INICIAR', usuario: data.usuario, token: data.access_token })
    return data.usuario
  }, [])

  const actualizarUsuario = useCallback((usuario) => dispatch({ type: 'ACTUALIZAR_USUARIO', usuario }), [])

  // useMemo: el valor del contexto solo cambia cuando cambia la sesión (evita renders de más).
  const valor = useMemo(
    () => ({ ...estado, ingresar, salir, actualizarUsuario }),
    [estado, ingresar, salir, actualizarUsuario],
  )

  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>
}

// Hook propio: cualquier componente hace `const { usuario } = useAuth()`.
export function useAuth() {
  const contexto = useContext(AuthContext)
  if (!contexto) throw new Error('useAuth debe usarse dentro de <AuthProvider>')
  return contexto
}
