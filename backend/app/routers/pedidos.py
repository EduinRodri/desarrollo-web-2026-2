"""RF5 (pedir), RF6 (estados del pedido) y RF7 (calificar)."""
from typing import Literal

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from ..database import get_db
from ..models import EstadoPedido, Pedido, Servicio, Usuario
from ..reputacion import reputaciones
from ..schemas import CambioEstado, PedidoCrear, PedidoSalida, Resena, ServicioSalida
from ..seguridad import usuario_actual

router = APIRouter(prefix="/pedidos", tags=["Pedidos y reseñas"])

# Máquina de estados: desde cada estado, a cuáles se puede pasar y quién puede hacerlo.
TRANSICIONES: dict[str, dict[str, set[str]]] = {
    "pendiente": {"aceptado": {"trabajador"}, "rechazado": {"trabajador"}, "cancelado": {"cliente", "trabajador"}},
    "aceptado": {"terminado": {"trabajador"}, "cancelado": {"cliente", "trabajador"}},
    "rechazado": {},
    "terminado": {},
    "cancelado": {},
}


def _salida(db: Session, pedidos: list[Pedido]) -> list[PedidoSalida]:
    reps = reputaciones(db, {p.servicio.trabajador_id for p in pedidos})
    salida = []
    for p in pedidos:
        item = PedidoSalida.model_validate(p)
        item.servicio = ServicioSalida.model_validate(p.servicio)
        item.servicio.reputacion = reps[p.servicio.trabajador_id]
        salida.append(item)
    return salida


def _cargar(db: Session, pedido_id: int) -> Pedido:
    pedido = db.get(Pedido, pedido_id)
    if pedido is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "No existe ese pedido.")
    return pedido


@router.post("", response_model=PedidoSalida, status_code=status.HTTP_201_CREATED)
def pedir_servicio(datos: PedidoCrear, usuario: Usuario = Depends(usuario_actual), db: Session = Depends(get_db)):
    """El cliente pide un servicio; el pedido nace en estado «pendiente» (RF5)."""
    servicio = db.get(Servicio, datos.servicio_id)
    if servicio is None or not servicio.activo:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Ese servicio no existe o no está disponible.")
    if servicio.trabajador_id == usuario.id:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "No puedes pedir tu propio servicio.")
    pedido = Pedido(servicio_id=servicio.id, cliente_id=usuario.id)
    db.add(pedido)
    db.commit()
    db.refresh(pedido)
    return _salida(db, [pedido])[0]


@router.get("", response_model=list[PedidoSalida])
def mis_pedidos(
    como: Literal["cliente", "trabajador"] = Query(default="cliente"),
    usuario: Usuario = Depends(usuario_actual),
    db: Session = Depends(get_db),
):
    """Pedidos que hice (como cliente) o que me hicieron (como trabajador)."""
    consulta = select(Pedido).options(
        selectinload(Pedido.servicio).selectinload(Servicio.categoria),
        selectinload(Pedido.servicio).selectinload(Servicio.trabajador),
        selectinload(Pedido.cliente),
    )
    if como == "cliente":
        consulta = consulta.where(Pedido.cliente_id == usuario.id)
    else:
        consulta = consulta.join(Servicio).where(Servicio.trabajador_id == usuario.id)
    return _salida(db, db.scalars(consulta.order_by(Pedido.fecha.desc())).all())


@router.patch("/{pedido_id}", response_model=PedidoSalida)
def cambiar_estado(
    pedido_id: int,
    cambio: CambioEstado,
    usuario: Usuario = Depends(usuario_actual),
    db: Session = Depends(get_db),
):
    """Aceptar, rechazar, terminar o cancelar, según quién eres y el estado actual (RF6)."""
    pedido = _cargar(db, pedido_id)
    if usuario.id == pedido.servicio.trabajador_id:
        rol = "trabajador"
    elif usuario.id == pedido.cliente_id:
        rol = "cliente"
    else:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Este pedido no es tuyo.")

    permitidos = TRANSICIONES[pedido.estado]
    if cambio.estado not in permitidos:
        raise HTTPException(
            status.HTTP_409_CONFLICT,
            f"Un pedido {pedido.estado} no puede pasar a {cambio.estado}.",
        )
    if rol not in permitidos[cambio.estado]:
        raise HTTPException(status.HTTP_403_FORBIDDEN, f"El {rol} no puede marcar el pedido como {cambio.estado}.")

    pedido.estado = cambio.estado
    db.commit()
    return _salida(db, [pedido])[0]


@router.patch("/{pedido_id}/resena", response_model=PedidoSalida)
def calificar(
    pedido_id: int,
    resena: Resena,
    usuario: Usuario = Depends(usuario_actual),
    db: Session = Depends(get_db),
):
    """Calificar de 1 a 5, solo el cliente, solo con el pedido terminado y una sola vez (RF7)."""
    pedido = _cargar(db, pedido_id)
    if pedido.cliente_id != usuario.id:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Solo el cliente de este pedido puede calificarlo.")
    if pedido.estado != EstadoPedido.terminado.value:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Solo se califica un pedido terminado.")
    if pedido.estrellas is not None:
        raise HTTPException(status.HTTP_409_CONFLICT, "Este pedido ya tiene reseña.")
    pedido.estrellas = resena.estrellas
    pedido.comentario = resena.comentario.strip()
    db.commit()
    return _salida(db, [pedido])[0]
