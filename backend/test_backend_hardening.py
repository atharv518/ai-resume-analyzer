"""Unit tests for backend security hardening, rate limiting, and input limits."""

import io
from fastapi.testclient import TestClient

from app.main import app
from app.routes.analyze import MAX_JD_LENGTH
from app.services.job_matcher import normalize_skill

client = TestClient(app)


def test_normalize_skill_regex_fix():
    """Verify that trailing 's', 'c', 'j' are not corrupted, but .js/.css are stripped."""
    assert normalize_skill("React.js") == "react"
    assert normalize_skill("Tailwind CSS") == "tailwindcss"
    assert normalize_skill("Express") == "express"  # Bug was stripping 'ss' -> 'expre'
    assert normalize_skill("Express.js") == "express"
    assert normalize_skill("graphics") == "graphics"  # Bug was stripping 's'/'c' -> 'graphi'
    assert normalize_skill("PostgreSQL") == "postgresql"
    assert normalize_skill("Node.js") == "node"
    print("[PASS] normalize_skill regex correctly preserves word endings while removing .js/.css")


def test_job_description_length_limit():
    """Verify that oversized job descriptions (>10,000 chars) are rejected with HTTP 400."""
    oversized_jd = "Python developer required. " * 500  # ~13,500 characters
    assert len(oversized_jd) > MAX_JD_LENGTH

    # Dummy valid PDF bytes
    fake_pdf = b"%PDF-1.4\n1 0 obj\n<< /Type /Catalog >>\nendobj\ntrailer\n<< /Root 1 0 R >>\n%%EOF"

    response = client.post(
        "/api/analyze",
        files={"resume": ("resume.pdf", io.BytesIO(fake_pdf), "application/pdf")},
        data={"job_description": oversized_jd},
    )
    assert response.status_code == 400
    assert "characters or fewer" in response.json().get("detail", "")
    print("[PASS] Oversized job description (>10,000 chars) correctly rejected with HTTP 400")


def test_health_check_endpoint():
    """Verify health check responds with 200 OK and includes X-Request-ID header."""
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"ok": True}
    assert "x-request-id" in response.headers
    print("[PASS] Health check returns 200 and includes X-Request-ID header")


if __name__ == "__main__":
    test_normalize_skill_regex_fix()
    test_job_description_length_limit()
    test_health_check_endpoint()
    print("\nALL BACKEND HARDENING TESTS PASSED!")
