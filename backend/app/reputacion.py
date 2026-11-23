"""Regla de niveles (RF8) y cálculo de la reputación.

El promedio y el número de reseñas los calcula la base de datos con una sola
consulta agrupada (AVG y COUNT), en vez de traer todos los pedidos a Python.
"""
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from .models import EstadoPedido, Pedido, Servicio
from .schemas import Reputacion

MIN_RESENAS_NIVEL_1 = 5
PROMEDIO_RECOMENDADO = 4.5


def calcular_nivel(promedio: float | None, resenas: int) -> str:
    """Nuevo -> Nivel 1 (5 reseñas o más) -> Recomendado (además, promedio >= 4,5)."""
    if resenas < MIN_RESENAS_NIVEL_1:
        return "Nuevo"
    if promedio is not None and promedio >= PROMEDIO_RECOMENDADO:
        return "Recomendado"
    return "Nivel 1"


def reputaciones(db: Session, trabajador_ids: set[int]) -> dict[int, Reputacion]:
    """Reputación de varios trabajadores en UNA consulta (evita el problema N+1)."""
    if not trabajador_ids:
        return {}
    filas = db.execute(
        select(
            Servicio.trabajador_id,
            func.avg(Pedido.estrellas),
            func.count(Pedido.estrellas),
        )
        .join(Pedido, Pedido.servicio_id == Servicio.id)
        .where(
            Servicio.trabajador_id.in_(trabajador_ids),
            Pedido.estado == EstadoPedido.terminado.value,
            Pedido.estrellas.is_not(None),
        )
        .group_by(Servicio.trabajador_id)
    ).all()
    resultado = {tid: Reputacion(promedio=None, resenas=0, nivel="Nuevo") for tid in trabajador_ids}
    for tid, promedio, cantidad in filas:
        promedio = round(float(promedio), 2) if promedio is not None else None
        resultado[tid] = Reputacion(promedio=promedio, resenas=cantidad, nivel=calcular_nivel(promedio, cantidad))
    return resultado
