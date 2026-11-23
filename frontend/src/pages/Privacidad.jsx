// Tratamiento de datos personales (Ley 1581 de 2012). Lenguaje claro: la gente lo lee si se entiende.
// Texto propio de un proyecto académico; no reemplaza asesoría legal.
export default function Privacidad() {
  return (
    <article className="tarjeta lectura">
      <h1>Cómo cuidamos tus datos</h1>
      <p className="suave">Política de tratamiento de datos personales · Ley 1581 de 2012 · Versión académica, noviembre de 2026</p>

      <h2>Qué datos pedimos y para qué</h2>
      <ul>
        <li><strong>Nombre, correo y celular:</strong> para crear tu cuenta y que puedas pedir u ofrecer servicios.</li>
        <li><strong>Si ofreces servicios:</strong> tu descripción y tu municipio, que se muestran en tu perfil público.</li>
        <li><strong>Pedidos y reseñas:</strong> para mostrar el estado de cada pedido y la reputación de los trabajadores.</li>
      </ul>
      <p>Tu correo y tu celular <strong>no</strong> aparecen en tu perfil público. Tu contraseña se guarda cifrada con una función hash: nadie puede leerla, ni siquiera nosotros.</p>

      <h2>Tu autorización</h2>
      <p>Al registrarte marcas una casilla con la que autorizas este uso de tus datos. Guardamos la fecha de esa autorización, como pide la ley.</p>

      <h2>Tus derechos</h2>
      <p>Como titular de tus datos puedes conocerlos, actualizarlos y corregirlos, pedir prueba de tu autorización, saber cómo los usamos, pedir que los borremos o revocar tu autorización, y presentar quejas ante la Superintendencia de Industria y Comercio.</p>

      <h2>Lo que no hacemos</h2>
      <ul>
        <li>No vendemos ni compartimos tus datos con terceros.</li>
        <li>No manejamos pagos ni datos bancarios.</li>
      </ul>

      <p className="texto-sm suave">Camellapp es un proyecto académico en desarrollo. Esta política es una versión de estudio y no reemplaza la asesoría de un abogado antes de operar con usuarios reales.</p>
    </article>
  )
}
