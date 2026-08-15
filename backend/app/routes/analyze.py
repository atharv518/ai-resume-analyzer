from typing import Annotated
from fastapi import APIRouter, File, Form, HTTPException, UploadFile, status
from pydantic import BaseModel, Field

from app.services.extractor import extract_resume_text
from app.services.parser import parse_resume
from app.utils.file_validation import validate_resume_file


router = APIRouter()


class ParsedResume(BaseModel):
    name: str = ""
    email: str = ""
    phone: str = ""
    skills: list[str] = Field(default_factory=list)
    education: list[str] = Field(default_factory=list)
    experience: list[str] = Field(default_factory=list)
    projects: list[str] = Field(default_factory=list)
    certifications: list[str] = Field(default_factory=list)


class AnalyzeResponse(BaseModel):
    success: bool
    message: str
    filename: str
    job_description_provided: bool
    parsed_resume: ParsedResume
    extracted_text: str


@router.post("/analyze", response_model=AnalyzeResponse)
async def analyze_resume(
    resume: Annotated[UploadFile | None, File()] = None,
    job_description: Annotated[str | None, Form()] = None,
) -> AnalyzeResponse:
    """Receive, validate, extract text, and parse basic resume sections."""
    if resume is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Please select a resume file.",
        )

    try:
        filename, extension, file_bytes = await validate_resume_file(resume)
    finally:
        await resume.close()

    # Step 2: Extract text from PDF or DOCX
    extracted_text = extract_resume_text(extension, file_bytes)

    # Step 3: Parse basic fields and sections
    parsed_data = parse_resume(extracted_text)

    return AnalyzeResponse(
        success=True,
        message="Resume extracted and parsed successfully.",
        filename=filename,
        job_description_provided=bool(job_description and job_description.strip()),
        parsed_resume=ParsedResume(**parsed_data),
        extracted_text=extracted_text,
    )
