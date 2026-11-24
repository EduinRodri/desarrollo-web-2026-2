"""Pruebas de la API: cada prueba usa una base de datos nueva en memoria.

Correr con:  uv run pytest -v
"""
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app import demo, limites, main, seguridad
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
    # Las pruebas crean muchas cuentas desde la misma IP; los límites reales se prueban aparte.
    monkeypatch.setattr(limites, "MAX_REGISTROS_POR_IP", 1000)
    monkeypatch.setattr(limites, "MAX_PEDIDOS_POR_CUENTA", 1000)

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


def test_admin_por_numero_de_cuenta(cliente, monkeypatch):
    h = registrar(cliente, "jefe@test.co", "Jefa Equipo")
    mi_id = cliente.get("/usuarios/me", headers=h).json()["id"]
    monkeypatch.setattr(seguridad, "ADMIN_IDS", {mi_id})
    r = cliente.post("/sesion", data={"username": "jefe@test.co", "password": "clave-segura-1"})
    h = {"Authorization": f"Bearer {r.json()['access_token']}"}
    assert cliente.get("/reportes", headers=h).status_code == 200
    h2 = registrar(cliente, "otro@test.co")
    assert cliente.get("/reportes", headers=h2).status_code == 403


def test_demo_se_carga_una_vez_y_sin_admin(cliente):
    assert demo.cargar(con_admin=False) is True
    assert demo.cargar(con_admin=False) is False  # idempotente
    with cliente.Sesion() as db:
        assert db.query(Usuario).filter(Usuario.es_admin.is_(True)).count() == 0
    assert len(cliente.get("/servicios").json()) == 8


# ---------- Límite de intentos de inicio de sesión (OWASP API4 / ASVS 2.2.1) ----------
def test_bloquea_tras_5_fallos_del_mismo_correo(cliente):
    registrar(cliente, "victima@test.co")
    for _ in range(5):
        r = cliente.post("/sesion", data={"username": "victima@test.co", "password": "mala"})
        assert r.status_code == 401
    r = cliente.post("/sesion", data={"username": "victima@test.co", "password": "mala"})
    assert r.status_code == 429
    assert r.headers["Retry-After"] == "900"
    # Bloqueado aunque ahora ponga la contraseña correcta: así un ataque no puede seguir adivinando.
    r = cliente.post("/sesion", data={"username": "victima@test.co", "password": "clave-segura-1"})
    assert r.status_code == 429


def test_entrar_bien_borra_los_fallos_del_correo(cliente):
    registrar(cliente, "olvidadizo@test.co")
    for _ in range(4):
        cliente.post("/sesion", data={"username": "olvidadizo@test.co", "password": "mala"})
    r = cliente.post("/sesion", data={"username": "olvidadizo@test.co", "password": "clave-segura-1"})
    assert r.status_code == 200
    for _ in range(4):  # el contador volvió a cero: 4 fallos más no bloquean
        r = cliente.post("/sesion", data={"username": "olvidadizo@test.co", "password": "mala"})
        assert r.status_code == 401


def test_bloquea_una_ip_que_prueba_muchos_correos(cliente):
    for i in range(20):
        cliente.post("/sesion", data={"username": f"x{i}@test.co", "password": "mala"})
    r = cliente.post("/sesion", data={"username": "otro@test.co", "password": "mala"})
    assert r.status_code == 429


def test_los_fallos_viejos_no_cuentan(cliente):
    from datetime import timedelta
    from app.models import IntentoSesion
    registrar(cliente, "paciente@test.co")
    for _ in range(5):
        cliente.post("/sesion", data={"username": "paciente@test.co", "password": "mala"})
    with cliente.Sesion() as db:  # se simula que pasaron 16 minutos
        for intento in db.query(IntentoSesion).all():
            intento.fecha = intento.fecha - timedelta(minutes=16)
        db.commit()
    r = cliente.post("/sesion", data={"username": "paciente@test.co", "password": "clave-segura-1"})
    assert r.status_code == 200


def test_no_guarda_correo_ni_ip_en_claro(cliente):
    from app.models import IntentoSesion
    cliente.post("/sesion", data={"username": "privado@test.co", "password": "mala"})
    with cliente.Sesion() as db:
        claves = [i.clave for i in db.query(IntentoSesion).all()]
    assert len(claves) == 2 and all(len(c) == 64 and "privado" not in c for c in claves)


# ---------- Pruebas de ataque (auditoría de seguridad del 23 nov) ----------
from datetime import datetime, timedelta, timezone

