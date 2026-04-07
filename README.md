# MemoRetos

Sistema educativo interactivo de puzzles matemáticos. Combina un **dashboard web** (Astro + React) para docentes con un **videojuego en Unity** para estudiantes, comunicados a través de una **API REST** en Flask.

---

## Requisitos previos

| Herramienta | Versión mínima | Verificar con |
|---|---|---|
| Python | 3.10+ | `python3 --version` |
| Node.js | 22+ | `node --version` |
| npm | 10+ | `npm --version` |

---

## Instalación

### 1. Clonar el repositorio

```bash
git clone https://github.com/SEBASidkk/MemoRetos.git
cd MemoRetos
```

### 2. Configurar el entorno Python

**Con conda (recomendado):**
```bash
conda create -n memoretos python=3.11 -y
conda activate memoretos
```

**O con venv:**
```bash
python3 -m venv venv
source venv/bin/activate        # macOS / Linux
venv\Scripts\activate           # Windows
```

### 3. Instalar dependencias Python

```bash
pip install -r requirements.txt
```

### 4. Instalar dependencias del frontend

```bash
cd frontend
npm install
cd ..
```

---

## Primer arranque

### 5. Inicializar y poblar la base de datos

Desde la raíz del proyecto:

```bash
python3 seed.py
```

Esto crea `backend/memoretos.db` con:
- 6 usuarios listos para usar
- 3 memoretos publicados
- 1 grupo con estudiantes asignados

Usuarios creados (contraseña para todos: `password123`):

| Usuario | Rol | Score |
|---|---|---|
| `profe_test` | docente | 0 |
| `sebas_cruz` | estudiante | 120 |
| `flor_rh` | estudiante | 4500 |
| `santi_lh` | estudiante | 3200 |
| `xime_cf` | estudiante | 2800 |
| `carlos_gm` | estudiante | 9850 |

---

## Ejecutar el sistema

Se necesitan **dos terminales abiertas en paralelo**.

### Terminal 1 — Backend (API Flask)

```bash
# Desde la raíz del proyecto
conda activate memoretos    # o: source venv/bin/activate
python3 run.py
```

El servidor queda en: `http://127.0.0.1:5000`

Verificar que está corriendo:
```bash
curl http://127.0.0.1:5000/health
# → {"message": "MemoRetos API corriendo ✅", "status": "ok"}
```

### Terminal 2 — Frontend (Dashboard Web)

**Modo desarrollo** (con hot-reload):
```bash
cd frontend
npm run dev
```

**Modo producción** (requiere build previo):
```bash
cd frontend
npm run build
node dist/server/entry.mjs
```

El dashboard queda en: `http://localhost:4321`

Abrir en el navegador e iniciar sesión con `profe_test` / `password123`.

---

## Estructura del proyecto

```
MemoRetos/
├── run.py                  <- Punto de entrada del backend
├── seed.py                 <- Script para poblar la BD con datos de prueba
├── requirements.txt        <- Dependencias Python
├── backend/
│   ├── __init__.py         <- Factory de la app Flask
│   ├── config.py           <- Configuración (BD, JWT, CORS)
│   ├── memoretos.db        <- Base de datos SQLite (se crea con seed.py)
│   └── app/
│       ├── models/
│       │   ├── user.py
│       │   ├── memoreto.py
│       │   ├── game_session.py
│       │   ├── player_answer.py
│       │   └── group.py
│       └── routes/
│           ├── auth.py         /auth/login|register|logout|me
│           ├── game.py         /session/start|end  /game/session/event
│           ├── answers.py      /answers  /answer/history
│           ├── dashboard.py    /dashboard/ranking  /dashboard/stats/...
│           ├── memoretos.py    /memoretos/...
│           ├── groups.py       /groups/...
│           └── graficas.py     /graficas
└── frontend/
    ├── astro.config.mjs
    ├── package.json
    └── src/
        ├── lib/
        │   ├── api.ts          <- Cliente HTTP (llama al backend)
        │   ├── types.ts        <- Interfaces TypeScript compartidas
        │   ├── canvas-utils.ts <- Utilidades del canvas de figuras
        │   ├── solver.ts       <- Solver CSP (backtracking)
        │   └── plotly-theme.ts <- Tema para gráficas Plotly
        ├── pages/
        │   ├── index.astro         <- Login
        │   ├── dashboard.astro     <- Panel principal
        │   ├── estadisticas.astro  <- Gráficas y ranking
        │   ├── configuracion.astro <- Configuración de cuenta
        │   ├── memoretos/          <- CRUD de memoretos
        │   └── grupos/             <- Gestión de grupos
        ├── components/react/   <- Componentes interactivos (MemoCanvas, etc.)
        ├── layouts/            <- AppLayout
        └── stores/             <- Estado global (nanostores)
```

---

