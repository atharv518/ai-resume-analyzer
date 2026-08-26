import time
from collections import OrderedDict
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse

from app.config import get_rate_limit_config
from app.utils.ip_utils import get_client_ip

MAX_TRACKED_IPS = 10_000


class RateLimitMiddleware(BaseHTTPMiddleware):
    """In-memory bounded token/sliding-window rate limiter per client IP with LRU eviction."""

    def __init__(self, app):
        super().__init__(app)
        # Bounded OrderedDict mapping client_ip -> list[float] timestamps
        self._requests: OrderedDict[str, list[float]] = OrderedDict()

    async def dispatch(self, request: Request, call_next):
        # Only rate limit the POST /api/analyze endpoint
        path = request.url.path.rstrip("/")
        if request.method == "POST" and path.endswith("/api/analyze"):
            config = get_rate_limit_config()
            client_ip = get_client_ip(request)
            now = time.monotonic()
            window = float(config["window_seconds"])
            max_reqs = config["max_requests"]

            # Retrieve existing timestamps or initialize
            existing = self._requests.get(client_ip, [])
            active_timestamps = [t for t in existing if now - t < window]

            if len(active_timestamps) >= max_reqs:
                # Refresh position in LRU
                if client_ip in self._requests:
                    self._requests.move_to_end(client_ip)
                return JSONResponse(
                    status_code=429,
                    content={
                        "detail": "Too many requests. Please wait before submitting another resume analysis request."
                    },
                )

            # Append current timestamp
            active_timestamps.append(now)
            self._requests[client_ip] = active_timestamps
            self._requests.move_to_end(client_ip)

            # Prevent unbounded memory growth (LRU eviction)
            if len(self._requests) > MAX_TRACKED_IPS:
                self._requests.popitem(last=False)

        return await call_next(request)
