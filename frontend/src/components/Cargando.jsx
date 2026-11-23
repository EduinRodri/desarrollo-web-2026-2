export default function Cargando({ texto = 'Cargando…' }) {
  return (
    <div className="cargando" role="status">
      <span className="girador" aria-hidden="true" />
      {texto}
    </div>
  )
}