import jwt as pyjwt


def _token(**cambios):
    ahora = datetime.now(timezone.utc)
    datos = {"sub": "1", "iat": ahora, "exp": ahora + timedelta(hours=1),
             "iss": seguridad.EMISOR, "aud": seguridad.AUDIENCIA, **cambios}
    datos = {k: v for k, v in datos.items() if v is not None}
    return pyjwt.encode(datos, seguridad.CLAVE_SECRETA, algorithm="HS256")


@pytest.mark.parametrize("token", [
    "a.b.c",                                                          # basura
    _token(exp=datetime.now(timezone.utc) - timedelta(seconds=1)),    # vencido
    _token(aud="otra-app"),                                           # firmado para otro uso
    _token(iss="otro-emisor"),
    _token(iat=None),                                                 # le falta un dato obligatorio
    pyjwt.encode({"sub": "1"}, "clave-adivinada-por-el-atacante-1234567890", algorithm="HS256"),
    pyjwt.encode({"sub": "1", "exp": 9999999999}, None, algorithm="none"),  # ataque alg=none
])
def test_rechaza_tokens_falsos_o_alterados(cliente, token):
    registrar(cliente, "ana@test.co")
    r = cliente.get("/usuarios/me", headers={"Authorization": f"Bearer {token}"})
    assert r.status_code == 401


def test_registrar_correo_ajeno_no_da_admin(cliente):
    """El hueco de antes: registrar el correo del equipo daba permisos de administrador."""
    h = registrar(cliente, "eduin@camellapp.co", "Atacante Uno")
    assert cliente.get("/usuarios/me", headers=h).json()["es_admin"] is False
    assert cliente.get("/reportes", headers=h).status_code == 403


def test_no_se_puede_autoasignar_admin_al_registrarse(cliente):
    r = cliente.post("/usuarios", json={
        "nombre": "Ana Pérez", "correo": "masivo@test.co", "telefono": "3001234567",
        "contrasena": "clave-segura-1", "acepta_tratamiento_datos": True,
        "es_admin": True, "es_trabajador": True, "id": 1,
    })
    assert r.status_code == 201
    assert r.json()["es_admin"] is False and r.json()["es_trabajador"] is False


def _registro(correo, **cambios):
    return {"nombre": "Ana Pérez", "correo": correo, "telefono": "3001234567",
            "contrasena": "clave-segura-1", "acepta_tratamiento_datos": True, **cambios}


def test_limite_de_registros_por_ip(cliente, monkeypatch):
    monkeypatch.setattr(limites, "MAX_REGISTROS_POR_IP", 5)
    for i in range(5):
        cliente.post("/usuarios", json=_registro(f"bot{i}@test.co"))
    assert cliente.post("/usuarios", json=_registro("bot9@test.co")).status_code == 429


def test_limite_y_duplicados_de_pedidos(cliente, monkeypatch):
    _, servicio = trabajador_con_servicio(cliente)
    h = registrar(cliente, "spam@test.co")
    assert cliente.post("/pedidos", headers=h, json={"servicio_id": servicio}).status_code == 201
    assert cliente.post("/pedidos", headers=h, json={"servicio_id": servicio}).status_code == 409
    monkeypatch.setattr(limites, "MAX_PEDIDOS_POR_CUENTA", 1)
    pedido = cliente.get("/pedidos", headers=h).json()[0]["id"]
    cliente.patch(f"/pedidos/{pedido}", headers=h, json={"estado": "cancelado"})
    assert cliente.post("/pedidos", headers=h, json={"servicio_id": servicio}).status_code == 429


@pytest.mark.parametrize("contrasena,motivo", [
    ("12345678", "común"), ("demo12345", "común"), ("aaaaaaaaaa", "repetida"),
    ("ñ" * 40, "más de 72 bytes"), ("        ", "solo espacios"), ("pruebaclave1", "contiene el correo"),
])
def test_rechaza_contrasenas_debiles(cliente, contrasena, motivo):
    r = cliente.post("/usuarios", json=_registro("prueba@test.co", contrasena=contrasena))
    assert r.status_code == 422, motivo


def test_contrasena_gigante_al_iniciar_sesion_no_rompe(cliente):
    registrar(cliente, "ana@test.co")
    r = cliente.post("/sesion", data={"username": "ana@test.co", "password": "ñ" * 5000})
    assert r.status_code == 401


