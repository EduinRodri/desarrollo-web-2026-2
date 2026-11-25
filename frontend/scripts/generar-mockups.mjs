// Mockups de Camellapp en un teléfono: capturas REALES de producción dentro de un marco SVG propio.
// Sirven para el README, el Word y presentaciones. No van dentro de la app (pesarían en datos móviles).
// Uso:  node scripts/generar-mockups.mjs
// Necesita Edge o Chrome. Si no está en la ruta de Windows por defecto: NAVEGADOR="ruta/al/navegador".
import { mkdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import puppeteer from 'puppeteer-core'
import sharp from 'sharp'

const SITIO = 'https://camellapp.vercel.app'
const NAVEGADOR = process.env.NAVEGADOR ?? 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'
const salida = fileURLToPath(new URL('../../docs/mockups/', import.meta.url))
mkdirSync(salida, { recursive: true })

// Pantallas: [nombre de archivo, ruta]. Datos demo públicos, sin iniciar sesión.
const PANTALLAS = [
  ['inicio', '/'],
  ['buscar', '/buscar'],
  ['servicio', '/servicios/2'],
]

// Teléfono de 390×844 puntos (tamaño típico) a densidad 2×.
const ANCHO = 390, ALTO = 844, DENSIDAD = 2
const W = ANCHO * DENSIDAD, H = ALTO * DENSIDAD   // 780 × 1688 px de pantalla
const BISEL = 26, RADIO = 112                     // marco del teléfono
const CW = W + BISEL * 2, CH = H + BISEL * 2       // 832 × 1740 px el teléfono completo

// 1) Capturas con puppeteer-core (usa el navegador instalado, no descarga ninguno).
// Emula un teléfono de verdad: 390 pt de ancho, táctil, 2×, tema claro (el de la marca) y sin animaciones.
const BARRA = 47 * DENSIDAD                        // barra de estado del teléfono (hora, señal)
const navegador = await puppeteer.launch({ executablePath: NAVEGADOR, headless: true })
async function capturar(nombre, ruta) {
  const archivo = `${salida}captura-${nombre}.png`
  const pagina = await navegador.newPage()
  await pagina.setViewport({ width: ANCHO, height: ALTO - 47, deviceScaleFactor: DENSIDAD, isMobile: true, hasTouch: true })
  await pagina.emulateMediaFeatures([
    { name: 'prefers-color-scheme', value: 'light' },
    { name: 'prefers-reduced-motion', value: 'reduce' },
  ])
  await pagina.goto(`${SITIO}${ruta}`, { waitUntil: 'networkidle0' })
  await pagina.screenshot({ path: archivo })
  await pagina.close()
  return archivo
}

// 2) Marco: cuerpo en tinta 900 con la pantalla recortada (regla evenodd), isla y botones laterales.
const marco = Buffer.from(`
<svg xmlns="http://www.w3.org/2000/svg" width="${CW + 12}" height="${CH}">
  <rect x="0" y="300" width="8" height="110" rx="4" fill="#2d2622"/>
  <rect x="${CW + 4}" y="260" width="8" height="170" rx="4" fill="#2d2622"/>
  <path fill-rule="evenodd" fill="#1b1714" d="
    M${6 + RADIO} 0h${CW - RADIO * 2}a${RADIO} ${RADIO} 0 0 1 ${RADIO} ${RADIO}v${CH - RADIO * 2}a${RADIO} ${RADIO} 0 0 1 -${RADIO} ${RADIO}h-${CW - RADIO * 2}a${RADIO} ${RADIO} 0 0 1 -${RADIO} -${RADIO}v-${CH - RADIO * 2}a${RADIO} ${RADIO} 0 0 1 ${RADIO} -${RADIO}Z
    M${6 + BISEL + RADIO - BISEL} ${BISEL}h${W - (RADIO - BISEL) * 2}a${RADIO - BISEL} ${RADIO - BISEL} 0 0 1 ${RADIO - BISEL} ${RADIO - BISEL}v${H - (RADIO - BISEL) * 2}a${RADIO - BISEL} ${RADIO - BISEL} 0 0 1 -${RADIO - BISEL} ${RADIO - BISEL}h-${W - (RADIO - BISEL) * 2}a${RADIO - BISEL} ${RADIO - BISEL} 0 0 1 -${RADIO - BISEL} -${RADIO - BISEL}v-${H - (RADIO - BISEL) * 2}a${RADIO - BISEL} ${RADIO - BISEL} 0 0 1 ${RADIO - BISEL} -${RADIO - BISEL}Z"/>
  <rect x="${6 + CW / 2 - 105}" y="${BISEL + 22}" width="210" height="60" rx="30" fill="#13100e"/>
</svg>`)

// Máscara redondeada para que la captura no se salga por las esquinas de la pantalla.
const mascara = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
  <rect width="${W}" height="${H}" rx="${RADIO - BISEL}" fill="#fff"/></svg>`)

// Barra de estado: hora a la izquierda, señal y batería a la derecha, en el color de la barra de la app.
const barraEstado = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${BARRA}">
  <rect width="${W}" height="${BARRA}" fill="#ffffff"/>
  <text x="96" y="62" font-family="Segoe UI, sans-serif" font-size="30" font-weight="600" fill="#1b1714">9:41</text>
  <g fill="#1b1714">
    <rect x="${W - 190}" y="50" width="7" height="12" rx="2"/><rect x="${W - 179}" y="45" width="7" height="17" rx="2"/>
    <rect x="${W - 168}" y="40" width="7" height="22" rx="2"/><rect x="${W - 157}" y="35" width="7" height="27" rx="2"/>
    <rect x="${W - 132}" y="36" width="50" height="26" rx="7" fill="none" stroke="#1b1714" stroke-width="3"/>
    <rect x="${W - 127}" y="41" width="34" height="16" rx="3"/><rect x="${W - 79}" y="44" width="4" height="10" rx="2"/>
  </g></svg>`)

