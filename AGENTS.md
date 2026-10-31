# AGENTS.md

## Purpose

This repository is a public FARP (FastAPI + React + PostgreSQL) monorepo boilerplate for a task manager app.

- Monorepo toolchain: `pnpm` workspaces + `turbo` (the Python API is orchestrated through a thin `apps/api/package.json`)
- Backend: FastAPI + SQLAlchemy 2.0 (async) + Alembic + PostgreSQL, managed with `uv`
- Frontend: React 19 + Vite + Redux Toolkit + RTK Query + React Router
- Shared contracts: Pydantic models in `apps/api` are the source of truth; TypeScript types are generated into `packages/shared`
- Infra primitives: Redis scaffolded, but no background workers yet

Use this file as the canonical repository guide for AI agents and automated coding assistants.

## Repository Layout

```text
apps/
  api/        FastAPI app, SQLAlchemy models, Alembic migrations, auth, tasks
  web/        React SPA with auth flow and task UI
packages/
  shared/     TypeScript contract types generated from the API's OpenAPI schema
  tsconfig/   Shared TypeScript config package
  eslint-config/ Shared ESLint config package
```

Key files:

- `package.json`: root scripts for the monorepo
- `turbo.json`: task pipeline for build, lint, and test
- `apps/api/pyproject.toml`: Python dependencies and Ruff, mypy, pytest config
- `apps/api/package.json`: turbo-facing scripts that call `uv run ...`
- `apps/api/app/main.py`: FastAPI app wiring (middleware, routers, exception handlers)
- `apps/api/app/db/models.py`: database schema (SQLAlchemy models)
- `apps/api/alembic/versions/`: migrations
- `packages/shared/openapi.json`, `packages/shared/src/generated/api.ts`: generated contracts (do not edit by hand)
- `apps/web/src/main.tsx`: React entry point
- `apps/web/src/router.tsx`: app routes
- `.github/workflows/`: CI quality checks plus security automation with Trivy and CodeQL

## Runtime And Tooling

- Python: `3.13` (pinned in `apps/api/.python-version`)
- uv: Python dependency manager (`apps/api/uv.lock`)
- Node.js: `>=20`
- pnpm: `>=9`, pinned in root: `pnpm@9.15.4`
- Database: PostgreSQL
- Cache/queue infra: Redis

Prefer running commands from the repository root.

## Common Commands

Install dependencies:

```bash
pnpm install
uv sync --directory apps/api
```

Run the full monorepo in development:

```bash
pnpm dev
```

Run quality checks:

```bash
pnpm lint
pnpm test
pnpm test:coverage
pnpm build
```

Regenerate the shared contracts after changing Pydantic request/response models:

```bash
pnpm contracts
pnpm contracts:check   # what CI runs
```

Run app-specific commands:

```bash
pnpm --filter api dev
pnpm --filter api test
pnpm --filter api format
pnpm --filter web dev
pnpm --filter web test
```

Database commands:

```bash
pnpm --filter api db:migrate          # alembic upgrade head
pnpm --filter api db:revision "msg"   # alembic revision --autogenerate
pnpm --filter api db:downgrade        # alembic downgrade -1
pnpm --filter api db:seed
```

Local infra:

```bash
docker compose -f docker-compose.dev.yml up -d
```

## Environment Variables

Copy `.env.example` to `.env`.

Important variables:

- `APP_ENV` (`development` | `production` | `test`)
- `DATABASE_URL` (plain `postgresql://` URLs are switched to the `asyncpg` driver)
- `REDIS_URL`
- `JWT_ACCESS_SECRET`
- `JWT_REFRESH_SECRET`
- `JWT_ACCESS_EXPIRES_IN`
- `JWT_REFRESH_EXPIRES_IN`
- `API_PORT`
- `API_CORS_ORIGIN`
- `VITE_API_URL`
- `TEST_DATABASE_URL` (API tests only; defaults to `postgresql://postgres:postgres@localhost:5432/taskmanager_test`)

Backend settings live in `apps/api/app/core/config.py` and use `pydantic-settings`. Invalid or missing required values stop the API at startup.

## How The Backend Works

API base:

- Health check: `/health`
- Versioned API: `/api/v1`
- Interactive docs: `/docs` (Swagger UI) and `/redoc`

Current modules:

- `auth`: login, refresh, logout, current user
- `tasks`: authenticated CRUD for tasks

Important backend pieces:

- `apps/api/app/main.py`: registers CORS, request logging, routers, and exception handlers that produce the `{ error, statusCode, details? }` error shape
- `apps/api/app/api/deps.py`: `DbSession` and `AuthUser` dependencies; `AuthUser` validates the JWT access token
- `apps/api/app/core/security.py`: argon2 password hashing and JWT signing/verification
- `apps/api/app/core/errors.py`: `AppError` hierarchy (`NotFoundError`, `UnauthorizedError`, ...)
- `apps/api/app/schemas.py`: `CamelModel`, the base for all API contracts (snake_case in Python, camelCase on the wire)
- `apps/api/app/modules/<module>/`: `router.py` (HTTP), `service.py` (writes), `query.py` (reads), `schemas.py` (Pydantic contracts)

Backend conventions:

