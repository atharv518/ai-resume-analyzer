from pathlib import Path

from fastapi import HTTPException, UploadFile, status


MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB
ALLOWED_EXTENSIONS = {".pdf", ".docx"}


async def validate_resume_file(resume: UploadFile) -> tuple[str, str, bytes]:
    """Validate the selected resume's name, extension, and byte size.
    
    Returns a tuple of (filename, extension, uploaded_bytes).
    """
    filename = resume.filename or ""

    if not filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The uploaded resume needs a filename.",
        )

    extension = Path(filename).suffix.lower()
    if extension not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail="Only PDF and DOCX resume files are supported.",
        )

    # Read at most one byte beyond the limit, so an oversized upload is detected
    # without reading a potentially much larger file into memory.
    uploaded_bytes = await resume.read(MAX_FILE_SIZE + 1)
    if len(uploaded_bytes) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="The resume file must be 10 MB or smaller.",
        )

    if not uploaded_bytes:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The uploaded resume file is empty.",
        )

    return filename, extension, uploaded_bytes

