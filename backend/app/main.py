from typing import Any
import logging
import time
from fastapi import FastAPI, Response
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_frontend_origins
from app.middleware.rate_limiter import RateLimitMiddleware
from app.middleware.request_logger import RequestLoggerMiddleware
from app.middleware.security_headers import SecurityHeadersMiddleware
from app.routes.analyze import router as analyze_router
from app.services.health_service import get_deep_health_report

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)

app = FastAPI(
    title="NovaATS API",
    version="2.0.0",
    description="Backend API for NovaATS — Intelligent Resume & ATS Analyzer.",
)

# Security response headers middleware
app.add_middleware(SecurityHeadersMiddleware)

# Request logging and correlation ID tracing middleware
app.add_middleware(RequestLoggerMiddleware)

# Rate limiting middleware with bounded LRU memory
app.add_middleware(RateLimitMiddleware)

# CORS middleware with strict configured origins and restricted methods
app.add_middleware(
    CORSMiddleware,
    allow_origins=get_frontend_origins(),
    allow_credentials=False,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Content-Type", "X-Request-ID"],
)

app.include_router(analyze_router, prefix="/api", tags=["resume"])


@app.get("/health", tags=["system"])
async def health_check() -> dict[str, Any]:
    """Fast liveness probe confirming server availability."""
    return {
        "status": "healthy",
        "app": "NovaATS",
        "version": "2.0.0",
        "timestamp": time.time(),
    }


@app.get("/health/deep", tags=["system"])
async def deep_health_check(response: Response) -> dict[str, Any]:
    """Deep readiness and dependency diagnostic probe checking AI provider, parsers, queue, and telemetry."""
    report, status_code = await get_deep_health_report()
    response.status_code = status_code
    return report
