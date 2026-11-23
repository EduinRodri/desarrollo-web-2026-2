"""Carga datos de demostración (ficticios) para mostrar la app funcionando.

Uso local:  uv run python -m app.demo   (incluye un admin de prueba, solo en local)
En producción se cargan solos al arrancar si DEMO_AUTOCARGA=1, SIN cuenta de administrador:
el administrador real se define con ADMIN_CORREOS (ver seguridad.py).
Todas las cuentas de demostración usan la contraseña: demo12345 (son ficticias y públicas).
"""
import random
from datetime import datetime, timedelta, timezone

from sqlalchemy import select
from sqlalchemy.exc import IntegrityError

from .database import SessionLocal
from .models import Categoria, Pedido, Servicio, Usuario
from .seguridad import hashear

CLAVE = "demo12345"

TRABAJADORES = [
    ("Carlos Mendoza", "Malambo", "Plomero con 12 años de experiencia en casas y locales.", [
        ("Plomería", "Arreglo de fugas en baño y cocina", 40000, "1 a 2 horas", "Reviso tuberías, llaves y sanitarios, encuentro la fuga y la reparo. Llevo mis herramientas y repuestos básicos."),
        ("Limpieza de tanques", "Lavado y desinfección de tanques", 70000, "3 horas", "Vacío, lavo y desinfecto tanques elevados y subterráneos de hasta 2.000 litros."),
    ]),
    ("Yolanda Ortiz", "Soledad", "Electricista residencial certificada. Trabajo limpio y garantizado.", [
        ("Electricidad residencial", "Instalación de tomas, breakers y lámparas", 35000, "1 hora", "Instalo y cambio tomas, interruptores, breakers y lámparas. Reviso cortos y sobrecargas."),
    ]),
    ("Jesús Barrios", "Malambo", "Técnico en refrigeración. Mantenimiento de aires y neveras.", [
        ("Refrigeración y aire acondicionado", "Mantenimiento de aire acondicionado mini split", 90000, "2 horas", "Limpieza de filtros y serpentines, revisión de gas y drenaje. Tu aire enfría mejor y gasta menos energía."),
        ("Lavadoras, neveras y electrodomésticos", "Reparación de neveras y lavadoras", 50000, "2 horas", "Diagnóstico a domicilio. Si hay que cambiar una pieza, te digo el precio antes de hacerlo."),
    ]),
    ("Daniela Pérez", "Barranquilla", "Peluquera y barbera a domicilio, cortes para toda la familia.", [
        ("Peluquería y barbería a domicilio", "Corte de cabello a domicilio", 20000, "40 minutos", "Cortes para adultos y niños en la comodidad de tu casa. Llevo capa, máquina y todo lo necesario."),
    ]),
    ("Andrés Charris", "Galapa", "Mecánico de motos, voy hasta donde esté tu moto.", [
        ("Mecánica de motos", "Cambio de aceite y revisión general de moto", 45000, "1 hora", "Cambio de aceite y filtro, revisión de frenos, cadena y luces donde tengas la moto."),
    ]),
    ("Luz Marina Gómez", "Puerto Colombia", "Pintora con experiencia en interiores y fachadas.", [
        ("Pintura", "Pintura de habitaciones y fachadas", 150000, "1 día", "Preparo la superficie, resano y pinto con acabado parejo. Protejo muebles y pisos."),
    ]),
]

COMENTARIOS = {
    5: ["Excelente trabajo, llegó puntual y dejó todo limpio.", "Resolvió rápido y cobró lo que dijo.",
        "Muy amable, me explicó qué tenía el daño.", "Lo recomiendo, ya lo llamé dos veces.",
        "Trabajo bien hecho y con garantía.", "Llegó con sus herramientas y terminó antes de lo esperado."],
    4: ["Buen trabajo, llegó un poco tarde.", "Quedé satisfecho, aunque se demoró un poco más.",
        "Cumplió con lo acordado."],
    3: ["Cumplió, pero se demoró más de lo dicho."],
    2: ["No quedó bien terminado, tuvo que volver.", "Llegó tarde y no avisó."],
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


def cargar(con_admin: bool) -> bool:
    """Carga la demo una sola vez. Devuelve True si cargó, False si ya estaba."""
    random.seed(7)
    with SessionLocal() as db:
        if db.scalar(select(Usuario.id).where(Usuario.correo == "trabajador1@demo.co")):
            return False
        categorias = {c.nombre: c.id for c in db.scalars(select(Categoria))}
        if con_admin:
            usuario(db, "Equipo Camellapp", "admin@camellapp.co", es_admin=True)
        clientes = [usuario(db, n, f"cliente{i}@demo.co") for i, n in enumerate(
            ["Luisa Fernández", "Mario Rangel", "Sofía Polo", "Kevin Ariza", "Paola Díaz", "Rafael Torres"], 1)]

        # Cuántas reseñas y de qué tipo recibe cada trabajador (para mostrar los 3 niveles).
        perfiles = {"Carlos Mendoza": [5, 5, 5, 4, 5, 5], "Yolanda Ortiz": [5, 4, 4, 4, 5],
                    "Jesús Barrios": [5, 4], "Andrés Charris": [2, 3, 2]}
        for i, (nombre, zona, desc, servicios) in enumerate(TRABAJADORES, 1):
            t = usuario(db, nombre, f"trabajador{i}@demo.co", es_trabajador=True, descripcion=desc, zona=zona)
            creados = []
            for oficio, titulo, precio, tiempo, detalle in servicios:
                s = Servicio(trabajador_id=t.id, categoria_id=categorias[oficio], titulo=titulo,
                             descripcion=f"{detalle} Precio de referencia; el valor final se acuerda en la visita.",
                             precio_desde=precio, tiempo_estimado=tiempo)
                db.add(s)
                db.flush()
                creados.append(s)
            for j, estrellas in enumerate(perfiles.get(nombre, [])):
                db.add(Pedido(servicio_id=creados[0].id, cliente_id=clientes[j % len(clientes)].id,
                              fecha=datetime.now(timezone.utc) - timedelta(days=30 - j * 4),
                              estado="terminado", estrellas=estrellas,
                              comentario=COMENTARIOS[estrellas][j % len(COMENTARIOS[estrellas])]))
        try:
            db.commit()
        except IntegrityError:  # dos instancias arrancando a la vez en Vercel: la otra ya cargó
            db.rollback()
            return False
    return True


def main():
    from .main import preparar_base_de_datos  # aquí adentro para evitar importación circular
    from .database import DATABASE_URL
    preparar_base_de_datos()
    local = DATABASE_URL.startswith("sqlite")
    if cargar(con_admin=local):
        print("Datos de demostración cargados. Contraseña de todas las cuentas:", CLAVE)
        print("Cliente: cliente1@demo.co · Trabajador: trabajador1@demo.co" + (" · Admin: admin@camellapp.co" if local else ""))
    else:
        print("Los datos de demostración ya estaban cargados.")


if __name__ == "__main__":
    main()
