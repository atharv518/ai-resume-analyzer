import asyncio
import logging
import time
import uuid
from dataclasses import dataclass, field
from enum import Enum
from typing import Any, Callable

logger = logging.getLogger(__name__)

# Defaults
MAX_CONCURRENT_JOBS = 5
JOB_TTL_SECONDS = 1800  # 30 minutes


class JobStatus(str, Enum):
    QUEUED = "queued"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"


@dataclass
class JobRecord:
    job_id: str
    status: JobStatus = JobStatus.QUEUED
    progress_percentage: int = 0
    current_step: str = "Queued for processing"
    created_at: float = field(default_factory=time.time)
    started_at: float | None = None
    completed_at: float | None = None
    result: dict[str, Any] | None = None
    error: str | None = None


class JobQueueManager:
    """In-memory async job queue manager with concurrency control and TTL eviction."""

    def __init__(self, max_concurrent: int = MAX_CONCURRENT_JOBS, ttl_seconds: int = JOB_TTL_SECONDS):
        self._jobs: dict[str, JobRecord] = {}
        self._semaphore = asyncio.Semaphore(max_concurrent)
        self._ttl_seconds = ttl_seconds
        self._lock = asyncio.Lock()

    def create_job(self) -> str:
        """Create a new queued job record and return its unique ID."""
        self._cleanup_expired_jobs()
        job_id = str(uuid.uuid4())
        self._jobs[job_id] = JobRecord(job_id=job_id)
        return job_id

    def get_job(self, job_id: str) -> JobRecord | None:
        """Retrieve the job record by its ID."""
        self._cleanup_expired_jobs()
        return self._jobs.get(job_id)

    async def update_progress(self, job_id: str, percentage: int, step_desc: str) -> None:
        """Update the live progress percentage and description for a running job."""
        job = self._jobs.get(job_id)
        if job and job.status == JobStatus.PROCESSING:
            job.progress_percentage = min(max(percentage, 0), 100)
            job.current_step = step_desc

    async def execute_job(
        self,
        job_id: str,
        task_fn: Callable[..., Any],
        *args: Any,
        **kwargs: Any,
    ) -> None:
        """Execute a job worker wrapped in the concurrency semaphore and status lifecycle."""
        job = self._jobs.get(job_id)
        if not job:
            return

        try:
            async with self._semaphore:
                job.status = JobStatus.PROCESSING
                job.started_at = time.time()
                job.progress_percentage = 10
                job.current_step = "Job started"

                # Pass a progress callback to the task function if accepted
                result = await task_fn(
                    *args,
                    progress_callback=lambda pct, step: self.update_progress(job_id, pct, step),
                    **kwargs,
                )

                job.status = JobStatus.COMPLETED
                job.progress_percentage = 100
                job.current_step = "Analysis completed"
                job.completed_at = time.time()
                job.result = result

        except Exception as exc:
            logger.exception("Error executing analysis job %s: %s", job_id, exc)
            job.status = JobStatus.FAILED
            job.completed_at = time.time()
            job.current_step = "Failed"
            job.error = str(getattr(exc, "detail", str(exc)))

    def _cleanup_expired_jobs(self) -> None:
        """Purge jobs that finished longer than the TTL duration ago."""
        now = time.time()
        expired_ids = [
            jid for jid, record in self._jobs.items()
            if record.completed_at and (now - record.completed_at > self._ttl_seconds)
        ]
        for jid in expired_ids:
            self._jobs.pop(jid, None)

    def get_stats(self) -> dict[str, int]:
        """Return live telemetry on queue depth and worker status."""
        self._cleanup_expired_jobs()
        queued = sum(1 for j in self._jobs.values() if j.status == JobStatus.QUEUED)
        processing = sum(1 for j in self._jobs.values() if j.status == JobStatus.PROCESSING)
        completed = sum(1 for j in self._jobs.values() if j.status == JobStatus.COMPLETED)
        failed = sum(1 for j in self._jobs.values() if j.status == JobStatus.FAILED)
        return {
            "total_tracked": len(self._jobs),
            "queued": queued,
            "processing": processing,
            "completed": completed,
            "failed": failed,
        }


# Global singleton instance for the application lifecycle
job_queue = JobQueueManager()
