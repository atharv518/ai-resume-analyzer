import os


def get_frontend_origins() -> list[str]:
    """Return allowed local frontend origins from the environment."""
    configured_origins = os.getenv(
        "FRONTEND_ORIGINS",
        "http://localhost:5173,http://127.0.0.1:5173",
    )
    return [origin.strip() for origin in configured_origins.split(",") if origin.strip()]
