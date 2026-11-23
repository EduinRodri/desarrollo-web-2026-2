import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router'
import { mensajeDeError } from '../api'
import { useAuth } from '../context/AuthContext'
import Aviso from '../components/Aviso'

export default function Ingresar() {
  const { ingresar } = useAuth()
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
      await ingresar(form.correo, form.contrasena)
      // Vuelve a donde la persona quería ir antes de que le pidieran iniciar sesión.
      navegar(ubicacion.state?.desde ?? '/', { replace: true })
    } catch (err) {
      setError(mensajeDeError(err))
    } finally {
      setEnviando(false)
    }
  }

  return (
    <form className="tarjeta formulario" onSubmit={enviar}>
      <h1>Ingresar</h1>
      {ubicacion.state?.registrado && <Aviso tipo="exito">Cuenta creada. Ahora ingresa con tu correo.</Aviso>}
      <label>Correo<input name="correo" type="email" required autoComplete="email" value={form.correo} onChange={cambiar} /></label>
      <label>Contraseña<input name="contrasena" type="password" required autoComplete="current-password" value={form.contrasena} onChange={cambiar} /></label>
      <Aviso>{error}</Aviso>
      <button className="boton" disabled={enviando}>{enviando ? 'Ingresando…' : 'Ingresar'}</button>
      <p className="tenue">¿No tienes cuenta? <Link to="/registro">Créala aquí</Link></p>
    </form>
  )
}
