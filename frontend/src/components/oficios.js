// Ícono de cada grupo de oficios. Reconocer un dibujo es más rápido que leer (Nielsen: reconocer antes que recordar).
import { Car, Hammer, PlugZap, SprayCan, Truck, Users } from 'lucide-react'

export const ICONOS_GRUPO = {
  'Hogar y construcción': Hammer,
  'Equipos y aparatos': PlugZap,
  Vehículos: Car,
  'Limpieza y mantenimiento': SprayCan,
  'Personas y eventos': Users,
  'Mudanzas y otros': Truck,
}

// Nombre corto para los chips (menos texto = se escanea más rápido).
export const NOMBRE_CORTO = {
  'Hogar y construcción': 'Hogar',
  'Equipos y aparatos': 'Aparatos',
  Vehículos: 'Vehículos',
  'Limpieza y mantenimiento': 'Limpieza',
  'Personas y eventos': 'Personas',
  'Mudanzas y otros': 'Mudanzas',
}