- Request and response models extend `CamelModel` and live in the module's `schemas.py`.
- Protected routes take an `AuthUser` parameter.
- Keep API routes under `/api/v1/...`.
- Raise `AppError` subclasses for expected failures; never return ad-hoc error bodies.
- Database columns are snake_case; IDs are auto-incrementing `BIGINT` identity columns.
- If you change SQLAlchemy models, generate and commit an Alembic migration. CI runs `alembic check` to catch missing migrations.

## How The Frontend Works

Frontend stack:

- React 19
- React Router
- Redux Toolkit
- RTK Query
- Tailwind CSS 4

Important frontend pieces:

- `apps/web/src/main.tsx`: renders the app with the Redux provider
- `apps/web/src/router.tsx`: public and protected routes
- `apps/web/src/store/api.ts`: RTK Query base API with automatic refresh flow
- `apps/web/src/features/auth/authSlice.ts`: auth state stored in Redux and mirrored to `localStorage`

Frontend auth behavior:

- Access and refresh tokens are stored in `localStorage`.
- Requests attach `Authorization: Bearer <accessToken>` when present.
- On `401`, RTK Query attempts `/auth/refresh` using the stored refresh token.
- If refresh fails, the app dispatches `logout()`.

Frontend conventions:

- If you change API shapes, update the Pydantic models first, run `pnpm contracts`, then align UI consumers.
- Use `TaskResponse["id"]` instead of hard-coding the ID type.
- Keep feature code grouped under `apps/web/src/features/...`.
- Preserve the protected route flow built around `RequireAuth`.

## Shared Package

`packages/shared` is the contract layer between apps, but it is generated, not hand-written.

- `openapi.json` is exported from the FastAPI app.
- `src/generated/api.ts` is generated by `openapi-typescript`.
- `src/index.ts` re-exports friendly aliases (`TaskResponse`, `LoginInput`, ...) and is the only hand-written file.

When changing a contract:

1. Update the Pydantic model in `apps/api/app/modules/<module>/schemas.py`.
2. Run `pnpm contracts` and commit the regenerated files.
3. Update API handlers and frontend consumers together.
4. Update tests on both sides when behavior changes.

## Testing

Current testing stack:

- Backend: pytest + pytest-asyncio + httpx `AsyncClient`, against a real PostgreSQL database
- Frontend: Vitest + Testing Library + jsdom

Backend test details:

- `tests/conftest.py` creates the test database if needed, builds the schema, and wraps each test in a transaction that is rolled back.
- Turbo passes `TEST_DATABASE_URL` through to the test tasks.

When making changes:

- Add or update focused tests near the affected module.
- Prefer app-specific test runs during iteration.
- Run the relevant root or package-level tests before finishing.
- Do not rely on the production web build to type-check frontend tests; `web` tests are validated through Vitest separately.

## Docker And Deployment

Dockerfiles exist for:

- `apps/api/Dockerfile`: multi-stage `python:3.13-slim` build with `uv sync --frozen --no-dev`, runs as a non-root user
- `apps/web/Dockerfile`: builds the SPA and serves it through Nginx

Operational detail:

- The API entrypoint (`apps/api/docker-entrypoint.sh`) runs `alembic upgrade head` and then starts Uvicorn.
- Inside the image, settings come from environment variables; the repository-root `.env` is only read in local development.

## Security Automation

This repository includes:

- `.github/dependabot.yml` (npm, uv, Docker, GitHub Actions)
- `.github/workflows/ci.yml`
- `.github/workflows/trivy.yml`
- `.github/workflows/codeql.yml` (JavaScript/TypeScript and Python)

These handle:

- dependency update PRs
- contract, migration, lint, test, and build checks on every PR
- vulnerability scanning for dependencies and Docker images
- static analysis for JavaScript/TypeScript and Python

## Git Conventions

- Write commit messages in English.
- Use the Conventional Commits v1.0.0 specification for all commits.
- Prefer concise commit subjects such as `feat: add task status filter` or `fix: handle expired refresh token`.

## Language Conventions

- Use English for documentation, code comments, identifiers when naming new code, test titles, log messages, and user-facing strings unless a feature explicitly requires localization.
- Avoid introducing Spanish in source files, scripts, fixtures, or repository-level docs.

## Change Guidelines For Agents

- Prefer minimal changes that fit the existing structure.
- Do not hand-edit generated contract files; change the Pydantic model and run `pnpm contracts`.
- Keep backend and frontend behavior aligned when touching auth or task flows.
- Avoid moving files or renaming modules without a concrete need.
- Respect the existing module split: `core`, `db`, `api`, `modules` (API) and `features`, `store`, `components` (web).
- If a change affects the database schema, include the Alembic migration.
- If a change affects API behavior, update tests.
- If a change affects auth or routing, verify both API and web tests where relevant.

## Quick Start For A New Contributor Or Agent

1. `pnpm install && uv sync --directory apps/api`
2. `cp .env.example .env`
3. `docker compose -f docker-compose.dev.yml up -d`
4. `pnpm --filter api db:migrate`
5. `pnpm --filter api db:seed`
6. `pnpm dev`

Default local URLs:

- API: `http://localhost:3000` (docs at `/docs`)
- Web: `http://localhost:5173`

Seed credentials:

- Email: `admin@example.com`
- Password: `password123`
