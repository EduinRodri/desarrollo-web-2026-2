// Promedio bayesiano: mezcla el promedio real con una suposición (4 estrellas) que pesa como 3 reseñas.
// Así un 5,0 con 1 reseña no le gana a un 4,8 con 50 (Baymard: la gente confía más en muchas reseñas).
const PROMEDIO_BASE = 4
const PESO_BASE = 3

export function puntaje({ reputacion: r }) {
  const n = r?.resenas ?? 0
  return (PROMEDIO_BASE * PESO_BASE + (r?.promedio ?? 0) * n) / (PESO_BASE + n)
}
