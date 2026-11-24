"""Punto de entrada de la API de Camellapp.

Swagger (documentación interactiva): /docs · Esquema OpenAPI: /openapi.json
"""
import logging
import os
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy import select
from sqlalchemy.exc import DataError, IntegrityError, OperationalError

from .database import Base, SessionLocal, engine
from .datos_iniciales import OFICIOS
from .models import Categoria
from .routers import pedidos, reportes, servicios, usuarios

log = logging.getLogger("camellapp")


def preparar_base_de_datos() -> None:
    """Crea las tablas si no existen y carga los 43 oficios la primera vez."""
    Base.metadata.create_all(engine)
    with SessionLocal() as db:
        if db.scalar(select(Categoria.id).limit(1)) is None:
            db.add_all(
                Categoria(nombre=nombre, grupo=grupo)
                for grupo, nombres in OFICIOS.items()
                for nombre in nombres
            )
            db.commit()


@asynccontextmanager
async def ciclo_de_vida(_: FastAPI):
    preparar_base_de_datos()
    # En producción la demo se carga sola (una vez) si DEMO_AUTOCARGA=1: nadie tiene que manejar la cadena de la base.
    if os.getenv("DEMO_AUTOCARGA") == "1":
        from .demo import cargar
        if cargar(con_admin=False):
            log.info("Datos de demostración cargados")
    yield


app = FastAPI(
    title="Camellapp API",
    version="1.0.0",
    description=(
        "API REST de Camellapp: trabajadores de oficios presenciales de Malambo y el área "
        "metropolitana de Barranquilla publican servicios; los clientes los piden y los califican.\n\n"
        "Para probar las rutas protegidas: crea una cuenta en **POST /usuarios** y luego usa el botón "
        "**Authorize** con tu correo y contraseña."
    ),
    lifespan=ciclo_de_vida,
)

# CORS: qué páginas web pueden llamar a esta API desde el navegador.
origenes = os.getenv("FRONTEND_ORIGINS", "http://localhost:5173").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in origenes if o.strip()],
    # Solo lo que el front usa de verdad (mínimo privilegio): nada de DELETE ni cabeceras raras.
    allow_methods=["GET", "POST", "PUT", "PATCH"],
    allow_headers=["Authorization", "Content-Type"],
)


@app.middleware("http")
async def cabeceras_de_seguridad(request: Request, call_next):
    """Cabeceras que le dicen al navegador cómo tratar las respuestas de la API (OWASP A02)."""
    respuesta = await call_next(request)
    h = respuesta.headers
    h["X-Content-Type-Options"] = "nosniff"  # el navegador no "adivina" el tipo: JSON es JSON
    h["X-Frame-Options"] = "DENY"  # nadie puede meter la API en un <iframe>
    h["Referrer-Policy"] = "no-referrer"
    h["Cross-Origin-Opener-Policy"] = "same-origin"
    h["Cross-Origin-Resource-Policy"] = "same-site"
    if request.url.path in ("/docs", "/redoc"):
        # Swagger carga sus archivos desde un CDN: se le permite solo eso.
        h["Content-Security-Policy"] = (
            "default-src 'self'; script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; "
            "style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; img-src 'self' data: https://fastapi.tiangolo.com; "
            "frame-ancestors 'none'"
        )
    else:
        h["Content-Security-Policy"] = "default-src 'none'; frame-ancestors 'none'"
    # Lo que lleva datos de una cuenta no se guarda en cachés intermedias ni en el navegador.
    if "authorization" in request.headers or request.url.path == "/sesion":
        h["Cache-Control"] = "no-store"
    return respuesta


# --- Gestión de errores: toda falla responde con JSON y un mensaje entendible ---
@app.exception_handler(IntegrityError)
async def error_de_integridad(_: Request, exc: IntegrityError):
    log.warning("Violación de integridad: %s", exc.orig)
    return JSONResponse(
        status_code=status.HTTP_409_CONFLICT,
        content={"detail": "Los datos chocan con un registro existente o violan una regla de la base de datos."},
    )


@app.exception_handler(DataError)
async def dato_fuera_de_rango(_: Request, exc: DataError):
    # p. ej. /pedidos/99999999999999999999: la base no lo acepta como número; no es un error 500.
    log.warning("Dato fuera de rango: %s", exc.orig)
    return JSONResponse(status_code=status.HTTP_400_BAD_REQUEST, content={"detail": "Algún dato está fuera de rango."})


@app.exception_handler(OperationalError)
async def base_no_disponible(_: Request, exc: OperationalError):
    log.error("Base de datos no disponible: %s", exc)
    return JSONResponse(
        status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
        content={"detail": "La base de datos no responde. Intenta de nuevo en unos segundos."},
    )


@app.exception_handler(Exception)
async def error_inesperado(_: Request, exc: Exception):
    log.exception("Error no controlado")
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "Ocurrió un error inesperado. Ya quedó registrado."},
    )


@app.get("/", tags=["Estado"])
def estado():
    return {"app": "Camellapp API", "estado": "ok", "documentacion": "/docs"}


app.include_router(usuarios.router)
app.include_router(servicios.router)
app.include_router(pedidos.router)
app.include_router(reportes.router)
