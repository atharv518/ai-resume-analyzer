from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """Adds essential HTTP security headers to all incoming responses."""

    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)

        # Defense-in-depth security headers
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Permissions-Policy"] = "geolocation=(), microphone=(), camera=()"
        
        # CSP for API endpoints
        if not response.headers.get("Content-Security-Policy"):
            response.headers["Content-Security-Policy"] = "default-src 'none'; frame-ancestors 'none'"

        return response
