// Genera los íconos de la app y la imagen para compartir a partir de los SVG de /marca.
// Uso: node scripts/generar-assets.mjs
import { readFile, writeFile } from 'node:fs/promises'
import sharp from 'sharp'
import { optimize } from 'svgo'

const leer = (f) => readFile(new URL(`../marca/${f}`, import.meta.url))
const salida = (f) => new URL(`../public/${f}`, import.meta.url)

const isotipo = await leer('isotipo.svg')
// SVG optimizado para el favicon (SVGO quita lo innecesario).
const favicon = optimize(isotipo.toString(), { multipass: true }).data
await writeFile(salida('favicon.svg'), favicon)

const app = await leer('icono-app.svg')
const maskable = await leer('icono-maskable.svg')
const tareas = [
  [isotipo, 32, 'favicon-32.png'],
  [app, 180, 'apple-touch-icon.png'],
  [app, 192, 'icono-192.png'],
  [app, 512, 'icono-512.png'],
  [maskable, 512, 'icono-maskable-512.png'],
]
for (const [svg, tam, nombre] of tareas) {
  await sharp(svg, { density: 384 }).resize(tam, tam).png({ compressionLevel: 9 }).toFile(salida(nombre).pathname.slice(1))
}
await sharp(await leer('compartir.svg'), { density: 144 }).resize(1200, 630).png({ compressionLevel: 9 })
  .toFile(salida('compartir.png').pathname.slice(1))
console.log('Assets generados en /public')
