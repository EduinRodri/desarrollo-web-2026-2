"""RF9: reporte para el equipo del emprendimiento."""
from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Categoria, EstadoPedido, Pedido, Servicio, Usuario
from ..schemas import Reporte
from ..seguridad import solo_admin

router = APIRouter(tags=["Reportes"])


@router.get("/reportes", response_model=Reporte)
def reporte(_: Usuario = Depends(solo_admin), db: Session = Depends(get_db)):
    """Pedidos por oficio y por zona, y trabajadores con promedio menor que 3.

    Todo se agrupa y se cuenta en la base de datos (GROUP BY), no en Python.
    """
    por_oficio = db.execute(
        select(Categoria.nombre, func.count(Pedido.id))
        .join(Servicio, Servicio.categoria_id == Categoria.id)
        .join(Pedido, Pedido.servicio_id == Servicio.id)
        .group_by(Categoria.nombre)
        .order_by(func.count(Pedido.id).desc())
    ).all()
    por_zona = db.execute(
        select(Usuario.zona, func.count(Pedido.id))
        .join(Servicio, Servicio.trabajador_id == Usuario.id)
        .join(Pedido, Pedido.servicio_id == Servicio.id)
        .group_by(Usuario.zona)
        .order_by(func.count(Pedido.id).desc())
    ).all()
    promedio = func.avg(Pedido.estrellas)
    bajos = db.execute(
        select(Usuario.id, Usuario.nombre, promedio, func.count(Pedido.estrellas))
        .join(Servicio, Servicio.trabajador_id == Usuario.id)
        .join(Pedido, Pedido.servicio_id == Servicio.id)
        .where(Pedido.estado == EstadoPedido.terminado.value, Pedido.estrellas.is_not(None))
        .group_by(Usuario.id, Usuario.nombre)
        .having(promedio < 3)
    ).all()
    return {
        "pedidos_por_oficio": [{"oficio": n, "pedidos": c} for n, c in por_oficio],
        "pedidos_por_zona": [{"zona": z, "pedidos": c} for z, c in por_zona],
        "trabajadores_promedio_bajo": [
            {"id": i, "nombre": n, "promedio": round(float(p), 2), "resenas": c} for i, n, p, c in bajos
        ],
    }
