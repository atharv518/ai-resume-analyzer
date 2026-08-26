import sys
import time
import httpx
from typing import Any

from app.config import get_ai_config, get_feature_flags
from app.services.job_queue import job_queue

_SERVER_START_TIME = time.time()


async def check_ai_provider_health() -> dict[str, Any]:
    """Check AI provider configuration and connectivity readiness."""
    ai_config = get_ai_config()
    provider = ai_config.get("provider", "gemini").lower()
    api_key = ai_config.get("api_key", "").strip()
    model = ai_config.get("model", "").strip()

    if not api_key:
        return {
            "status": "healthy",
            "mode": "deterministic_fallback",
            "provider": provider,
            "details": "No API key configured. Deterministic local NLP engine active and healthy.",
        }

    # Lightweight reachability check for configured cloud provider
    try:
        if provider == "gemini":
            # Ping Google API endpoint base with low timeout
            async with httpx.AsyncClient(timeout=3.0) as client:
                res = await client.get("https://generativelanguage.googleapis.com/$discovery/rest?version=v1beta")
                is_reachable = res.status_code == 200
        elif provider == "openai":
            # Ping OpenAI status or models endpoint
            async with httpx.AsyncClient(timeout=3.0) as client:
                res = await client.get("https://api.openai.com/v1/models", headers={"Authorization": f"Bearer {api_key}"})
                is_reachable = res.status_code in {200, 401, 403, 429}
        else:
            is_reachable = True

        return {
            "status": "healthy" if is_reachable else "degraded",
            "mode": "cloud_ai",
            "provider": provider,
            "model": model,
            "reachable": is_reachable,
        }
    except Exception as exc:
        return {
            "status": "degraded",
            "mode": "cloud_ai_with_fallback",
            "provider": provider,
            "model": model,
            "warning": f"AI endpoint unreachable ({exc}). Automatic fallback to deterministic engine is operational.",
        }


def check_parser_subsystem_health() -> dict[str, Any]:
    """Verify document parser libraries integrity (pypdf & python-docx)."""
    try:
        import pypdf
        import docx

        return {
            "status": "healthy",
            "pdf_engine": f"pypdf v{getattr(pypdf, '__version__', 'unknown')}",
            "docx_engine": f"python-docx v{getattr(docx, '__version__', 'unknown')}",
        }
    except Exception as exc:
        return {
            "status": "unhealthy",
            "error": f"Document parser library failed to load: {exc}",
        }


def get_system_telemetry() -> dict[str, Any]:
    """Gather basic runtime telemetry and uptime."""
    uptime_seconds = round(time.time() - _SERVER_START_TIME, 1)
    return {
        "uptime_seconds": uptime_seconds,
        "python_version": sys.version.split()[0],
        "platform": sys.platform,
    }


async def get_deep_health_report() -> tuple[dict[str, Any], int]:
    """Perform a comprehensive health and readiness check across all subsystems.
    
    Returns a tuple of (report_dict, http_status_code).
    """
    system_telemetry = get_system_telemetry()
    parser_health = check_parser_subsystem_health()
    ai_health = await check_ai_provider_health()
    queue_stats = job_queue.get_stats()
    feature_flags = get_feature_flags()

    # Determine overall status
    is_critical_ok = parser_health.get("status") == "healthy"
    overall_status = "healthy" if is_critical_ok else "unhealthy"

    if overall_status == "healthy" and ai_health.get("status") == "degraded":
        overall_status = "degraded"

    http_status = 200 if overall_status in {"healthy", "degraded"} else 503

    report = {
        "status": overall_status,
        "app_name": "NovaATS",
        "version": "2.0.0",
        "timestamp": time.time(),
        "system": system_telemetry,
        "subsystems": {
            "parsers": parser_health,
            "ai_provider": ai_health,
            "job_queue": queue_stats,
            "feature_flags": feature_flags,
        },
    }

    return report, http_status
