"""RF3 (publicar servicios) y RF4 (buscar por oficio y zona)."""
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from ..database import get_db
from ..datos_iniciales import ZONAS
from ..models import Categoria, Servicio, Usuario
from ..reputacion import reputaciones
from ..schemas import IdRuta, CategoriaSalida, ServicioCrear, ServicioEditar, ServicioSalida
from ..seguridad import sin_cuenta_demo, solo_trabajador

router = APIRouter(tags=["Servicios"])


def con_reputacion(db: Session, servicios: list[Servicio]) -> list[ServicioSalida]:
    """Agrega a cada servicio la reputación de su trabajador (una sola consulta para todos)."""
    reps = reputaciones(db, {s.trabajador_id for s in servicios})
    salida = []
    for s in servicios:
        item = ServicioSalida.model_validate(s)
        item.reputacion = reps[s.trabajador_id]
        salida.append(item)
    return salida


@router.get("/categorias", response_model=list[CategoriaSalida])
def listar_categorias(db: Session = Depends(get_db)):
    return db.scalars(select(Categoria).order_by(Categoria.grupo, Categoria.nombre)).all()


@router.get("/zonas", response_model=list[str])
def listar_zonas():
    return ZONAS


@router.get("/servicios", response_model=list[ServicioSalida])
def buscar_servicios(
    categoria_id: int | None = Query(default=None, ge=1, le=2_147_483_647),
    grupo: str | None = Query(default=None, max_length=60, description="Grupo de oficios, p. ej. «Vehículos»"),
    zona: str | None = None,
    q: str | None = Query(default=None, max_length=60, description="Texto en el título"),
    limite: int = Query(default=20, ge=1, le=50),
    desde: int = Query(default=0, ge=0, le=10_000),
    db: Session = Depends(get_db),
):
    """Busca servicios activos por oficio, zona y texto, con paginación (RF4)."""
    if zona is not None and zona not in ZONAS:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, f"Zona no válida. Usa una de: {', '.join(ZONAS)}.")
    consulta = (
        select(Servicio)
        .join(Servicio.trabajador)
        # selectinload trae categorías y trabajadores en 2 consultas, no una por servicio.
        .options(selectinload(Servicio.categoria), selectinload(Servicio.trabajador))
        .where(Servicio.activo.is_(True))
    )
    if categoria_id is not None:
        consulta = consulta.where(Servicio.categoria_id == categoria_id)
    if grupo:
        consulta = consulta.join(Servicio.categoria).where(Categoria.grupo == grupo)
    if zona is not None:
        consulta = consulta.where(Usuario.zona == zona)
    if q:
        consulta = consulta.where(Servicio.titulo.ilike(f"%{q.strip()}%"))
    servicios = db.scalars(consulta.order_by(Servicio.id.desc()).offset(desde).limit(limite)).all()
    return con_reputacion(db, servicios)


@router.get("/servicios/mios", response_model=list[ServicioSalida])
def mis_servicios(usuario: Usuario = Depends(solo_trabajador), db: Session = Depends(get_db)):
    servicios = db.scalars(
        select(Servicio)
        .options(selectinload(Servicio.categoria), selectinload(Servicio.trabajador))
        .where(Servicio.trabajador_id == usuario.id)
        .order_by(Servicio.id.desc())
        .limit(100)  # tope: nadie necesita ver más de 100 servicios propios de una vez
    ).all()
    return con_reputacion(db, servicios)


@router.get("/servicios/{servicio_id}", response_model=ServicioSalida)
def ver_servicio(servicio_id: IdRuta, db: Session = Depends(get_db)):
    servicio = db.get(Servicio, servicio_id)
    # Un servicio pausado no se muestra al público (su dueño lo ve en /servicios/mios).
    if servicio is None or not servicio.activo:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "No existe ese servicio.")
    return con_reputacion(db, [servicio])[0]


@router.post("/servicios", response_model=ServicioSalida, status_code=status.HTTP_201_CREATED)
def publicar_servicio(
    datos: ServicioCrear,
    usuario: Usuario = Depends(solo_trabajador),
    _: Usuario = Depends(sin_cuenta_demo),
    db: Session = Depends(get_db),
):
    """Publica un servicio con precio de referencia y tiempo estimado (RF3)."""
    if db.get(Categoria, datos.categoria_id) is None:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "La categoría no existe.")
    servicio = Servicio(trabajador_id=usuario.id, **datos.model_dump())
    db.add(servicio)
    db.commit()
    db.refresh(servicio)
    return con_reputacion(db, [servicio])[0]


@router.patch("/servicios/{servicio_id}", response_model=ServicioSalida)
def editar_servicio(
    servicio_id: IdRuta,
    datos: ServicioEditar,
    usuario: Usuario = Depends(solo_trabajador),
    _: Usuario = Depends(sin_cuenta_demo),
    db: Session = Depends(get_db),
):
    servicio = db.get(Servicio, servicio_id)
    if servicio is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "No existe ese servicio.")
    if servicio.trabajador_id != usuario.id:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Solo puedes editar tus propios servicios.")
    for campo, valor in datos.model_dump(exclude_unset=True).items():
        setattr(servicio, campo, valor)
    db.commit()
    return con_reputacion(db, [servicio])[0]
