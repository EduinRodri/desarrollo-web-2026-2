"""Esquemas de Pydantic: validan lo que entra y dan forma a lo que sale.

Si un dato no cumple (por ejemplo, 6 estrellas o un correo mal escrito),
FastAPI responde 422 solo, antes de tocar la base de datos.
"""
from datetime import datetime
from typing import Annotated, Literal

from fastapi import Path

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator, model_validator

from .datos_iniciales import ZONAS

MAX_ID = 2_147_483_647  # el mayor número que cabe en una columna INTEGER de PostgreSQL
IdRuta = Annotated[int, Path(ge=1, le=MAX_ID)]  # para /pedidos/{id}, /servicios/{id}, ...
Zona = Literal[tuple(ZONAS)]  # solo se aceptan los municipios de la lista


class Entrada(BaseModel):
    """Base de todo lo que llega del usuario: quita espacios al inicio y al final ANTES de medir
    el largo (así "   " no pasa como un nombre de 3 letras)."""
    model_config = ConfigDict(str_strip_whitespace=True)


# Contraseñas más usadas en Colombia y el mundo (NIST SP 800-63B rev. 4 exige bloquear las comunes).
CONTRASENAS_COMUNES = {
    "12345678", "123456789", "1234567890", "123456789a", "12345678a", "87654321", "11111111",
    "00000000", "password", "password1", "contraseña", "contrasena", "qwerty123", "qwertyuiop",
    "asdfghjk", "iloveyou", "colombia", "colombia1", "barranquilla", "malambo1", "junior123",
    "camellapp", "camellapp1", "abc12345", "abcd1234", "1q2w3e4r", "q1w2e3r4", "aa123456",
    "demo12345", "admin123", "administrador", "bienvenido", "teamo123", "tequiero",
}
MAX_BYTES_CONTRASENA = 72  # bcrypt solo usa 72 bytes; "ñ" o un emoji ocupan más de 1 byte


class UsuarioCrear(Entrada):
    nombre: str = Field(min_length=3, max_length=100)
    correo: EmailStr
    telefono: str = Field(pattern=r"^3\d{9}$", description="Celular colombiano de 10 dígitos")
    contrasena: str = Field(min_length=8, max_length=72)
    acepta_tratamiento_datos: bool = Field(description="Autorización de la Ley 1581 de 2012")

    @field_validator("nombre")
    @classmethod
    def nombre_sin_suplantacion(cls, v: str) -> str:
        # Nadie puede llamarse "Equipo Camellapp" o "Soporte Camellapp" y dejar reseñas con ese nombre.
        if "camellapp" in v.lower().replace(" ", ""):
            raise ValueError("El nombre no puede incluir «Camellapp».")
        if any(ord(c) < 32 for c in v):
            raise ValueError("El nombre tiene caracteres no válidos.")
        return v

    @model_validator(mode="after")
    def contrasena_robusta(self):
        clave = self.contrasena
        if len(clave.encode()) > MAX_BYTES_CONTRASENA:
            raise ValueError("La contraseña es demasiado larga (máximo 72 bytes; las tildes y emojis ocupan más).")
        if clave.lower() in CONTRASENAS_COMUNES or len(set(clave)) < 3:
            raise ValueError("Esa contraseña es muy común o fácil de adivinar. Usa una frase que solo tú conozcas.")
        usuario_correo = self.correo.split("@")[0].lower()
        if len(usuario_correo) >= 4 and usuario_correo in clave.lower():
            raise ValueError("La contraseña no puede contener tu correo.")
        return self


class PerfilTrabajador(Entrada):
    descripcion: str = Field(min_length=10, max_length=600)
    zona: Zona


class UsuarioPublico(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    nombre: str
    es_trabajador: bool
    descripcion: str | None
    zona: str | None


class UsuarioPrivado(UsuarioPublico):
    correo: str
    telefono: str
    es_admin: bool


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    usuario: UsuarioPrivado


class CategoriaSalida(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    nombre: str
    grupo: str


class ServicioCrear(Entrada):
    categoria_id: int = Field(ge=1, le=MAX_ID)
    titulo: str = Field(min_length=5, max_length=120)
    descripcion: str = Field(min_length=10, max_length=1000)
    precio_desde: int = Field(ge=0, le=50_000_000)
    tiempo_estimado: str = Field(min_length=2, max_length=60)


class ServicioEditar(Entrada):
    titulo: str | None = Field(default=None, min_length=5, max_length=120)
    descripcion: str | None = Field(default=None, min_length=10, max_length=1000)
    precio_desde: int | None = Field(default=None, ge=0, le=50_000_000)
    tiempo_estimado: str | None = Field(default=None, min_length=2, max_length=60)
    activo: bool | None = None


class Reputacion(BaseModel):
    promedio: float | None
    resenas: int
    nivel: str


class ServicioSalida(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    titulo: str
    descripcion: str
    precio_desde: int
    tiempo_estimado: str
    activo: bool
    categoria: CategoriaSalida
    trabajador: UsuarioPublico
    reputacion: Reputacion | None = None


class Resena(Entrada):
    estrellas: int = Field(ge=1, le=5)
    comentario: str = Field(min_length=3, max_length=500)


class ResenaSalida(BaseModel):
    estrellas: int
    comentario: str | None
    fecha: datetime
    cliente: str


class ResenaDestacada(ResenaSalida):
    """Reseña real para la portada: a quién califica y por qué oficio."""
    trabajador_id: int
    trabajador: str
    oficio: str


class PerfilTrabajadorSalida(BaseModel):
    trabajador: UsuarioPublico
    reputacion: Reputacion
    servicios: list[ServicioSalida]
    resenas: list[ResenaSalida]


class PedidoCrear(Entrada):
    servicio_id: int = Field(ge=1, le=MAX_ID)


class CambioEstado(Entrada):
    estado: Literal["aceptado", "rechazado", "terminado", "cancelado"]


class PedidoSalida(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    fecha: datetime
    estado: str
    estrellas: int | None
    comentario: str | None
    servicio: ServicioSalida
    cliente: UsuarioPublico


class Reporte(BaseModel):
    pedidos_por_oficio: list[dict]
    pedidos_por_zona: list[dict]
    trabajadores_promedio_bajo: list[dict]
