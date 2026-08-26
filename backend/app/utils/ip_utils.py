import os
import re
from starlette.requests import Request

# Parse trusted proxy IPs from environment (defaulting to localhost loopbacks)
_DEFAULT_TRUSTED_PROXIES = {"127.0.0.1", "::1", "localhost"}
_IP_REGEX = re.compile(r"^[0-9a-fA-F:.\%]{3,45}$")


def get_trusted_proxies() -> set[str]:
    """Return configured trusted reverse proxy IPs/subnets."""
    env_val = os.getenv("TRUSTED_PROXIES", "").strip()
    if not env_val:
        return _DEFAULT_TRUSTED_PROXIES
    configured = {p.strip() for p in env_val.split(",") if p.strip()}
    return configured | _DEFAULT_TRUSTED_PROXIES


def get_client_ip(request: Request) -> str:
    """Safely extract the real client IP address.
    
    Only trusts X-Forwarded-For / X-Real-IP if the direct TCP peer (request.client.host)
    is in the trusted proxy set, preventing header spoofing attacks.
    """
    direct_peer = request.client.host if request.client else "unknown"
    trusted_proxies = get_trusted_proxies()

    if direct_peer in trusted_proxies:
        # Check X-Forwarded-For header
        forwarded_for = request.headers.get("X-Forwarded-For", "").strip()
        if forwarded_for:
            # First IP in the list represents the originating client
            client_candidate = forwarded_for.split(",")[0].strip()
            if _IP_REGEX.match(client_candidate):
                return client_candidate

        # Check X-Real-IP header
        real_ip = request.headers.get("X-Real-IP", "").strip()
        if real_ip and _IP_REGEX.match(real_ip):
            return real_ip

    return direct_peer
