import io
from fastapi import HTTPException, status
import pypdf
import docx


def extract_text_from_pdf(file_bytes: bytes) -> str:
    """Extract readable text from PDF bytes."""
    try:
        reader = pypdf.PdfReader(io.BytesIO(file_bytes))
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Could not read the PDF file. It may be corrupted or invalid.",
        ) from exc

    if reader.is_encrypted:
        try:
            # Attempt empty password decrypt if standard permissions
            decrypted = reader.decrypt("")
            if not decrypted:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="The PDF file is password-protected and cannot be analyzed.",
                )
        except Exception as exc:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="The PDF file is password-protected and cannot be analyzed.",
            ) from exc

    pages_text: list[str] = []
    try:
        for page_idx, page in enumerate(reader.pages):
            page_text = page.extract_text() or ""
            if page_text.strip():
                pages_text.append(page_text.strip())
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to extract text from the PDF file.",
        ) from exc

    full_text = "\n\n".join(pages_text).strip()
    if not full_text:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No readable text could be extracted. The PDF may be scanned or image-only.",
        )

    return full_text


def extract_text_from_docx(file_bytes: bytes) -> str:
    """Extract readable text from DOCX bytes."""
    try:
        doc = docx.Document(io.BytesIO(file_bytes))
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Could not read the DOCX file. It may be corrupted or invalid.",
        ) from exc

    lines: list[str] = []
    try:
        for paragraph in doc.paragraphs:
            text = paragraph.text.strip()
            if text:
                lines.append(text)

        # Extract text from tables if any
        for table in doc.tables:
            for row in table.rows:
                row_text = [cell.text.strip() for cell in row.cells if cell.text.strip()]
                if row_text:
                    lines.append(" | ".join(row_text))
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to extract text from the DOCX file.",
        ) from exc

    full_text = "\n".join(lines).strip()
    if not full_text:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No readable text could be extracted from the DOCX file.",
        )

    return full_text


def extract_resume_text(extension: str, file_bytes: bytes) -> str:
    """Extract text based on file extension (.pdf or .docx)."""
    normalized_ext = extension.lower()
    if normalized_ext == ".pdf":
        return extract_text_from_pdf(file_bytes)
    if normalized_ext == ".docx":
        return extract_text_from_docx(file_bytes)

    raise HTTPException(
        status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
        detail="Only PDF and DOCX resume files are supported.",
    )
