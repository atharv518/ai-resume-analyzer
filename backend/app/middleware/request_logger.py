import logging
import time
import uuid
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request

from app.utils.ip_utils import get_client_ip

logger = logging.getLogger("app.requests")


class RequestLoggerMiddleware(BaseHTTPMiddleware):
    """Structured request logging middleware with execution timing and correlation IDs."""

    async def dispatch(self, request: Request, call_next):
        request_id = str(uuid.uuid4())[:8]
        start_time = time.monotonic()

        response = await call_next(request)

        elapsed_ms = round((time.monotonic() - start_time) * 1000, 1)
        client_ip = get_client_ip(request)

        logger.info(
            "[%s] %s %s from %s -> %d (%s ms)",
            request_id,
            request.method,
            request.url.path,
            client_ip,
            response.status_code,
            elapsed_ms,
        )

        response.headers["X-Request-ID"] = request_id
        return response
