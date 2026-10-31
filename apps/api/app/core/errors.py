# ─── Base app error ───────────────────────────────────────────────────────────


class AppError(Exception):
    status_code = 500

    def __init__(self, message: str = "Internal server error", status_code: int | None = None):
        super().__init__(message)
        self.message = message
        if status_code is not None:
            self.status_code = status_code


# ─── Typed errors ─────────────────────────────────────────────────────────────


class NotFoundError(AppError):
    status_code = 404

    def __init__(self, resource: str = "Resource"):
        super().__init__(f"{resource} not found")


class UnauthorizedError(AppError):
    status_code = 401

    def __init__(self, message: str = "Unauthorized"):
        super().__init__(message)


class ForbiddenError(AppError):
    status_code = 403

    def __init__(self, message: str = "Forbidden"):
        super().__init__(message)


class ConflictError(AppError):
    status_code = 409

    def __init__(self, message: str = "Conflict"):
        super().__init__(message)
