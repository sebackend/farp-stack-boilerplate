# ─── Stage 1: dependencies ────────────────────────────────────────────────────
FROM python:3.13-slim AS builder

COPY --from=ghcr.io/astral-sh/uv:0.12.17 /uv /usr/local/bin/uv

ENV UV_COMPILE_BYTECODE=1 \
    UV_LINK_MODE=copy \
    UV_PYTHON_DOWNLOADS=never

WORKDIR /app

# Install dependencies first so this layer is cached across source changes.
COPY apps/api/pyproject.toml apps/api/uv.lock apps/api/.python-version ./
RUN uv sync --frozen --no-dev --no-install-project

COPY apps/api/app ./app
COPY apps/api/alembic ./alembic
COPY apps/api/alembic.ini ./alembic.ini

# ─── Stage 2: production ──────────────────────────────────────────────────────
FROM python:3.13-slim AS runner

ENV APP_ENV=production \
    PATH="/app/.venv/bin:$PATH" \
    PYTHONUNBUFFERED=1

WORKDIR /app

RUN useradd --system --uid 1001 --no-create-home app

COPY --from=builder --chown=app:app /app /app
COPY --chown=app:app apps/api/docker-entrypoint.sh /app/docker-entrypoint.sh

USER app

EXPOSE 3000

CMD ["/app/docker-entrypoint.sh"]
