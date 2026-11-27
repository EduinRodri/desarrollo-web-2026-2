// Registro (RF1) con la autorización de la Ley 1581 de 2012.
// Psicología y usabilidad aplicadas:
// - Se explica POR QUÉ se pide cada dato (el celular): baja la desconfianza a dar datos personales.
// - Las reglas de la contraseña se ven ANTES de escribir (Baymard), no después del error.
// - Los errores aparecen al salir del campo, no mientras la persona escribe (validación no prematura),
//   y desaparecen apenas se corrigen.
import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { UserPlus } from 'lucide-react'
import api, { mensajeDeError } from '../api'
import { Aviso, Campo, CampoContrasena } from '../components/Ui'
import { Isotipo } from '../components/Marca'
import { useTitulo } from '../hooks/useTitulo'

const vacio = { nombre: '', correo: '', telefono: '', contrasena: '', acepta_tratamiento_datos: false }

function validar(f) {
  const e = {}
  if (f.nombre.trim().split(/\s+/).length < 2) e.nombre = 'Escribe tu nombre y tu apellido.'
  if (!/^\S+@\S+\.\S+$/.test(f.correo)) e.correo = 'Revisa el correo; debe ser como nombre@gmail.com.'
  if (!/^3\d{9}$/.test(f.telefono)) e.telefono = 'Debe tener 10 dígitos y empezar por 3.'
  if (f.contrasena.length < 8) e.contrasena = 'Usa al menos 8 caracteres.'
  if (!f.acepta_tratamiento_datos) e.acepta = 'Necesitamos tu autorización para crear la cuenta.'
  return e
}

export default function Registro() {
  useTitulo('Crea tu cuenta')
  const navegar = useNavigate()
  const [form, setForm] = useState(vacio)
  const [tocados, setTocados] = useState({})
  const [error, setError] = useState('')
  const [enviando, setEnviando] = useState(false)
  const errores = validar(form)
  const ver = (campo) => (tocados[campo] ? errores[campo] : undefined)

  const cambiar = (e) => {
    const { name, value, type, checked } = e.target
    setForm({ ...form, [name]: type === 'checkbox' ? checked : name === 'telefono' ? value.replace(/\D/g, '') : value })
  }
  const salir = (e) => setTocados({ ...tocados, [e.target.name]: true })

  const enviar = async (e) => {
    e.preventDefault()
    if (Object.keys(errores).length) {
      setTocados({ nombre: true, correo: true, telefono: true, contrasena: true, acepta: true })
      // GOV.UK: llevar el foco al primer campo con error (en el celular no hay que buscarlo)
      setTimeout(() => document.querySelector('[aria-invalid="true"]')?.focus(), 0)
      return
    }
    setEnviando(true)
    setError('')
    try {
      await api.post('/usuarios', { ...form, nombre: form.nombre.trim() })
      navegar('/ingresar', { state: { registrado: true } })
    } catch (err) {
      setError(mensajeDeError(err))
    } finally {
      setEnviando(false)
    }
  }

  return (
    <form className="tarjeta formulario pila" onSubmit={enviar} noValidate>
      <div className="formulario-cabeza">
        <Isotipo />
        <h1>Crea tu cuenta</h1>
        <p>Es gratis. Con la misma cuenta pides servicios y, si quieres, ofreces los tuyos.</p>
      </div>
      <Campo etiqueta="Nombre y apellido" error={ver('nombre')}>
        {(a11y) => <input {...a11y} name="nombre" autoComplete="name" autoCapitalize="words" value={form.nombre} onChange={cambiar} onBlur={salir} />}
      </Campo>
      <Campo etiqueta="Correo" error={ver('correo')}>
        {(a11y) => <input {...a11y} name="correo" type="email" inputMode="email" autoComplete="email" value={form.correo} onChange={cambiar} onBlur={salir} />}
      </Campo>
      <Campo etiqueta="Celular" ayuda="No aparece en tu perfil público." error={ver('telefono')}>
        {(a11y) => <input {...a11y} name="telefono" type="tel" inputMode="numeric" autoComplete="tel-national" maxLength={10} value={form.telefono} onChange={cambiar} onBlur={salir} />}
      </Campo>
      <CampoContrasena name="contrasena" autoComplete="new-password" ayuda="Mínimo 8 caracteres." error={ver('contrasena')}
        value={form.contrasena} onChange={cambiar} onBlur={salir} />
      <div className="pila-sm">
        <label className="casilla">
          <input name="acepta_tratamiento_datos" type="checkbox" checked={form.acepta_tratamiento_datos}
            onChange={(e) => { cambiar(e); setTocados({ ...tocados, acepta: true }) }}
            aria-invalid={ver('acepta') ? true : undefined} aria-describedby={ver('acepta') ? 'error-acepta' : undefined} />
          <span>Autorizo a Camellapp a usar mis datos solo para prestar el servicio, según la Ley 1581 de 2012. Puedo pedir que los borren cuando quiera.</span>
        </label>
        {ver('acepta') && <span id="error-acepta" className="campo-error">{errores.acepta}</span>}
      </div>
      <Aviso>{error}</Aviso>
      <button className="boton boton-bloque" disabled={enviando}>
        <UserPlus aria-hidden="true" /> {enviando ? 'Creando tu cuenta…' : 'Crear cuenta'}
      </button>
      <p className="texto-sm suave" style={{ textAlign: 'center' }}>¿Ya tienes cuenta? <Link to="/ingresar">Ingresa</Link></p>
    </form>
  )
}
