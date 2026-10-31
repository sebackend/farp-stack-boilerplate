# Task Manager - FARP Stack Boilerplate

Monorepo with **F**astAPI + **R**eact 19 + **P**ostgreSQL. It is the Python-backend sibling of the PERN boilerplate: same task manager app, same frontend, same API surface.

## Stack

| Layer | Technology |
|---|---|
| Runtime | Python 3.13 (API) + Node.js 20+ (web, tooling) |
| Monorepo | pnpm workspaces + Turborepo 2 (orchestrates the Python API through `apps/api/package.json`) |
| Backend | FastAPI + Uvicorn |
| Python packaging | uv (`pyproject.toml` + `uv.lock`) |
| ORM | SQLAlchemy 2.0 (async, asyncpg) + PostgreSQL 17 |
| Migrations | Alembic |
| Auth | PyJWT (HS256) + argon2-cffi |
| Logging | structlog (JSON in production, console in development) |
| Validation | Pydantic v2 (source of truth for API contracts) |
| Shared contracts | TypeScript types generated from OpenAPI with `openapi-typescript` |
| Jobs | Redis 7 (scaffolded, no workers yet) |
| Frontend | React 19 + Vite |
| State | Redux Toolkit 2 + RTK Query |
| Routing | React Router |
| Styling | Tailwind CSS 4 |
| Testing | pytest + httpx (API, against a real Postgres) · Vitest + Testing Library + jsdom (web) |
| Lint / types | Ruff + mypy (API) · ESLint + TypeScript (web) |

## Quick Setup

Requirements: Node.js 20+, pnpm 9+, [uv](https://docs.astral.sh/uv/), Docker.

### 1. Install dependencies
```bash
pnpm install
uv sync --directory apps/api
```

### 2. Environment variables
```bash
cp .env.example .env
# Edit .env if needed; the default values work for local development
```

### 3. Start Postgres + Redis
```bash
docker compose -f docker-compose.dev.yml up -d
```

### 4. Run migrations + seed
```bash
pnpm --filter api db:migrate    # alembic upgrade head
pnpm --filter api db:seed       # creates the sample user and tasks
```

Seed credentials:
- **Email:** `admin@example.com`
- **Password:** `password123`

### 5. Start everything
```bash
pnpm dev
```

- API: http://localhost:3000
- API docs (Swagger UI): http://localhost:3000/docs
- Web: http://localhost:5173

Notes:
- The frontend automatically attempts session recovery with the `refresh token` when the `access token` expires.
- Protected routes validate the session with `/auth/me` before rendering the private view.

## API Endpoints

```
GET  /health

POST /api/v1/auth/login
POST /api/v1/auth/refresh
POST /api/v1/auth/logout        <- requires auth
GET  /api/v1/auth/me            <- requires auth

GET    /api/v1/tasks            <- requires auth
POST   /api/v1/tasks            <- requires auth
GET    /api/v1/tasks/:id        <- requires auth
PATCH  /api/v1/tasks/:id        <- requires auth
DELETE /api/v1/tasks/:id        <- requires auth
```

IDs are auto-incrementing integers. JSON payloads use camelCase (`dueDate`, `createdAt`); the database uses snake_case.

Errors share one shape:

```json
{ "error": "Validation error", "statusCode": 422, "details": { "title": ["..."] } }
```

## API Contracts

Pydantic models in `apps/api` are the single source of truth. After changing a request or response model:

```bash
pnpm contracts   # exports openapi.json and regenerates packages/shared/src/generated/api.ts
```

Commit the regenerated files. CI runs `pnpm contracts:check` and fails if they are out of date.

## Database Migrations

```bash
pnpm --filter api db:revision "add task labels"   # autogenerate from the SQLAlchemy models
pnpm --filter api db:migrate                       # apply
pnpm --filter api db:downgrade                     # roll back one revision
```

## Quality And Tests

```bash
pnpm lint            # ruff + mypy (api), eslint (web, shared)
pnpm test            # pytest (api) + vitest (web)
pnpm test:coverage
pnpm build
```

API tests run against a real PostgreSQL database. Each test runs inside a transaction that is rolled back. The test database is created automatically if it does not exist:

```bash
# Default: postgresql://postgres:postgres@localhost:5432/taskmanager_test
TEST_DATABASE_URL=postgresql://... pnpm --filter api test
```

Build note:
- The production web build uses `apps/web/tsconfig.build.json`, which excludes test files.
- Test type-safety and behavior are validated separately through `pnpm --filter web test`.

## Docker Deployment
```bash
# Build and start all services
docker compose up --build -d

# Web available at http://localhost
# API available at http://localhost:3000
```

Notes:
- Requires a `.env` file at the repository root.
- The API image installs dependencies with `uv sync --frozen --no-dev`, runs as a non-root user, and applies Alembic migrations on startup.

## Project Structure
```
farp-stack-boilerplate/
├── apps/
│   ├── api/          # FastAPI + SQLAlchemy + Alembic + Auth + Tasks
│   │   ├── app/      # core (config, security, logging, errors), db, modules
│   │   ├── alembic/  # migrations
│   │   ├── scripts/  # seed, OpenAPI export
│   │   └── tests/
│   └── web/          # React 19 + RTK Query + Tailwind
└── packages/
    ├── shared/       # TypeScript types generated from the API's OpenAPI schema
    ├── tsconfig/     # Reusable base TSConfig
    └── eslint-config/
```

## Current Boilerplate Status

- Complete auth flow in the API: `login`, `refresh`, `logout`, `me`
- Automatic session recovery in the frontend
- JWT-protected task CRUD
- Pydantic contracts with generated TypeScript types, checked in CI
- Interactive API docs at `/docs` and `/redoc`
- Docker ready for reproducible builds
- Redis included as a foundation, but no background workers implemented yet
