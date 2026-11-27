// Manual de marca navegable. Muestra el sistema VIVO: los colores y tipos salen de los mismos tokens que usa la app.
import { Ban, Check } from 'lucide-react'
import { Isotipo, Logo, PuntoSol } from '../components/Marca'
import { Camello } from '../components/Camello'
import { useTitulo } from '../hooks/useTitulo'

const COLORES = [
  ['Terracota 600', '#A93F1D', '--terra-600', 'Marca y acción principal. Una por pantalla.', '#fff'],
  ['Sol 500', '#F5B300', '--sol-500', 'Punto sol, estrellas, «Recomendado». Nunca texto sobre blanco.', '#1B1714'],
  ['Arena 50', '#F7F3EC', '--gris-50', 'Fondo cálido.', '#1B1714'],
  ['Tinta 900', '#1B1714', '--gris-900', 'Texto.', '#fff'],
  ['Verde 700', '#0B6249', '--verde-700', 'Solo «terminado» y éxito.', '#fff'],
  ['Rojo 600', '#C4321F', '--rojo-600', 'Solo errores y acciones destructivas.', '#fff'],
]

const VOZ = [
  ['Cercana', 'Tuteo, frases cortas, palabras de la casa: camello, maestro, vecino.', 'Costeñismo exagerado o chistes forzados.'],
  ['Honesta', 'Dice qué hace la app y qué todavía no.', 'Promesas como «verificados» o «garantizado».'],
  ['Clara', 'Verbo primero: «Pedir servicio», «Calificar».', 'Jerga: «solicitud», «usuario», «transacción».'],
  ['Trabajadora', 'Celebra el trabajo bien hecho.', 'Lástima o condescendencia con los oficios.'],
]

