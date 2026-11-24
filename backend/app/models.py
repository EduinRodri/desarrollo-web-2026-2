"""Las 4 tablas del modelo de datos de la propuesta (Act. 2, tabla 3)."""
from datetime import datetime, timezone
from enum import Enum

from sqlalchemy import (
    Boolean,
    CheckConstraint,
    DateTime,
    ForeignKey,
    Integer,
    String,
    Text,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .database import Base


def ahora() -> datetime:
    return datetime.now(timezone.utc)


class EstadoPedido(str, Enum):
    pendiente = "pendiente"
    aceptado = "aceptado"
    rechazado = "rechazado"
    terminado = "terminado"
    cancelado = "cancelado"


class Usuario(Base):
    __tablename__ = "usuarios"

    id: Mapped[int] = mapped_column(primary_key=True)
    nombre: Mapped[str] = mapped_column(String(100))
    correo: Mapped[str] = mapped_column(String(120), unique=True, index=True)
    telefono: Mapped[str] = mapped_column(String(20))
    contrasena_hash: Mapped[str] = mapped_column(String(100))
    fecha_autorizacion_datos: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    es_trabajador: Mapped[bool] = mapped_column(Boolean, default=False)
    es_admin: Mapped[bool] = mapped_column(Boolean, default=False)
    descripcion: Mapped[str | None] = mapped_column(Text, nullable=True)
    zona: Mapped[str | None] = mapped_column(String(40), nullable=True, index=True)

    servicios: Mapped[list["Servicio"]] = relationship(back_populates="trabajador")


class Categoria(Base):
    __tablename__ = "categorias"

    id: Mapped[int] = mapped_column(primary_key=True)
    nombre: Mapped[str] = mapped_column(String(80), unique=True)
    grupo: Mapped[str] = mapped_column(String(60), index=True)


class Servicio(Base):
    __tablename__ = "servicios"

    id: Mapped[int] = mapped_column(primary_key=True)
    trabajador_id: Mapped[int] = mapped_column(ForeignKey("usuarios.id"), index=True)
    categoria_id: Mapped[int] = mapped_column(ForeignKey("categorias.id"), index=True)
    titulo: Mapped[str] = mapped_column(String(120))
    descripcion: Mapped[str] = mapped_column(Text)
    precio_desde: Mapped[int] = mapped_column(Integer)
    tiempo_estimado: Mapped[str] = mapped_column(String(60))
    activo: Mapped[bool] = mapped_column(Boolean, default=True)

    trabajador: Mapped[Usuario] = relationship(back_populates="servicios")
    categoria: Mapped[Categoria] = relationship()

    __table_args__ = (CheckConstraint("precio_desde >= 0", name="precio_no_negativo"),)


class Pedido(Base):
    __tablename__ = "pedidos"

    id: Mapped[int] = mapped_column(primary_key=True)
    servicio_id: Mapped[int] = mapped_column(ForeignKey("servicios.id"), index=True)
    cliente_id: Mapped[int] = mapped_column(ForeignKey("usuarios.id"), index=True)
    fecha: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=ahora)
    estado: Mapped[str] = mapped_column(String(20), default=EstadoPedido.pendiente.value, index=True)
    # La reseña vive dentro del pedido: así hay como máximo UNA reseña por pedido.
    estrellas: Mapped[int | None] = mapped_column(Integer, nullable=True)
    comentario: Mapped[str | None] = mapped_column(Text, nullable=True)

    servicio: Mapped[Servicio] = relationship()
    cliente: Mapped[Usuario] = relationship()

    __table_args__ = (
        CheckConstraint("estrellas IS NULL OR (estrellas BETWEEN 1 AND 5)", name="estrellas_1_a_5"),
    )


class IntentoSesion(Base):
    """Un inicio de sesión fallido. Se guarda en la base porque en Vercel cada petición puede caer
    en una instancia distinta y la memoria no se comparte (OWASP API4: consumo de recursos)."""
    __tablename__ = "intentos_sesion"

    id: Mapped[int] = mapped_column(primary_key=True)
    # Huella SHA-256 de "correo:..." o "ip:...": no se guarda el correo ni la IP en claro (Ley 1581).
    clave: Mapped[str] = mapped_column(String(64), index=True)
    fecha: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=ahora, index=True)
