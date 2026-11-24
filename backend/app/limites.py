"""Límite de intentos fallidos de inicio de sesión, guardado en la base de datos.

Regla: en una ventana de 15 minutos, como máximo 5 fallos por correo y 20 por IP.
La IP tiene un tope más alto porque muchos celulares comparten la misma IP pública del operador.
"""
import hashlib
import os
from datetime import datetime, timedelta, timezone

from fastapi import HTTPException, Request, status
from sqlalchemy import delete, func, select
from sqlalchemy.orm import Session

from .models import IntentoSesion

VENTANA = timedelta(minutes=15)
MAX_POR_CORREO = 5
MAX_POR_IP = 20


def _huella(texto: str) -> str:
    return hashlib.sha256(texto.encode()).hexdigest()


def ip_del_cliente(request: Request) -> str:
    """En Vercel, la IP real llega en X-Forwarded-For y Vercel sobrescribe esa cabecera
    (no se puede falsificar desde el navegador). Fuera de Vercel no se confía en ella."""
    if os.getenv("VERCEL"):
        reenviada = request.headers.get("x-forwarded-for", "")
        if reenviada:
            return reenviada.split(",")[0].strip()
    return request.client.host if request.client else "desconocida"


def _claves(correo: str, ip: str) -> tuple[str, str]:
    return _huella(f"correo:{correo.lower()}"), _huella(f"ip:{ip}")


def _ahora() -> datetime:
    return datetime.now(timezone.utc)


def revisar(db: Session, correo: str, ip: str) -> None:
    """Lanza 429 si el correo o la IP ya superaron el límite. Se llama ANTES de comparar la
    contraseña, para no gastar el cálculo de bcrypt en un ataque."""
    desde = _ahora() - VENTANA
    # Limpieza barata: borra lo que ya salió de la ventana (la tabla no crece sin fin).
    db.execute(delete(IntentoSesion).where(IntentoSesion.fecha < desde))
    db.commit()
    clave_correo, clave_ip = _claves(correo, ip)
    for clave, maximo in ((clave_correo, MAX_POR_CORREO), (clave_ip, MAX_POR_IP)):
        fallos = db.scalar(
            select(func.count()).select_from(IntentoSesion).where(IntentoSesion.clave == clave)
        )
        if fallos >= maximo:
            raise HTTPException(
                status.HTTP_429_TOO_MANY_REQUESTS,
                "Demasiados intentos fallidos. Espera 15 minutos e intenta de nuevo.",
                headers={"Retry-After": str(int(VENTANA.total_seconds()))},
            )


def anotar_fallo(db: Session, correo: str, ip: str) -> None:
    clave_correo, clave_ip = _claves(correo, ip)
    db.add_all([IntentoSesion(clave=clave_correo), IntentoSesion(clave=clave_ip)])
    db.commit()


def limpiar_correo(db: Session, correo: str) -> None:
    """Al entrar bien, se borran los fallos de ese correo (los de la IP se quedan)."""
    clave_correo, _ = _claves(correo, "")
    db.execute(delete(IntentoSesion).where(IntentoSesion.clave == clave_correo))
    db.commit()
