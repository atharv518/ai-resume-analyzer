"""Vercel serverless function entry point.

This module exposes the existing FastAPI application instance to the
Vercel Python runtime.  Vercel discovers the top-level ``app`` variable
in ``api/index.py`` and uses it to handle all incoming HTTP requests.

No application logic is duplicated here — the real application lives in
``app.main`` and is imported as-is.
"""

from app.main import app  # noqa: F401 — re-exported for Vercel runtime discovery
