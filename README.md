# Camellapp — Desarrollo de aplicaciones web 2026-2 (Ibero)

Aplicación web para encontrar, contratar y calificar trabajadores de oficios presenciales en Malambo y el
área metropolitana de Barranquilla. Actividad 4 de la electiva (continuación de la propuesta de la Act. 2).

**Equipo:** Eduin Rodríguez · Guillermo Andrés Carrillo Sánchez · Nicolás Jaiquel Rubio.

| Parte | Tecnología | Carpeta |
|---|---|---|
| Back-end (API REST + Swagger) | Python, FastAPI, SQLAlchemy, PostgreSQL (SQLite en local) | `backend/` |
| Front-end | React (hooks, Context API, Axios, React Router) | `frontend/` (en construcción) |
| Despliegue | Vercel (front y API) + Neon (PostgreSQL) | — |

## Correr el back-end en local
Requiere [uv](https://docs.astral.sh/uv/).

```bash
cd backend
uv sync
uv run uvicorn app.main:app --reload   # Swagger en http://localhost:8000/docs
uv run pytest -v                       # 16 pruebas
```

Variables de entorno (producción): `DATABASE_URL` (Neon), `JWT_SECRET`, `FRONTEND_ORIGINS`.

## Requisitos de la propuesta cubiertos por la API
| RF | Qué hace | Endpoint |
|---|---|---|
| RF1 | Registro e inicio de sesión (JWT, contraseña con hash bcrypt) | `POST /usuarios`, `POST /sesion` |
| RF2 | Activar y editar el perfil de trabajador | `PUT /usuarios/me/trabajador` |
| RF3 | Publicar y editar servicios | `POST /servicios`, `PATCH /servicios/{id}` |
| RF4 | Buscar por oficio, zona y texto | `GET /servicios?categoria_id=&zona=&q=` |
| RF5 | Pedir un servicio | `POST /pedidos` |
| RF6 | Aceptar, rechazar, terminar o cancelar | `PATCH /pedidos/{id}` |
| RF7 | Calificar (solo el cliente, solo terminado, una vez) | `PATCH /pedidos/{id}/resena` |
| RF8 | Nivel: Nuevo → Nivel 1 → Recomendado | calculado en cada respuesta |
| RF9 | Reporte para el equipo | `GET /reportes` |
