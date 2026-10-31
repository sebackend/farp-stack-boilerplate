from collections.abc import AsyncIterator
from contextlib import asynccontextmanager
from datetime import UTC, datetime

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.core.config import settings
from app.core.errors import AppError
from app.core.logging import RequestLoggingMiddleware, configure_logging, logger
from app.db.session import engine
from app.modules.auth.router import router as auth_router
from app.modules.tasks.router import router as tasks_router


@asynccontextmanager
async def lifespan(_app: FastAPI) -> AsyncIterator[None]:
    logger.info("API started", port=settings.API_PORT, env=settings.APP_ENV)
    yield
    # ─── Graceful shutdown ────────────────────────────────────────────────────
    await engine.dispose()
    logger.info("Server shut down successfully")


def _error_body(message: str, status_code: int, **extra: object) -> dict[str, object]:
    return {"error": message, "statusCode": status_code, **extra}


def _field_errors(exc: RequestValidationError) -> dict[str, list[str]]:
    """Groups validation errors by field name, e.g. {"title": ["..."]}."""
    details: dict[str, list[str]] = {}
    for error in exc.errors():
        loc = [str(part) for part in error["loc"] if part not in ("body", "query", "path")]
        field = loc[0] if loc else "body"
        details.setdefault(field, []).append(error["msg"])
    return details


def register_exception_handlers(app: FastAPI) -> None:
    @app.exception_handler(AppError)
    async def handle_app_error(request: Request, exc: AppError) -> JSONResponse:
        if exc.status_code >= 500:
            logger.error(exc.message, path=request.url.path)
        return JSONResponse(_error_body(exc.message, exc.status_code), exc.status_code)

    @app.exception_handler(RequestValidationError)
    async def handle_validation_error(
        _request: Request, exc: RequestValidationError
    ) -> JSONResponse:
        body = _error_body("Validation error", 422, details=_field_errors(exc))
        return JSONResponse(body, 422)

    @app.exception_handler(StarletteHTTPException)
    async def handle_http_error(_request: Request, exc: StarletteHTTPException) -> JSONResponse:
        message = "Route not found" if exc.status_code == 404 else str(exc.detail)
        return JSONResponse(_error_body(message, exc.status_code), exc.status_code)

    @app.exception_handler(Exception)
    async def handle_unexpected_error(request: Request, exc: Exception) -> JSONResponse:
        logger.exception("Unhandled error", path=request.url.path)
        return JSONResponse(_error_body("Internal server error", 500), 500)


def create_app() -> FastAPI:
    configure_logging()
    app = FastAPI(
        title="FARP Task Manager API",
        version="0.1.0",
        lifespan=lifespan,
    )

    # ─── Global middleware ────────────────────────────────────────────────────
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[settings.API_CORS_ORIGIN],
        allow_methods=["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
        allow_headers=["Content-Type", "Authorization"],
        allow_credentials=True,
    )
    app.add_middleware(RequestLoggingMiddleware)

    register_exception_handlers(app)

    # ─── Health check ─────────────────────────────────────────────────────────
    @app.get("/health", tags=["health"])
    async def health() -> dict[str, str]:
        return {"status": "ok", "timestamp": datetime.now(UTC).isoformat()}

    # ─── Versioned routes ─────────────────────────────────────────────────────
    app.include_router(auth_router, prefix="/api/v1")
    app.include_router(tasks_router, prefix="/api/v1")

    return app


app = create_app()
