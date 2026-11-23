"""Carga datos de demostración (ficticios) para mostrar la app funcionando.

Uso:  uv run python -m app.demo
Todas las cuentas de demostración usan la contraseña: demo12345
"""
import random
from datetime import datetime, timedelta, timezone

from sqlalchemy import select

from .database import SessionLocal
from .main import preparar_base_de_datos
from .models import Categoria, Pedido, Servicio, Usuario
from .seguridad import hashear

CLAVE = "demo12345"

TRABAJADORES = [
    ("Carlos Mendoza", "Malambo", "Plomero con 12 años de experiencia en casas y locales.", [
        ("Plomería", "Arreglo de fugas en baño y cocina", 40000, "1 a 2 horas"),
        ("Limpieza de tanques", "Lavado y desinfección de tanques", 70000, "3 horas"),
    ]),
    ("Yolanda Ortiz", "Soledad", "Electricista residencial certificada. Trabajo limpio y garantizado.", [
        ("Electricidad residencial", "Instalación de tomas, breakers y lámparas", 35000, "1 hora"),
    ]),
    ("Jesús Barrios", "Malambo", "Técnico en refrigeración. Mantenimiento de aires y neveras.", [
        ("Refrigeración y aire acondicionado", "Mantenimiento de aire acondicionado mini split", 90000, "2 horas"),
        ("Lavadoras, neveras y electrodomésticos", "Reparación de neveras y lavadoras", 50000, "2 horas"),
    ]),
    ("Daniela Pérez", "Barranquilla", "Peluquera y barbera a domicilio, cortes para toda la familia.", [
        ("Peluquería y barbería a domicilio", "Corte de cabello a domicilio", 20000, "40 minutos"),
    ]),
    ("Andrés Charris", "Galapa", "Mecánico de motos, voy hasta donde esté tu moto.", [
        ("Mecánica de motos", "Cambio de aceite y revisión general de moto", 45000, "1 hora"),
    ]),
    ("Luz Marina Gómez", "Puerto Colombia", "Pintora con experiencia en interiores y fachadas.", [
        ("Pintura", "Pintura de habitaciones y fachadas", 150000, "1 día"),
    ]),
]

COMENTARIOS = {
    5: ["Excelente trabajo, muy puntual.", "Muy recomendado, dejó todo limpio.", "Resolvió rápido y cobró justo."],
    4: ["Buen trabajo, llegó un poco tarde.", "Quedé satisfecho."],
    3: ["Cumplió, pero se demoró más de lo dicho."],
    2: ["No quedó bien terminado."],
}


def usuario(db, nombre, correo, **extra):
    u = db.scalar(select(Usuario).where(Usuario.correo == correo))
    if u:
        return u
    u = Usuario(nombre=nombre, correo=correo, telefono="300" + str(random.randint(1000000, 9999999)),
                contrasena_hash=hashear(CLAVE), fecha_autorizacion_datos=datetime.now(timezone.utc), **extra)
    db.add(u)
    db.flush()
    return u


def main():
    random.seed(7)
    preparar_base_de_datos()
    with SessionLocal() as db:
        if db.scalar(select(Usuario.id).where(Usuario.correo == "admin@camellapp.co")):
            print("Los datos de demostración ya estaban cargados.")
            return
        categorias = {c.nombre: c.id for c in db.scalars(select(Categoria))}
        usuario(db, "Equipo Camellapp", "admin@camellapp.co", es_admin=True)
        clientes = [usuario(db, n, f"cliente{i}@demo.co") for i, n in enumerate(
            ["Luisa Fernández", "Mario Rangel", "Sofía Polo", "Kevin Ariza", "Paola Díaz", "Rafael Torres"], 1)]

        # Cuántas reseñas y de qué tipo recibe cada trabajador (para mostrar los 3 niveles).
        perfiles = {"Carlos Mendoza": [5, 5, 5, 4, 5, 5], "Yolanda Ortiz": [5, 4, 4, 4, 5],
                    "Jesús Barrios": [5, 4], "Andrés Charris": [2, 3, 2]}
        for i, (nombre, zona, desc, servicios) in enumerate(TRABAJADORES, 1):
            t = usuario(db, nombre, f"trabajador{i}@demo.co", es_trabajador=True, descripcion=desc, zona=zona)
            creados = []
            for oficio, titulo, precio, tiempo in servicios:
                s = Servicio(trabajador_id=t.id, categoria_id=categorias[oficio], titulo=titulo,
                             descripcion=f"{titulo}. {desc} Precio de referencia; el valor final se acuerda en la visita.",
                             precio_desde=precio, tiempo_estimado=tiempo)
                db.add(s)
                db.flush()
                creados.append(s)
            for j, estrellas in enumerate(perfiles.get(nombre, [])):
                db.add(Pedido(servicio_id=creados[0].id, cliente_id=clientes[j % len(clientes)].id,
                              fecha=datetime.now(timezone.utc) - timedelta(days=30 - j * 4),
                              estado="terminado", estrellas=estrellas,
                              comentario=random.choice(COMENTARIOS[estrellas])))
        db.commit()
    print("Datos de demostración cargados. Contraseña de todas las cuentas:", CLAVE)
    print("Admin: admin@camellapp.co · Cliente: cliente1@demo.co · Trabajador: trabajador1@demo.co")


if __name__ == "__main__":
    main()
