"""Esquemas de Pydantic: validan lo que entra y dan forma a lo que sale.

Si un dato no cumple (por ejemplo, 6 estrellas o un correo mal escrito),
FastAPI responde 422 solo, antes de tocar la base de datos.
"""
from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, EmailStr, Field

from .datos_iniciales import ZONAS

Zona = Literal[tuple(ZONAS)]  # solo se aceptan los municipios de la lista


class UsuarioCrear(BaseModel):
    nombre: str = Field(min_length=3, max_length=100)
    correo: EmailStr
    telefono: str = Field(pattern=r"^3\d{9}$", description="Celular colombiano de 10 dígitos")
    contrasena: str = Field(min_length=8, max_length=72)
    acepta_tratamiento_datos: bool = Field(description="Autorización de la Ley 1581 de 2012")


class PerfilTrabajador(BaseModel):
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


class ServicioCrear(BaseModel):
    categoria_id: int
    titulo: str = Field(min_length=5, max_length=120)
    descripcion: str = Field(min_length=10, max_length=1000)
    precio_desde: int = Field(ge=0, le=50_000_000)
    tiempo_estimado: str = Field(min_length=2, max_length=60)


class ServicioEditar(BaseModel):
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


class Resena(BaseModel):
    estrellas: int = Field(ge=1, le=5)
    comentario: str = Field(min_length=3, max_length=500)


class ResenaSalida(BaseModel):
    estrellas: int
    comentario: str | None
    fecha: datetime
    cliente: str


class PerfilTrabajadorSalida(BaseModel):
    trabajador: UsuarioPublico
    reputacion: Reputacion
    servicios: list[ServicioSalida]
    resenas: list[ResenaSalida]


class PedidoCrear(BaseModel):
    servicio_id: int


class CambioEstado(BaseModel):
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
