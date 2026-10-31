import uvicorn

from app.core.config import settings

if __name__ == "__main__":
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0" if settings.APP_ENV == "production" else "127.0.0.1",
        port=settings.API_PORT,
        reload=settings.APP_ENV == "development",
        access_log=False,
    )
