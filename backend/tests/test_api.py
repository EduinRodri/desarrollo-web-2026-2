"""Pruebas de la API: cada prueba usa una base de datos nueva en memoria.

Correr con:  uv run pytest -v
"""
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app import demo, main, seguridad
from app.database import Base, get_db
from app.models import Usuario
from app.reputacion import calcular_nivel


@pytest.fixture()
def cliente(monkeypatch):
    motor = create_engine("sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool)
    Sesion = sessionmaker(bind=motor, autoflush=False, expire_on_commit=False)
    monkeypatch.setattr(main, "engine", motor)
    monkeypatch.setattr(main, "SessionLocal", Sesion)
    monkeypatch.setattr(demo, "SessionLocal", Sesion)

    def db_de_prueba():
        db = Sesion()
        try:
            yield db
        finally:
            db.close()

    main.app.dependency_overrides[get_db] = db_de_prueba
    with TestClient(main.app) as c:
        c.Sesion = Sesion
        yield c
    main.app.dependency_overrides.clear()
    Base.metadata.drop_all(motor)


def registrar(c, correo, nombre="Ana Pérez"):
    r = c.post("/usuarios", json={
        "nombre": nombre, "correo": correo, "telefono": "3001234567",
        "contrasena": "clave-segura-1", "acepta_tratamiento_datos": True,
    })
    assert r.status_code == 201, r.text
    r = c.post("/sesion", data={"username": correo, "password": "clave-segura-1"})
    assert r.status_code == 200, r.text
    return {"Authorization": f"Bearer {r.json()['access_token']}"}


def trabajador_con_servicio(c, correo="plomero@test.co"):
    h = registrar(c, correo, "Carlos Plomero")
    r = c.put("/usuarios/me/trabajador", headers=h,
              json={"descripcion": "Plomero con 10 años de experiencia", "zona": "Malambo"})
    assert r.status_code == 200
    categoria = c.get("/categorias").json()[0]["id"]
    r = c.post("/servicios", headers=h, json={
        "categoria_id": categoria, "titulo": "Arreglo de fugas", "descripcion": "Reparo fugas de agua en baños y cocinas",
        "precio_desde": 40000, "tiempo_estimado": "2 horas",
    })
    assert r.status_code == 201, r.text
    return h, r.json()["id"]


# ---------- Pruebas unitarias de la regla de niveles (RF8) ----------
@pytest.mark.parametrize("promedio,resenas,esperado", [
    (None, 0, "Nuevo"),
    (5.0, 4, "Nuevo"),          # buen promedio pero menos de 5 reseñas
    (4.0, 5, "Nivel 1"),
    (4.5, 5, "Recomendado"),    # límite exacto
    (4.49, 12, "Nivel 1"),
])
def test_regla_de_niveles(promedio, resenas, esperado):
    assert calcular_nivel(promedio, resenas) == esperado


# ---------- Pruebas de integración de la API ----------
def test_carga_los_43_oficios(cliente):
    assert len(cliente.get("/categorias").json()) == 43


def test_registro_exige_autorizacion_de_datos(cliente):
    r = cliente.post("/usuarios", json={
        "nombre": "Sin Permiso", "correo": "x@test.co", "telefono": "3001234567",
        "contrasena": "clave-segura-1", "acepta_tratamiento_datos": False,
    })
    assert r.status_code == 400


def test_correo_repetido_da_409(cliente):
    registrar(cliente, "ana@test.co")
    r = cliente.post("/usuarios", json={
        "nombre": "Otra Ana", "correo": "ANA@test.co", "telefono": "3001234567",
        "contrasena": "clave-segura-1", "acepta_tratamiento_datos": True,
    })
    assert r.status_code == 409


def test_datos_invalidos_dan_422(cliente):
    r = cliente.post("/usuarios", json={"nombre": "A", "correo": "no-es-correo", "telefono": "123",
                                         "contrasena": "corta", "acepta_tratamiento_datos": True})
    assert r.status_code == 422


def test_contrasena_mal_da_401_y_se_guarda_con_hash(cliente):
    registrar(cliente, "ana@test.co")
    assert cliente.post("/sesion", data={"username": "ana@test.co", "password": "otra"}).status_code == 401
    with cliente.Sesion() as db:
        u = db.query(Usuario).one()
        assert u.contrasena_hash != "clave-segura-1" and u.contrasena_hash.startswith("$2")


def test_sin_token_da_401_y_cliente_no_publica_403(cliente):
    assert cliente.post("/servicios", json={}).status_code == 401
    h = registrar(cliente, "cliente@test.co")
    r = cliente.post("/servicios", headers=h, json={
        "categoria_id": 1, "titulo": "Servicio x", "descripcion": "descripción larga", "precio_desde": 1,
        "tiempo_estimado": "1 h"})
    assert r.status_code == 403


def test_busqueda_por_oficio_y_zona(cliente):
    trabajador_con_servicio(cliente)
    categoria = cliente.get("/categorias").json()[0]["id"]
    assert len(cliente.get("/servicios", params={"categoria_id": categoria, "zona": "Malambo"}).json()) == 1
    assert cliente.get("/servicios", params={"zona": "Soledad"}).json() == []
    assert cliente.get("/servicios", params={"zona": "Bogotá"}).status_code == 400
    grupo = cliente.get("/categorias").json()[0]["grupo"]  # el grupo del servicio creado
    otro = next(c["grupo"] for c in cliente.get("/categorias").json() if c["grupo"] != grupo)
    assert len(cliente.get("/servicios", params={"grupo": grupo}).json()) == 1
    assert cliente.get("/servicios", params={"grupo": otro}).json() == []


def test_nadie_pide_su_propio_servicio(cliente):
    h, servicio = trabajador_con_servicio(cliente)
    assert cliente.post("/pedidos", headers=h, json={"servicio_id": servicio}).status_code == 403


def test_flujo_completo_y_reglas_de_resena(cliente):
    ht, servicio = trabajador_con_servicio(cliente)
    hc = registrar(cliente, "cliente@test.co", "Luisa Cliente")
    pedido = cliente.post("/pedidos", headers=hc, json={"servicio_id": servicio}).json()
    pid = pedido["id"]
    assert pedido["estado"] == "pendiente"

    # Reseña antes de terminar -> 400 (criterio de aceptación de la propuesta)
    assert cliente.patch(f"/pedidos/{pid}/resena", headers=hc,
                         json={"estrellas": 5, "comentario": "Muy bien"}).status_code == 400
    # El cliente no puede aceptar su propio pedido -> 403
    assert cliente.patch(f"/pedidos/{pid}", headers=hc, json={"estado": "aceptado"}).status_code == 403
    # No se puede terminar algo que no se ha aceptado -> 409
    assert cliente.patch(f"/pedidos/{pid}", headers=ht, json={"estado": "terminado"}).status_code == 409

    assert cliente.patch(f"/pedidos/{pid}", headers=ht, json={"estado": "aceptado"}).json()["estado"] == "aceptado"
    assert cliente.patch(f"/pedidos/{pid}", headers=ht, json={"estado": "terminado"}).json()["estado"] == "terminado"

    # El trabajador no califica su propio pedido -> 403
    assert cliente.patch(f"/pedidos/{pid}/resena", headers=ht,
                         json={"estrellas": 5, "comentario": "Me califico"}).status_code == 403
    # 6 estrellas -> 422
    assert cliente.patch(f"/pedidos/{pid}/resena", headers=hc,
                         json={"estrellas": 6, "comentario": "Excelente"}).status_code == 422
    r = cliente.patch(f"/pedidos/{pid}/resena", headers=hc, json={"estrellas": 5, "comentario": "Excelente"})
    assert r.status_code == 200
    # Una sola reseña por pedido -> 409
    assert cliente.patch(f"/pedidos/{pid}/resena", headers=hc,
                         json={"estrellas": 1, "comentario": "Cambio"}).status_code == 409

    perfil = cliente.get(f"/trabajadores/{r.json()['servicio']['trabajador']['id']}").json()
    assert perfil["reputacion"] == {"promedio": 5.0, "resenas": 1, "nivel": "Nuevo"}
    assert perfil["resenas"][0]["cliente"] == "Luisa"


def test_recomendado_con_cinco_resenas(cliente):
    ht, servicio = trabajador_con_servicio(cliente)
    for i in range(5):
        hc = registrar(cliente, f"c{i}@test.co", f"Cliente {i}")
        pid = cliente.post("/pedidos", headers=hc, json={"servicio_id": servicio}).json()["id"]
        cliente.patch(f"/pedidos/{pid}", headers=ht, json={"estado": "aceptado"})
        cliente.patch(f"/pedidos/{pid}", headers=ht, json={"estado": "terminado"})
        cliente.patch(f"/pedidos/{pid}/resena", headers=hc, json={"estrellas": 5 if i else 4, "comentario": "Bien"})
    rep = cliente.get(f"/servicios/{servicio}").json()["reputacion"]
    assert rep == {"promedio": 4.8, "resenas": 5, "nivel": "Recomendado"}


def test_reporte_solo_para_admin(cliente):
    h = registrar(cliente, "ana@test.co")
    assert cliente.get("/reportes", headers=h).status_code == 403
    with cliente.Sesion() as db:
        db.query(Usuario).update({"es_admin": True})
        db.commit()
    r = cliente.get("/reportes", headers=h)
    assert r.status_code == 200 and set(r.json()) == {
        "pedidos_por_oficio", "pedidos_por_zona", "trabajadores_promedio_bajo"}


def test_admin_por_correo(cliente, monkeypatch):
    monkeypatch.setattr(seguridad, "ADMIN_CORREOS", {"jefe@camellapp.co"})
    h = registrar(cliente, "Jefe@camellapp.co", "Jefa Equipo")
    assert cliente.get("/usuarios/me", headers=h).json()["es_admin"] is True
    assert cliente.get("/reportes", headers=h).status_code == 200
    h2 = registrar(cliente, "otro@test.co")
    assert cliente.get("/reportes", headers=h2).status_code == 403


def test_demo_se_carga_una_vez_y_sin_admin(cliente):
    assert demo.cargar(con_admin=False) is True
    assert demo.cargar(con_admin=False) is False  # idempotente
    with cliente.Sesion() as db:
        assert db.query(Usuario).filter(Usuario.es_admin.is_(True)).count() == 0
    assert len(cliente.get("/servicios").json()) == 8
