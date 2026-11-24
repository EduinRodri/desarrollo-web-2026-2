"""RF1 (registro e inicio de sesión) y RF2 (perfil de trabajador)."""
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from .. import limites
from ..database import get_db
from ..models import EstadoPedido, Pedido, Servicio, Usuario
from ..reputacion import reputaciones
from ..schemas import (
    PerfilTrabajador,
    PerfilTrabajadorSalida,
    ResenaSalida,
    Token,
    UsuarioCrear,
    UsuarioPrivado,
)
from ..seguridad import crear_token, es_correo_admin, hashear, usuario_actual, verificar
from .servicios import con_reputacion

router = APIRouter(tags=["Usuarios y sesión"])


@router.post("/usuarios", response_model=UsuarioPrivado, status_code=status.HTTP_201_CREATED)
def registrarse(datos: UsuarioCrear, db: Session = Depends(get_db)):
    """Crea una cuenta. Toda cuenta puede pedir servicios (RF1)."""
    if not datos.acepta_tratamiento_datos:
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST,
            "Debes autorizar el tratamiento de tus datos (Ley 1581 de 2012) para registrarte.",
        )
    correo = datos.correo.lower()
    if db.scalar(select(Usuario.id).where(Usuario.correo == correo)):
        raise HTTPException(status.HTTP_409_CONFLICT, "Ya existe una cuenta con ese correo.")
    usuario = Usuario(
        nombre=datos.nombre.strip(),
        correo=correo,
        telefono=datos.telefono,
        contrasena_hash=hashear(datos.contrasena),
        fecha_autorizacion_datos=datetime.now(timezone.utc),
        es_admin=es_correo_admin(correo),
    )
    db.add(usuario)
    db.commit()
    return usuario


@router.post("/sesion", response_model=Token, responses={429: {"description": "Demasiados intentos fallidos"}})
def iniciar_sesion(
    request: Request,
    form: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db),
):
    """Recibe correo (en el campo `username`) y contraseña; devuelve un token JWT.
    Tras 5 fallos con el mismo correo (o 20 desde la misma IP) en 15 minutos responde 429."""
    correo = form.username.lower()
    ip = limites.ip_del_cliente(request)
    limites.revisar(db, correo, ip)
    usuario = db.scalar(select(Usuario).where(Usuario.correo == correo))
    # Mismo mensaje si falla el correo o la contraseña: no se revela cuál de los dos existe.
    if usuario is None or not verificar(form.password, usuario.contrasena_hash):
        limites.anotar_fallo(db, correo, ip)
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Correo o contraseña incorrectos.")
    limites.limpiar_correo(db, correo)
    if es_correo_admin(usuario.correo) and not usuario.es_admin:  # se agregó a ADMIN_CORREOS después de registrarse
        usuario.es_admin = True
        db.commit()
    return Token(access_token=crear_token(usuario.id), usuario=usuario)


@router.get("/usuarios/me", response_model=UsuarioPrivado)
def mi_cuenta(usuario: Usuario = Depends(usuario_actual)):
    return usuario


@router.put("/usuarios/me/trabajador", response_model=UsuarioPrivado)
def activar_o_editar_perfil(
    datos: PerfilTrabajador,
    usuario: Usuario = Depends(usuario_actual),
    db: Session = Depends(get_db),
):
    """Activa en la misma cuenta el perfil de trabajador, o lo edita (RF2)."""
    usuario.es_trabajador = True
    usuario.descripcion = datos.descripcion.strip()
    usuario.zona = datos.zona
    db.commit()
    return usuario


@router.get("/trabajadores/{trabajador_id}", response_model=PerfilTrabajadorSalida)
def perfil_publico(trabajador_id: int, db: Session = Depends(get_db)):
    """Perfil del trabajador: nivel, servicios activos y reseñas recibidas."""
    trabajador = db.get(Usuario, trabajador_id)
    if trabajador is None or not trabajador.es_trabajador:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "No existe ese trabajador.")
    servicios = db.scalars(
        select(Servicio)
        .options(selectinload(Servicio.categoria), selectinload(Servicio.trabajador))
        .where(Servicio.trabajador_id == trabajador_id, Servicio.activo.is_(True))
        .order_by(Servicio.id)
    ).all()
    resenas = db.scalars(
        select(Pedido)
        .options(selectinload(Pedido.cliente))
        .join(Servicio)
        .where(
            Servicio.trabajador_id == trabajador_id,
            Pedido.estado == EstadoPedido.terminado.value,
            Pedido.estrellas.is_not(None),
        )
        .order_by(Pedido.fecha.desc())
        .limit(20)
    ).all()
    return {
        "trabajador": trabajador,
        "reputacion": reputaciones(db, {trabajador_id})[trabajador_id],
        "servicios": con_reputacion(db, servicios),
        "resenas": [
            ResenaSalida(
                estrellas=p.estrellas,
                comentario=p.comentario,
                fecha=p.fecha,
                cliente=p.cliente.nombre.split()[0],  # solo el primer nombre, por privacidad
            )
            for p in resenas
        ],
    }
