// Ingreso. Formularios según web.dev y GOV.UK: etiqueta arriba, autocomplete correcto,
// mostrar contraseña y un solo mensaje de error que no revela si el correo existe.
import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router'
import { LogIn } from 'lucide-react'
import { mensajeDeError } from '../api'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { Aviso, Campo, CampoContrasena } from '../components/Ui'
import { Isotipo } from '../components/Marca'
import { useTitulo } from '../hooks/useTitulo'

export default function Ingresar() {
  useTitulo('Ingresar')
  const { ingresar } = useAuth()
  const { avisar } = useToast()
  const navegar = useNavigate()
  const ubicacion = useLocation()
  const [form, setForm] = useState({ correo: '', contrasena: '' })
  const [error, setError] = useState('')
  const [enviando, setEnviando] = useState(false)

  const cambiar = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const enviar = async (e) => {
    e.preventDefault()
    setEnviando(true)
    setError('')
    try {
      const usuario = await ingresar(form.correo, form.contrasena)
      avisar(`Hola, ${usuario.nombre.split(' ')[0]}`)
      navegar(ubicacion.state?.desde ?? '/', { replace: true }) // vuelve a donde iba
    } catch (err) {
      setError(mensajeDeError(err))
    } finally {
      setEnviando(false)
    }
  }

  return (
    <form className="tarjeta formulario pila" onSubmit={enviar} noValidate={false}>
      <div className="formulario-cabeza">
        <Isotipo />
        <h1>Qué bueno verte</h1>
        <p>{ubicacion.state?.desde ? 'Ingresa para seguir donde ibas.' : 'Ingresa para pedir servicios y ver tus pedidos.'}</p>
      </div>
      {ubicacion.state?.registrado && <Aviso tipo="exito">Tu cuenta está lista. Ingresa con tu correo y contraseña.</Aviso>}
      <Campo etiqueta="Correo">
        {(a11y) => <input {...a11y} name="correo" type="email" inputMode="email" autoComplete="username" required
          value={form.correo} onChange={cambiar} />}
      </Campo>
      <CampoContrasena name="contrasena" autoComplete="current-password" required value={form.contrasena} onChange={cambiar} />
      <Aviso>{error}</Aviso>
      <button className="boton boton-bloque" disabled={enviando}>
        <LogIn aria-hidden="true" /> {enviando ? 'Ingresando…' : 'Ingresar'}
      </button>
      <p className="texto-sm suave" style={{ textAlign: 'center' }}>¿Primera vez en Camellapp? <Link to="/registro">Crea tu cuenta gratis</Link></p>
    </form>
  )
}