export default function Marca() {
  useTitulo('Manual de marca')
  return (
    <div className="manual">
      <header className="manual-portada">
        <p className="sobretitulo">Manual de marca · v1 · noviembre 2026</p>
        <h1>Camello bien hecho, cerca de ti<PuntoSol /></h1>
        <p><em>Camello</em> es como en la Costa le decimos al trabajo. Camellapp existe para que el camello bien hecho se vea, se valore y se contrate con confianza.</p>
      </header>

      <section className="bloque">
        <h2>1. Plataforma</h2>
        <dl className="definiciones">
          <div><dt>Propósito</dt><dd>Que el trabajo de oficio de Malambo y el área metropolitana se encuentre fácil y se pague con la confianza que merece.</dd></div>
          <div><dt>Promesa</dt><dd>Encuentras a alguien de tu zona, ves qué opinan los vecinos que ya lo contrataron, y tú decides.</dd></div>
          <div><dt>Arquetipo</dt><dd>El vecino (Hombre corriente, Mark y Pearson) con un toque de Cuidador: cercano, sencillo, de fiar. No presume: cumple.</dd></div>
          <div><dt>Posicionamiento</dt><dd>Para los hogares que necesitan un maestro de confianza, Camellapp es el directorio de oficios donde cada reseña viene de un trabajo terminado. A diferencia del «conocido de un conocido», ves la reputación antes de abrir la puerta.</dd></div>
        </dl>
      </section>

      <section className="bloque">
        <h2>2. Logo</h2>
        <div className="muestras-logo">
          <div className="muestra"><span className="logo logo-grande"><Logo /></span><span className="texto-xs">Sobre arena o blanco</span></div>
          <div className="muestra muestra-terra"><span className="logo logo-grande logo-invertido"><Logo /></span><span className="texto-xs">Sobre terracota</span></div>
          <div className="muestra muestra-oscura"><span className="logo logo-grande logo-oscuro"><Logo /></span><span className="texto-xs">Sobre fondo oscuro</span></div>
        </div>
        <div className="dos-columnas" style={{ marginTop: 'var(--esp-4)' }}>
          <div className="tarjeta">
            <h3>El isotipo</h3>
            <div className="isotipo-explicado"><Isotipo /></div>
            <p className="texto-sm">Un <strong>pin</strong> (está cerca de ti) con una <strong>C</strong> que cierra en el <strong>punto sol</strong> (el trabajo terminado).</p>
          </div>
          <div className="tarjeta pila-sm">
            <h3>Reglas</h3>
            <p className="texto-sm"><Check size={16} className="ok" aria-hidden="true" /> Zona de protección: la mitad de la altura del isotipo.</p>
            <p className="texto-sm"><Check size={16} className="ok" aria-hidden="true" /> Tamaño mínimo: isotipo 24 px · logo completo 96 px.</p>
            <p className="texto-sm"><Ban size={16} className="no" aria-hidden="true" /> No rotar, estirar, recolorear, poner sombras ni degradados.</p>
            <p className="texto-sm"><Ban size={16} className="no" aria-hidden="true" /> No quitar el punto sol ni usar el pin sin la C.</p>
          </div>
        </div>
      </section>

      <section className="bloque">
        <h2>3. Color</h2>
        <p className="suave">Proporción: 70 % arena y blanco · 20 % tinta · 8 % terracota · 2 % sol. El sol es escaso a propósito: así se nota.</p>
        <div className="paleta">
          {COLORES.map(([nombre, hex, token, uso, texto]) => (
            <div key={hex} className="color">
              <div className="color-muestra" style={{ background: hex, color: texto }}>{hex}</div>
              <strong>{nombre}</strong>
              <code className="texto-xs">var({token})</code>
              <span className="texto-xs suave">{uso}</span>
            </div>
          ))}
        </div>
        <div className="barra-proporcion" role="img" aria-label="Proporción de color: 70 % arena, 20 % tinta, 8 % terracota, 2 % sol">
          <span style={{ flex: 70, background: 'var(--gris-50)' }} /><span style={{ flex: 20, background: 'var(--gris-900)' }} />
          <span style={{ flex: 8, background: 'var(--terra-600)' }} /><span style={{ flex: 2, background: 'var(--sol-500)' }} />
        </div>
      </section>

      <section className="bloque">
        <h2>4. Tipografía</h2>
        <div className="tarjeta pila">
          <p className="muestra-tipo">Figtree</p>
          <p className="suave texto-sm">Libre (SIL OFL), autohospedada, 20 KB. Pesos 400, 600 y 700.</p>
          <div className="escala">
            <p style={{ font: '700 2rem/2.5rem var(--fuente)' }}>Portada 32/40</p>
            <p style={{ font: '700 1.5rem/2rem var(--fuente)' }}>Titular 24/32</p>
            <p style={{ font: '700 1.25rem/1.75rem var(--fuente)' }}>Título 20/28</p>
            <p style={{ font: '400 1rem/1.5rem var(--fuente)' }}>Cuerpo 16/24 — El maestro llegó puntual y dejó todo limpio.</p>
            <p style={{ font: '400 .875rem/1.25rem var(--fuente)' }}>Pequeño 14/20 — Precio de referencia</p>
            <p style={{ font: '600 .75rem/1rem var(--fuente)' }}>Etiqueta 12/16 — RECOMENDADO</p>
          </div>
        </div>
      </section>

      <section className="bloque">
        <h2>5. El punto sol</h2>
        <div className="tarjeta punto-explicado">
          <span className="punto-gigante" aria-hidden="true" />
          <div>
            <p>El punto amarillo es la firma de Camellapp: significa <strong>«listo, bien hecho»</strong>. Está en el isotipo, cierra los titulares de marca y aparece en cada ilustración.</p>
            <p className="texto-sm suave">Regla: uno por composición. Si hay dos, ya no es especial. (Activos distintivos: Romaniuk, 2018.)</p>
          </div>
        </div>
      </section>

      <section className="bloque">
        <h2>6. Voz y tono</h2>
        <p className="suave">La voz no cambia; el tono se ajusta a cómo se siente la persona (como la guía de Mailchimp).</p>
        <div className="voz">
          {VOZ.map(([rasgo, es, no]) => (
            <div key={rasgo} className="tarjeta">
              <h3>{rasgo}</h3>
              <p className="texto-sm"><Check size={16} className="ok" aria-hidden="true" /> {es}</p>
              <p className="texto-sm"><Ban size={16} className="no" aria-hidden="true" /> {no}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bloque">
        <h2>7. Ilustración</h2>
        <p className="suave">Formas simples y redondeadas, máximo tres colores, espacio negativo y siempre un punto sol. Nada de stock ni de personas realistas. SVG con tokens: funcionan en modo oscuro.</p>
        <h3 className="texto-sm">El camello</h3>
        <p className="suave">Su joroba es la C del isotipo y termina en el punto sol; se para sobre el anillo de «estás aquí». De pie es acción; echado, espera. No habla, no reemplaza al pin y solo aparece en pantallas completas.</p>
        <div className="ilustraciones">
          <div className="tarjeta"><Camello expresion="contento" /><span className="texto-xs suave">Contento · primer uso</span></div>
          <div className="tarjeta"><Camello pose="echado" expresion="buscando" /><span className="texto-xs suave">Buscando · lista vacía</span></div>
          <div className="tarjeta"><Camello pose="echado" expresion="preocupado" senal={false} /><span className="texto-xs suave">Preocupado, calmado · sin conexión</span></div>
          <div className="tarjeta"><Camello expresion="celebrando" /><span className="texto-xs suave">Celebrando · camello terminado</span></div>
        </div>
      </section>

      <section className="bloque">
        <h2>8. Movimiento e iconos</h2>
        <p>Curva <code>cubic-bezier(0.2, 0, 0, 1)</code> · 120 ms microinteracciones · 200 ms cambios · 300 ms entradas. El movimiento explica, no decora; con «reducir movimiento» todo es instantáneo. Íconos Lucide de 2 px de trazo; nada de emoji en la interfaz.</p>
      </section>
    </div>
  )
}
