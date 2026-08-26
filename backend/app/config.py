import os
from typing import Any, TypedDict


class FeatureFlags(TypedDict):
    SHOW_ATS_SCORE: bool
    SHOW_SKILL_MATCH: bool
    SHOW_KEYWORD_ANALYSIS: bool
    SHOW_EXPERIENCE_ANALYSIS: bool
    SHOW_PROJECT_ANALYSIS: bool
    SHOW_AI_RECOMMENDATIONS: bool
    SHOW_RESUME_STRENGTHS: bool


def _get_bool_env(key: str, default: bool) -> bool:
    """Parse boolean environment variable."""
    val = os.getenv(key)
    if val is None:
        return default
    return val.strip().lower() in {"true", "1", "yes", "on", "t"}


def get_frontend_origins() -> list[str]:
    """Return allowed local frontend origins from the environment."""
    configured_origins = os.getenv(
        "FRONTEND_ORIGINS",
        "http://localhost:5173,http://127.0.0.1:5173,http://localhost:5174,http://127.0.0.1:5174,http://localhost:3000,http://127.0.0.1:3000",
    )
    return [origin.strip() for origin in configured_origins.split(",") if origin.strip()]


def get_feature_flags() -> FeatureFlags:
    """Return centralized modular feature flags.
    
    Individual features can be toggled via environment variables or modified here directly.
    """
    return {
        "SHOW_ATS_SCORE": _get_bool_env("SHOW_ATS_SCORE", True),
        "SHOW_SKILL_MATCH": _get_bool_env("SHOW_SKILL_MATCH", True),
        "SHOW_KEYWORD_ANALYSIS": _get_bool_env("SHOW_KEYWORD_ANALYSIS", True),
        "SHOW_EXPERIENCE_ANALYSIS": _get_bool_env("SHOW_EXPERIENCE_ANALYSIS", True),
        "SHOW_PROJECT_ANALYSIS": _get_bool_env("SHOW_PROJECT_ANALYSIS", True),
        "SHOW_AI_RECOMMENDATIONS": _get_bool_env("SHOW_AI_RECOMMENDATIONS", True),
        "SHOW_RESUME_STRENGTHS": _get_bool_env("SHOW_RESUME_STRENGTHS", True),
    }


def get_ai_config() -> dict[str, Any]:
    """Return AI integration configuration without exposing secret defaults."""
    return {
        "provider": os.getenv("AI_PROVIDER", "gemini").lower(),
        "api_key": os.getenv("AI_API_KEY", "").strip(),
        "model": os.getenv("AI_MODEL", "gemini-3.5-flash").strip(),
        "timeout": int(os.getenv("AI_TIMEOUT_SECONDS", "20")),
    }


def get_rate_limit_config() -> dict[str, int]:
    """Return rate-limiting configuration from environment variables."""
    return {
        "max_requests": int(os.getenv("RATE_LIMIT_MAX_REQUESTS", "10")),
        "window_seconds": int(os.getenv("RATE_LIMIT_WINDOW_SECONDS", "60")),
    }