@pytest.mark.parametrize("nombre", ["Equipo Camellapp", "Soporte CAMELL APP", "   ", "Ana\x00Pérez"])
def test_rechaza_nombres_que_suplantan_o_vacios(cliente, nombre):
    assert cliente.post("/usuarios", json=_registro("x@test.co", nombre=nombre)).status_code == 422


def test_resena_de_solo_espacios_no_pasa(cliente):
    h_t, servicio = trabajador_con_servicio(cliente)
    h = registrar(cliente, "cli@test.co")
    p = cliente.post("/pedidos", headers=h, json={"servicio_id": servicio}).json()["id"]
    cliente.patch(f"/pedidos/{p}", headers=h_t, json={"estado": "aceptado"})
    cliente.patch(f"/pedidos/{p}", headers=h_t, json={"estado": "terminado"})
    r = cliente.patch(f"/pedidos/{p}/resena", headers=h, json={"estrellas": 5, "comentario": "     "})
    assert r.status_code == 422


@pytest.mark.parametrize("ruta", [
    "/pedidos/99999999999999999999", "/servicios/99999999999999999999",
    "/trabajadores/99999999999999999999", "/servicios?desde=99999999999999",
    "/servicios?categoria_id=99999999999999999999", "/servicios/0", "/servicios?limite=100000",
])
def test_numeros_absurdos_no_causan_error_500(cliente, ruta):
    h = registrar(cliente, "ana@test.co")
    r = cliente.get(ruta, headers=h)
    assert r.status_code in (404, 405, 422), r.text


def test_nadie_ve_ni_toca_pedidos_ajenos(cliente):
    """BOLA (OWASP API1): un tercero no puede cambiar, calificar ni listar un pedido que no es suyo."""
    h_t, servicio = trabajador_con_servicio(cliente)
    h_c = registrar(cliente, "cliente@test.co")
    h_x = registrar(cliente, "intruso@test.co")
    p = cliente.post("/pedidos", headers=h_c, json={"servicio_id": servicio}).json()["id"]
    for estado in ("aceptado", "rechazado", "terminado", "cancelado"):
        assert cliente.patch(f"/pedidos/{p}", headers=h_x, json={"estado": estado}).status_code == 403
    r = cliente.patch(f"/pedidos/{p}/resena", headers=h_x, json={"estrellas": 1, "comentario": "malo"})
    assert r.status_code == 403
    assert cliente.get("/pedidos", headers=h_x).json() == []
    assert cliente.get("/pedidos?como=trabajador", headers=h_x).json() == []
    # El cliente tampoco puede aceptar su propio pedido (eso le toca al trabajador).
    assert cliente.patch(f"/pedidos/{p}", headers=h_c, json={"estado": "aceptado"}).status_code == 403


def test_nadie_edita_servicios_ajenos(cliente):
    _, servicio = trabajador_con_servicio(cliente)
    h_x, _ = trabajador_con_servicio(cliente, "otro-plomero@test.co")
    r = cliente.patch(f"/servicios/{servicio}", headers=h_x, json={"titulo": "Estafa: paga por adelantado"})
    assert r.status_code == 403


def test_respuestas_publicas_sin_datos_privados(cliente):
    """Exposición excesiva (API3): ni teléfono ni correo de nadie en lo público."""
    trabajador_con_servicio(cliente)
    servicios = cliente.get("/servicios")
    perfil = cliente.get(f"/trabajadores/{servicios.json()[0]['trabajador']['id']}")
    texto = servicios.text + perfil.text
    assert "3001234567" not in texto and "plomero@test.co" not in texto and "contrasena" not in texto


def test_servicio_pausado_no_es_publico(cliente):
    h, servicio = trabajador_con_servicio(cliente)
    cliente.patch(f"/servicios/{servicio}", headers=h, json={"activo": False})
    assert cliente.get(f"/servicios/{servicio}").status_code == 404


def test_cabeceras_de_seguridad(cliente):
    r = cliente.get("/")
    assert r.headers["X-Content-Type-Options"] == "nosniff"
    assert r.headers["X-Frame-Options"] == "DENY"
    assert "frame-ancestors 'none'" in r.headers["Content-Security-Policy"]
    h = registrar(cliente, "ana@test.co")
    assert cliente.get("/usuarios/me", headers=h).headers["Cache-Control"] == "no-store"


def test_cors_rechaza_otros_sitios(cliente):
    r = cliente.options("/sesion", headers={"Origin": "https://sitio-malo.example",
                                             "Access-Control-Request-Method": "POST"})
    assert r.headers.get("access-control-allow-origin") != "https://sitio-malo.example"
