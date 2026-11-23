"""Contraseñas con hash (bcrypt) e inicio de sesión con token JWT."""
import os
from datetime import datetime, timedelta, timezone

import bcrypt
import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from .database import get_db
from .models import Usuario

CLAVE_SECRETA = os.getenv("JWT_SECRET", "solo-para-desarrollo-cambiar-en-produccion")
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


def solo_admin(usuario: Usuario = Depends(usuario_actual)) -> Usuario:
    if not usuario.es_admin:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Solo el equipo de Camellapp ve los reportes.")
    return usuario
