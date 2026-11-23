// Registro (RF1) con la autorización de datos que exige la Ley 1581 de 2012.
import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import api, { mensajeDeError } from '../api'
import Aviso from '../components/Aviso'

const vacio = { nombre: '', correo: '', telefono: '', contrasena: '', acepta_tratamiento_datos: false }

export default function Registro() {
  const navegar = useNavigate()
  const [form, setForm] = useState(vacio)
  const [error, setError] = useState('')
  const [enviando, setEnviando] = useState(false)

  const cambiar = (e) => {
    const { name, value, type, checked } = e.target
    setForm({ ...form, [name]: type === 'checkbox' ? checked : value })
  }

  const enviar = async (e) => {
    e.preventDefault()
    // Validación rápida en el navegador (la API vuelve a validar todo).
    if (!/^3\d{9}$/.test(form.telefono)) return setError('El celular debe tener 10 dígitos y empezar por 3.')
    setEnviando(true)
    setError('')
    try {
      await api.post('/usuarios', form)
      navegar('/ingresar', { state: { registrado: true } })
    } catch (err) {
      setError(mensajeDeError(err))
    } finally {
      setEnviando(false)
    }
  }

  return (
    <form className="tarjeta formulario" onSubmit={enviar}>
      <h1>Crear cuenta</h1>
      <p className="tenue">Con una sola cuenta pides servicios y, si quieres, ofreces los tuyos.</p>
      <label>Nombre completo<input name="nombre" required minLength={3} value={form.nombre} onChange={cambiar} autoComplete="name" /></label>
      <label>Correo<input name="correo" type="email" required value={form.correo} onChange={cambiar} autoComplete="email" /></label>
      <label>Celular<input name="telefono" inputMode="numeric" required placeholder="3001234567" value={form.telefono} onChange={cambiar} autoComplete="tel" /></label>
      <label>Contraseña (mínimo 8 caracteres)<input name="contrasena" type="password" required minLength={8} value={form.contrasena} onChange={cambiar} autoComplete="new-password" /></label>
      <label className="casilla">
        <input name="acepta_tratamiento_datos" type="checkbox" checked={form.acepta_tratamiento_datos} onChange={cambiar} required />
        Autorizo el tratamiento de mis datos personales para usar Camellapp (Ley 1581 de 2012).
      </label>
      <Aviso>{error}</Aviso>
      <button className="boton" disabled={enviando}>{enviando ? 'Creando…' : 'Crear cuenta'}</button>
      <p className="tenue">¿Ya tienes cuenta? <Link to="/ingresar">Ingresa</Link></p>
    </form>
  )
}
