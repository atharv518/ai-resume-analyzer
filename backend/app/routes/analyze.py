from fastapi import APIRouter, File, Form, HTTPException, UploadFile, status
from pydantic import BaseModel

from app.utils.file_validation import validate_resume_file


router = APIRouter()


class AnalyzeResponse(BaseModel):
    success: bool
    message: str
    filename: str
    job_description_provided: bool


@router.post("/analyze", response_model=AnalyzeResponse)
async def analyze_resume(
    resume: UploadFile | None = File(default=None),
    job_description: str | None = Form(default=None),
) -> AnalyzeResponse:
    """Receive and validate the upload. Analysis belongs to future project phases."""
    if resume is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Please select a resume file.",
        )

    try:
        filename = await validate_resume_file(resume)
    finally:
        await resume.close()

    return AnalyzeResponse(
        success=True,
        message="Resume received successfully.",
        filename=filename,
        job_description_provided=bool(job_description and job_description.strip()),
    )
