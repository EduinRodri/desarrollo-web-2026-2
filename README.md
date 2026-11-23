# Camellapp — Desarrollo de aplicaciones web 2026-2 (Ibero)

Aplicación web para encontrar, contratar y calificar trabajadores de oficios presenciales en Malambo y el
área metropolitana de Barranquilla. Actividad 4 de la electiva (continuación de la propuesta de la Act. 2).

**Equipo:** Eduin Rodríguez · Guillermo Andrés Carrillo Sánchez · Nicolás Jaiquel Rubio.

| Parte | Tecnología | Carpeta |
|---|---|---|
| Back-end (API REST + Swagger) | Python, FastAPI, SQLAlchemy, PostgreSQL (SQLite en local) | `backend/` |
| Front-end | React 19 + Vite (hooks, Context API, Axios, React Router) | `frontend/` |
| Marca y sistema de diseño | Tokens CSS, Figtree, Lucide, assets SVG propios | [`docs/marca.md`](docs/marca.md) · en la app: `/marca` |
| Despliegue | Vercel (front y API) + Neon (PostgreSQL) | — |

## Correr el back-end en local
Requiere [uv](https://docs.astral.sh/uv/).

```bash
cd backend
uv sync
uv run uvicorn app.main:app --reload   # Swagger en http://localhost:8000/docs
uv run pytest -v                       # 16 pruebas
```

## Correr el front-end en local
Requiere Node 20+ y pnpm. Con el back-end corriendo en el puerto 8000:

```bash
cd frontend
pnpm install
pnpm dev        # http://localhost:5173
```

## Datos de demostración
`cd backend && uv run python -m app.demo` carga trabajadores, servicios y reseñas ficticios.
Contraseña de todas las cuentas: `demo12345` (cliente: `cliente1@demo.co`, trabajador: `trabajador1@demo.co`,
equipo/reportes: `admin@camellapp.co`; en producción su clave es otra y no es pública).

Variables de entorno (producción): `DATABASE_URL` (la pone la integración de Neon), `JWT_SECRET` (secreta), `FRONTEND_ORIGINS` (dirección del front), `ADMIN_CORREOS` (correos del equipo, separados por coma) y `DEMO_AUTOCARGA=1` (carga la demo al arrancar, sin administrador).

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