async function enTelefono(captura) {
  const pantalla = await sharp({ create: { width: W, height: H, channels: 4, background: { r: 255, g: 255, b: 255, alpha: 1 } } })
    .composite([{ input: barraEstado, top: 0, left: 0 }, { input: captura, top: BARRA, left: 0 }, { input: mascara, blend: 'dest-in' }])
    .png().toBuffer()
  return sharp({ create: { width: CW + 12, height: CH, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
    .composite([{ input: pantalla, left: 6 + BISEL, top: BISEL }, { input: marco, left: 0, top: 0 }])
    .png().toBuffer()
}

const telefonos = []
for (const [nombre, ruta] of PANTALLAS) {
  const tel = await enTelefono(await capturar(nombre, ruta))
  await sharp(tel).png({ compressionLevel: 9 }).toFile(`${salida}telefono-${nombre}.png`)
  telefonos.push(tel)
  console.log(`listo: telefono-${nombre}.png`)
}
await navegador.close()


// 3) Composición de marca 2400×1350 (16:9): fondo arena y tres teléfonos.
const FW = 2400, FH = 1350, ESCALA = 0.66
const tw = Math.round((CW + 12) * ESCALA), th = Math.round(CH * ESCALA)
const fondo = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${FW}" height="${FH}">
  <rect width="${FW}" height="${FH}" fill="#f7f3ec"/>
  <circle cx="${FW / 2}" cy="${FH + 260}" r="1050" fill="#fdf4ef"/>
</svg>`)
// Sin punto sol en el fondo: la pantalla de inicio ya trae el suyo (regla: uno por composición).
const pequenos = await Promise.all(telefonos.map((t) => sharp(t).resize(tw, th).toBuffer()))
const centroY = Math.round((FH - th) / 2) + 40
await sharp(fondo).composite([
  { input: pequenos[1], left: Math.round(FW / 2 - tw * 1.5 - 60), top: centroY + 60 },
  { input: pequenos[2], left: Math.round(FW / 2 + tw * 0.5 + 60), top: centroY + 60 },
  { input: pequenos[0], left: Math.round(FW / 2 - tw / 2), top: centroY - 30 },
]).png({ compressionLevel: 9 }).toFile(`${salida}camellapp-mockups.png`)
await sharp(`${salida}camellapp-mockups.png`).resize(1200).webp({ quality: 82 }).toFile(`${salida}camellapp-mockups.webp`)
console.log('listo: camellapp-mockups.png y .webp en docs/mockups/')
