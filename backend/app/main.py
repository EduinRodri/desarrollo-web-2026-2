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
from sqlalchemy.exc import IntegrityError, OperationalError

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
    allow_methods=["*"],
    allow_headers=["*"],
)


# --- Gestión de errores: toda falla responde con JSON y un mensaje entendible ---
@app.exception_handler(IntegrityError)
async def error_de_integridad(_: Request, exc: IntegrityError):
    log.warning("Violación de integridad: %s", exc.orig)
    return JSONResponse(
        status_code=status.HTTP_409_CONFLICT,
        content={"detail": "Los datos chocan con un registro existente o violan una regla de la base de datos."},
    )


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