## Endpoints de la API

Todos los endpoints (excepto login, register y ranking global) requieren el header:
```
Authorization: Bearer <token>
```

El token se obtiene al hacer login:
```bash
curl -X POST http://127.0.0.1:5000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "profe_test", "password": "password123"}'
```

### Autenticación

| Método | URL | Descripción |
|---|---|---|
| POST | `/auth/register` | Crear cuenta |
| POST | `/auth/login` | Iniciar sesión, devuelve JWT |
| POST | `/auth/logout` | Cerrar sesión |
| GET | `/auth/me` | Perfil del usuario actual |

### Partidas (Unity)

| Método | URL | Descripción |
|---|---|---|
| POST | `/session/start` | Iniciar partida de un memoreto |
| POST | `/game/session/event` | Registrar evento en partida |
| POST | `/session/end` | Finalizar partida |
| POST | `/answers` | Enviar respuesta y obtener puntaje |
| GET | `/answer/history` | Historial de intentos del usuario |

### Dashboard

| Método | URL | Descripción |
|---|---|---|
| GET | `/dashboard/ranking` | Ranking global de usuarios |
| GET | `/dashboard/ranking/me` | Posición del usuario actual |
| GET | `/dashboard/stats/scatter` | Datos scatter: tiempo vs puntaje |
| GET | `/dashboard/stats/progreso` | Progreso acumulado por estudiante |

### Memoretos

| Método | URL | Descripción |
|---|---|---|
| GET | `/memoretos/published` | Memoretos publicados (Unity) |
| GET | `/memoretos/mine` | Mis memoretos (docente) |
| GET | `/memoretos/<id>` | Detalle de un memoreto |
| POST | `/memoretos/` | Crear memoreto (docente) |
| PUT | `/memoretos/<id>` | Editar memoreto |
| DELETE | `/memoretos/<id>` | Eliminar memoreto |
| GET | `/memoretos/<id>/answers` | Resultados de estudiantes |

### Grupos

| Método | URL | Descripción |
|---|---|---|
| GET | `/groups/mine` | Mis grupos |
| GET | `/groups/<id>` | Detalle de un grupo |
| POST | `/groups/` | Crear grupo (docente) |
| POST | `/groups/<code>/members` | Unirse a un grupo con código |
| GET | `/groups/<id>/students` | Estudiantes del grupo |
| GET | `/groups/<id>/memoretos` | Memoretos asignados al grupo |
| POST | `/groups/<id>/memoretos` | Asignar memoreto a grupo |
| DELETE | `/groups/<id>/memoretos/<memo_id>` | Quitar memoreto del grupo |

---

## Probar los endpoints con Postman

1. URL base: `http://127.0.0.1:5000`
2. Usar `http://` (no `https://`)
3. Body: seleccionar **raw** → tipo **JSON**
4. Endpoints protegidos: pestaña **Authorization** → tipo **Bearer Token** → pegar el token del login

---

## Restablecer la base de datos

```bash
rm backend/memoretos.db
python3 seed.py
```

---

## Variables de entorno (opcionales)

Crea un archivo `.env` en la raíz del proyecto para sobreescribir los valores por defecto:

```env
SECRET_KEY=tu-clave-secreta-aqui
JWT_SECRET_KEY=tu-clave-jwt-aqui
DATABASE_URL=sqlite:///backend/memoretos.db
CORS_ORIGINS=http://localhost:4321,http://127.0.0.1:4321
```

Sin este archivo el sistema funciona con valores por defecto seguros para desarrollo.

---

## Solución de problemas comunes

**"Address already in use" en el puerto 5000**
```bash
lsof -ti :5000 | xargs kill -9
python3 run.py
```

**"Address already in use" en el puerto 4321**
```bash
lsof -ti :4321 | xargs kill -9
cd frontend && npm run dev
```

**macOS bloquea el puerto 5000 (AirPlay Receiver)**

Ir a Ajustes del Sistema → General → AirDrop y Handoff → desactivar **AirPlay Receiver**, o usar un puerto alternativo:
```bash
# En run.py cambiar port=5000 por port=5001
```

**Error 415 Unsupported Media Type en Postman**
- Body → raw → cambiar el dropdown de "Text" a **JSON**

**"No such table" o error de base de datos**
```bash
python3 seed.py
```

**El frontend no carga (error de módulos faltantes)**
```bash
cd frontend && npm install
```

---

## Equipo

| Nombre | Matrícula |
|---|---|
| Ximena Itzel Camacho Flores | A01669596 |
| Flor Blacina Rodriguez Hernandez | A01668657 |
| Sebastian de Jesus Cruz Cruz | A01667857 |
| Santiago Heriberto Leon Herrera | A01786782 |

TC2005B · Construcción de Software y Toma de Decisiones · Tec de Monterrey · 2026-11
