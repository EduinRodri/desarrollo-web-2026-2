"""Límites de uso guardados en la base de datos (OWASP API4 y API6).

Se guardan en la base porque en Vercel cada petición puede caer en una instancia distinta y la
memoria no se comparte. Cada evento guarda solo una huella SHA-256 (ni correo ni IP en claro).

Reglas:
- Inicio de sesión: 5 fallos por correo y 20 por IP en 15 minutos (muchos celulares comparten IP).
- Registro: 5 cuentas nuevas por IP por hora (evita la creación masiva de cuentas falsas).
- Pedidos: 10 por cuenta por hora (evita llenar de pedidos falsos la bandeja de un trabajador).
"""
import hashlib
import os
from datetime import datetime, timedelta, timezone

from fastapi import HTTPException, Request, status
from sqlalchemy import delete, func, select
from sqlalchemy.orm import Session

from .models import IntentoSesion

VENTANA = timedelta(minutes=15)  # inicio de sesión
MAX_POR_CORREO = 5
MAX_POR_IP = 20
VENTANA_LARGA = timedelta(hours=1)  # registro y pedidos
MAX_REGISTROS_POR_IP = 5
MAX_PEDIDOS_POR_CUENTA = 10


def _huella(texto: str) -> str:
    return hashlib.sha256(texto.encode()).hexdigest()


def _ahora() -> datetime:
    return datetime.now(timezone.utc)


def ip_del_cliente(request: Request) -> str:
    """En Vercel, la IP real llega en X-Forwarded-For y Vercel sobrescribe esa cabecera
    (no se puede falsificar desde el navegador). Fuera de Vercel no se confía en ella."""
    if os.getenv("VERCEL"):
        reenviada = request.headers.get("x-forwarded-for", "")
        if reenviada:
            return reenviada.split(",")[0].strip()
    return request.client.host if request.client else "desconocida"


def _limpiar_viejos(db: Session) -> None:
    """Borra lo que ya salió de la ventana más larga: la tabla no crece sin fin."""
    db.execute(delete(IntentoSesion).where(IntentoSesion.fecha < _ahora() - VENTANA_LARGA))


def _exigir(db: Session, texto: str, maximo: int, ventana: timedelta, mensaje: str) -> None:
    eventos = db.scalar(
        select(func.count()).select_from(IntentoSesion).where(
            IntentoSesion.clave == _huella(texto), IntentoSesion.fecha >= _ahora() - ventana
        )
    )
    if eventos >= maximo:
        raise HTTPException(
            status.HTTP_429_TOO_MANY_REQUESTS,
            mensaje,
            headers={"Retry-After": str(int(ventana.total_seconds()))},
        )


def _anotar(db: Session, *textos: str) -> None:
    db.add_all(IntentoSesion(clave=_huella(t)) for t in textos)
    db.commit()


# ---------- Inicio de sesión ----------
def revisar(db: Session, correo: str, ip: str) -> None:
    """Se llama ANTES de comparar la contraseña, para no gastar bcrypt en un ataque."""
    _limpiar_viejos(db)
    db.commit()
    mensaje = "Demasiados intentos fallidos. Espera 15 minutos e intenta de nuevo."
    _exigir(db, f"correo:{correo.lower()}", MAX_POR_CORREO, VENTANA, mensaje)
    _exigir(db, f"ip:{ip}", MAX_POR_IP, VENTANA, mensaje)


def anotar_fallo(db: Session, correo: str, ip: str) -> None:
    _anotar(db, f"correo:{correo.lower()}", f"ip:{ip}")


def limpiar_correo(db: Session, correo: str) -> None:
    """Al entrar bien, se borran los fallos de ese correo (los de la IP se quedan)."""
    db.execute(delete(IntentoSesion).where(IntentoSesion.clave == _huella(f"correo:{correo.lower()}")))
    db.commit()


# ---------- Registro y pedidos ----------
def revisar_registro(db: Session, ip: str) -> None:
    _exigir(db, f"registro:{ip}", MAX_REGISTROS_POR_IP, VENTANA_LARGA,
            "Se crearon demasiadas cuentas desde esta conexión. Intenta de nuevo en una hora.")


def anotar_registro(db: Session, ip: str) -> None:
    _anotar(db, f"registro:{ip}")


def revisar_pedido(db: Session, usuario_id: int) -> None:
    _exigir(db, f"pedido:{usuario_id}", MAX_PEDIDOS_POR_CUENTA, VENTANA_LARGA,
            "Hiciste muchos pedidos en poco tiempo. Intenta de nuevo en una hora.")


def anotar_pedido(db: Session, usuario_id: int) -> None:
    _anotar(db, f"pedido:{usuario_id}")
