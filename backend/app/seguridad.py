"""Contraseñas con hash (bcrypt) e inicio de sesión con token JWT."""
import hashlib
import hmac
import os
from datetime import datetime, timedelta, timezone

import bcrypt
import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from .database import get_db
from .models import Usuario

def _clave_secreta() -> str:
    """Clave para firmar los tokens de sesión.

    1) Si existe JWT_SECRET, se usa esa.
    2) Si no, en producción se DERIVA de la cadena de conexión de la base (que ya es secreta y la
       guarda Vercel): nadie tiene que generar ni copiar una clave a mano.
    3) Nunca se usa la clave de desarrollo en producción: es pública en el repositorio.
    """
    if os.getenv("JWT_SECRET"):
        if len(os.environ["JWT_SECRET"]) < 32:  # RFC 7518: HS256 pide claves de al menos 32 bytes
            raise RuntimeError("JWT_SECRET debe tener al menos 32 caracteres.")
        return os.environ["JWT_SECRET"]
    url = os.getenv("DATABASE_URL", "")
    if url and not url.startswith("sqlite"):
        return hmac.new(url.encode(), b"camellapp-jwt-v1", hashlib.sha256).hexdigest()
    if os.getenv("VERCEL"):
        raise RuntimeError("En producción hace falta DATABASE_URL o JWT_SECRET.")
    return "solo-para-desarrollo-local-nunca-en-produccion"


CLAVE_SECRETA = _clave_secreta()
ALGORITMO = "HS256"
HORAS_DE_SESION = 8

# Le dice a Swagger dónde se pide el token (botón "Authorize").
oauth2 = OAuth2PasswordBearer(tokenUrl="/sesion")


def hashear(contrasena: str) -> str:
    return bcrypt.hashpw(contrasena.encode(), bcrypt.gensalt()).decode()


def verificar(contrasena: str, hash_guardado: str) -> bool:
    return bcrypt.checkpw(contrasena.encode(), hash_guardado.encode())


def crear_token(usuario_id: int) -> str:
    vence = datetime.now(timezone.utc) + timedelta(hours=HORAS_DE_SESION)
    return jwt.encode({"sub": str(usuario_id), "exp": vence}, CLAVE_SECRETA, algorithm=ALGORITMO)


def usuario_actual(token: str = Depends(oauth2), db: Session = Depends(get_db)) -> Usuario:
    """Dependencia: lee el token del encabezado Authorization y devuelve el usuario."""
    error = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Sesión inválida o vencida. Inicia sesión de nuevo.",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        datos = jwt.decode(token, CLAVE_SECRETA, algorithms=[ALGORITMO])
        usuario = db.get(Usuario, int(datos["sub"]))
    except (jwt.PyJWTError, KeyError, ValueError):
        raise error
    if usuario is None:
        raise error
    return usuario


def solo_trabajador(usuario: Usuario = Depends(usuario_actual)) -> Usuario:
    if not usuario.es_trabajador:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Primero activa tu perfil de trabajador.")
    return usuario


# El equipo del emprendimiento se define por correo (variable ADMIN_CORREOS, separados por coma).
# Así no hay una cuenta de administrador con contraseña compartida o publicada.
ADMIN_CORREOS = {c.strip().lower() for c in os.getenv("ADMIN_CORREOS", "").split(",") if c.strip()}


def es_correo_admin(correo: str) -> bool:
    return correo.lower() in ADMIN_CORREOS


def solo_admin(usuario: Usuario = Depends(usuario_actual)) -> Usuario:
    if not usuario.es_admin:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Solo el equipo de Camellapp ve los reportes.")
    return usuario
