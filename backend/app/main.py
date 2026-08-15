from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_frontend_origins
from app.routes.analyze import router as analyze_router


app = FastAPI(
    title="AI Resume Analyzer API",
    version="0.1.0",
    description="Backend API for the AI Resume Analyzer project.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=get_frontend_origins(),
    allow_credentials=False,
    allow_methods=["POST"],
    allow_headers=["*"],
)

app.include_router(analyze_router, prefix="/api", tags=["resume"])


@app.get("/health")
async def health_check() -> dict[str, bool]:
    """A small endpoint to confirm that the API is available."""
    return {"ok": True}
