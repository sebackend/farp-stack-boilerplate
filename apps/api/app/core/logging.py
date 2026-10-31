import logging
import time
import uuid
from collections.abc import MutableMapping
from typing import Any

import structlog
from starlette.types import ASGIApp, Message, Receive, Scope, Send

from app.core.config import settings

# Sensitive fields that must never appear in logs.
SENSITIVE_KEYS = {"password", "password_hash", "token", "refresh_token", "access_token"}


def _redact(
    _logger: Any, _method: str, event: MutableMapping[str, Any]
) -> MutableMapping[str, Any]:
    for key in event.keys() & SENSITIVE_KEYS:
        event[key] = "[REDACTED]"
    return event


def configure_logging() -> None:
    # The app never logs at CRITICAL, so tests stay silent.
    level = {"test": logging.CRITICAL, "development": logging.DEBUG}.get(
        settings.APP_ENV, logging.INFO
    )
    renderer: Any = (
        structlog.dev.ConsoleRenderer()
        if settings.APP_ENV == "development"
        else structlog.processors.JSONRenderer()
    )
    structlog.configure(
        processors=[
            structlog.contextvars.merge_contextvars,
            structlog.processors.add_log_level,
            structlog.processors.TimeStamper(fmt="iso"),
            _redact,
            structlog.processors.format_exc_info,
            renderer,
        ],
        wrapper_class=structlog.make_filtering_bound_logger(level),
        cache_logger_on_first_use=True,
    )


logger: structlog.stdlib.BoundLogger = structlog.get_logger()


class RequestLoggingMiddleware:
    """Assigns a request id and logs one line per request with a status-based level."""

    def __init__(self, app: ASGIApp) -> None:
        self.app = app

    async def __call__(self, scope: Scope, receive: Receive, send: Send) -> None:
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return

        headers = dict(scope["headers"])
        request_id = headers.get(b"x-request-id", b"").decode() or str(uuid.uuid4())
        structlog.contextvars.clear_contextvars()
        structlog.contextvars.bind_contextvars(request_id=request_id)

        status_code = 500
        start = time.perf_counter()

        async def send_wrapper(message: Message) -> None:
            nonlocal status_code
            if message["type"] == "http.response.start":
                status_code = message["status"]
                message.setdefault("headers", []).append((b"x-request-id", request_id.encode()))
            await send(message)

        try:
            await self.app(scope, receive, send_wrapper)
        finally:
            if status_code >= 500:
                log = logger.error
            elif status_code >= 400:
                log = logger.warning
            else:
                log = logger.info
            log(
                "request completed",
                method=scope["method"],
                path=scope["path"],
                query=scope["query_string"].decode(),
                status_code=status_code,
                duration_ms=round((time.perf_counter() - start) * 1000, 2),
            )
