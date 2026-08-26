import re
from pathlib import Path
from fastapi import HTTPException, UploadFile, status

MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB
ALLOWED_EXTENSIONS = {".pdf", ".docx", ".txt", ".rtf"}

# Magic byte signatures for structured binary file types
MAGIC_SIGNATURES: dict[str, bytes] = {
    ".pdf": b"%PDF",
    ".docx": b"PK\x03\x04",
    ".rtf": b"{\\rtf",
}


def sanitize_filename(filename: str) -> str:
    """Sanitize uploaded filename to prevent path traversal and XSS injection."""
    # 1. Normalize slashes and extract base file name
    normalized = filename.replace("\\", "/")
    base_name = normalized.split("/")[-1].strip()

    # 2. Strip any characters that are not alphanumeric, spaces, dots, hyphens, or underscores
    clean_name = re.sub(r"[^\w\s\.\-]", "", base_name).strip()

    # 3. Normalize whitespace and prevent multiple consecutive dots
    clean_name = re.sub(r"\s+", " ", clean_name)
    clean_name = re.sub(r"\.{2,}", ".", clean_name)

    # 4. Extract or determine extension
    ext = ""
    if "." in base_name:
        ext = "." + base_name.split(".")[-1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        ext = ".pdf"

    # 5. Check if stem is empty or dot-only
    stem = clean_name.rsplit(".", 1)[0].strip() if "." in clean_name else clean_name
    if not stem or stem.startswith("."):
        clean_name = f"resume{ext}"
    elif not clean_name.lower().endswith(ext):
        clean_name = f"{stem}{ext}"

    return clean_name[:255]


async def validate_resume_file(resume: UploadFile) -> tuple[str, str, bytes]:
    """Validate the selected resume's name, extension, byte size, and format signature.
    
    Returns a tuple of (sanitized_filename, extension, uploaded_bytes).
    """
    raw_filename = resume.filename or ""

    if not raw_filename.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The uploaded resume needs a filename.",
        )

    extension = Path(raw_filename).suffix.lower()
    if extension not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail="Only PDF, DOCX, TXT, and RTF resume files are supported.",
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

    # Validate magic bytes signature against expected structure (allowing up to 1024 bytes per ISO specs)
    if extension == ".pdf":
        if b"%PDF" not in uploaded_bytes[:1024]:
            raise HTTPException(
                status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
                detail="The uploaded file content does not match a valid PDF format.",
            )
    elif extension == ".docx":
        if not (uploaded_bytes.startswith(b"PK\x03\x04") or b"PK\x03\x04" in uploaded_bytes[:512]):
            raise HTTPException(
                status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
                detail="The uploaded file content does not match a valid DOCX format.",
            )
    elif extension == ".rtf":
        if not (uploaded_bytes.startswith(b"{\\rtf") or b"{\\rtf" in uploaded_bytes[:512]):
            raise HTTPException(
                status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
                detail="The uploaded file content does not match a valid RTF format.",
            )

    # For .txt files, verify it is readable text and not binary disguised as TXT
    if extension == ".txt":
        # If the file contains null bytes, it's likely a disguised binary file
        if b"\x00" in uploaded_bytes[:1024]:
            raise HTTPException(
                status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
                detail="The uploaded text file appears to contain binary data.",
            )

    sanitized = sanitize_filename(raw_filename)
    return sanitized, extension, uploaded_bytes
