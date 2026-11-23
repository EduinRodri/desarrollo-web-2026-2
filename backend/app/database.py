"""Conexión a la base de datos.

En local se usa SQLite (un archivo, sin instalar nada). En producción se usa
PostgreSQL (Neon): basta con poner la variable de entorno DATABASE_URL.
"""
import os

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker
from sqlalchemy.pool import NullPool

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./camellapp.db")

# Neon entrega la URL como "postgresql://..."; SQLAlchemy necesita saber que
# el controlador es psycopg (versión 3).
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql+psycopg://", 1)
elif DATABASE_URL.startswith("postgresql://"):
    DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+psycopg://", 1)

if DATABASE_URL.startswith("sqlite"):
    engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
else:
    # En Vercel cada petición puede correr en una instancia distinta: no se
    # guarda un "pool" propio de conexiones (NullPool) y se usa el pooler de Neon.
    engine = create_engine(DATABASE_URL, poolclass=NullPool, pool_pre_ping=True)

SessionLocal = sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)


class Base(DeclarativeBase):
    pass


def get_db():
    """Dependencia de FastAPI: abre una sesión por petición y siempre la cierra."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
