import io
import re
import docx
import pypdf
from fastapi import HTTPException, status


def clean_linkedin_pdf_artifacts(text: str) -> str:
    """Clean common artifacts from LinkedIn PDF exports (e.g. 'Page X of Y', contact header banners)."""
    if not text:
        return ""
    # Remove "Page X of Y" pagination lines
    cleaned = re.sub(r"(?i)\bpage\s+\d+\s+of\s+\d+\b", "", text)
    # Remove LinkedIn contact header metadata
    cleaned = re.sub(r"(?i)contact\s+www\.linkedin\.com/in/[^\s]+", "", cleaned)
    # Remove "(LinkedIn)" footer annotations
    cleaned = re.sub(r"(?i)\(LinkedIn\)", "", cleaned)
    return cleaned.strip()


def extract_ocr_from_pdf(reader: pypdf.PdfReader) -> str:
    """Attempt OCR extraction on image-only / scanned PDF pages if OCR engine is available."""
    try:
        import pytesseract
        from PIL import Image

        extracted_text_pages: list[str] = []
        for page in reader.pages:
            for image_file in getattr(page, "images", []):
                data = getattr(image_file, "data", None)
                if data is None and isinstance(image_file, dict):
                    data = image_file.get("data")
                if not data:
                    continue

                img = Image.open(io.BytesIO(data))
                ocr_result = pytesseract.image_to_string(img)

                # Gracefully handle string, dictionary, list, or other return types from OCR/mocks
                if isinstance(ocr_result, dict):
                    if "text" in ocr_result:
                        val = ocr_result["text"]
                        ocr_text = " ".join(val) if isinstance(val, list) else str(val)
                    else:
                        ocr_text = " ".join(str(v) for v in ocr_result.values() if v)
                elif isinstance(ocr_result, list):
                    ocr_text = " ".join(str(item) for item in ocr_result if item)
                elif isinstance(ocr_result, str):
                    ocr_text = ocr_result
                else:
                    ocr_text = str(ocr_result) if ocr_result is not None else ""

                if ocr_text.strip():
                    extracted_text_pages.append(ocr_text.strip())

        return "\n\n".join(extracted_text_pages).strip()
    except Exception:
        return ""


def extract_text_from_pdf(file_bytes: bytes) -> str:
    """Extract readable text from PDF bytes with scanned PDF detection and LinkedIn cleaning."""
    try:
        reader = pypdf.PdfReader(io.BytesIO(file_bytes), strict=False)
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Could not read the PDF file. It may be corrupted or in an unsupported format.",
        ) from exc

    if reader.is_encrypted:
        try:
            # Attempt empty password decrypt if standard permissions
            decrypted = reader.decrypt("")
            if decrypted == 0:
                reader.decrypt(b"")
        except Exception:
            pass  # Some PDF readers still allow reading unencrypted streams

    pages_text: list[str] = []
    try:
        for page in reader.pages:
            try:
                page_text = page.extract_text() or ""
                # If standard extraction is very sparse, attempt layout extraction
                if len(page_text.strip().split()) < 5:
                    try:
                        layout_text = page.extract_text(extraction_mode="layout") or ""
                        if len(layout_text.strip().split()) > len(page_text.strip().split()):
                            page_text = layout_text
                    except Exception:
                        pass
                if page_text.strip():
                    pages_text.append(page_text.strip())
            except Exception:
                continue

    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to extract text from the PDF file.",
        ) from exc

    full_text = "\n\n".join(pages_text).strip()

    # Clean null bytes / corrupt characters
    full_text = full_text.replace("\x00", "")

    # If no selectable text was found, attempt OCR
    if not full_text or len(full_text.split()) < 5:
        ocr_result = extract_ocr_from_pdf(reader)
        if ocr_result:
            full_text = ocr_result

    if not full_text:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No readable text could be extracted. The PDF appears to be a scanned image or flattened graphic without a selectable text layer. Please upload a standard text PDF, DOCX, TXT, or RTF file.",
        )

    # Clean LinkedIn PDF export artifacts if present
    return clean_linkedin_pdf_artifacts(full_text)


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


def extract_text_from_txt(file_bytes: bytes) -> str:
    """Extract readable text from plain text (.txt) bytes supporting multiple encodings."""
    encodings = ["utf-8-sig", "utf-8", "utf-16", "latin-1", "cp1252"]
    for enc in encodings:
        try:
            text = file_bytes.decode(enc)
            cleaned = text.strip()
            if cleaned:
                return cleaned
        except (UnicodeDecodeError, ValueError):
            continue

    raise HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST,
        detail="Could not decode the text file. Please ensure it is saved in UTF-8 or standard ASCII format.",
    )


def extract_text_from_rtf(file_bytes: bytes) -> str:
    """Extract clean readable text from Rich Text Format (.rtf) bytes."""
    try:
        raw_str = file_bytes.decode("latin-1", errors="replace")
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to decode RTF document.",
        ) from exc

    # Remove non-text metadata groups
    text = re.sub(r"\\(?:pict|bin|fonttbl|colortbl|stylesheet|info)\b.*?[;}]", "", raw_str, flags=re.DOTALL)

    # Convert Unicode escapes \uN?
    def _replace_unicode(match: re.Match) -> str:
        codepoint = int(match.group(1))
        if codepoint < 0:
            codepoint += 65536
        return chr(codepoint)

    text = re.sub(r"\\u(-?\d+)\??", _replace_unicode, text)

    # Convert hex escapes \'XX
    def _replace_hex(match: re.Match) -> str:
        return bytes.fromhex(match.group(1)).decode("latin-1", errors="replace")

    text = re.sub(r"\\\'([0-9a-fA-F]{2})", _replace_hex, text)

    # Convert line/paragraph breaks
    text = re.sub(r"\\(?:par|line|page)\b", "\n", text)
    text = re.sub(r"\\(?:tab)\b", "\t", text)

    # Remove remaining control words
    text = re.sub(r"\\[a-zA-Z]+-?\d*\s?", "", text)

    # Remove group braces
    text = re.sub(r"[{}]", "", text)

    cleaned_lines = [line.strip() for line in text.splitlines() if line.strip()]
    full_text = "\n".join(cleaned_lines)

    if not full_text:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No readable text could be extracted from the RTF file.",
        )

    return full_text


def extract_resume_text(extension: str, file_bytes: bytes) -> str:
    """Extract text based on file extension (.pdf, .docx, .txt, .rtf)."""
    normalized_ext = extension.lower()
    if normalized_ext == ".pdf":
        return extract_text_from_pdf(file_bytes)
    if normalized_ext == ".docx":
        return extract_text_from_docx(file_bytes)
    if normalized_ext == ".txt":
        return extract_text_from_txt(file_bytes)
    if normalized_ext == ".rtf":
        return extract_text_from_rtf(file_bytes)

    raise HTTPException(
        status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
        detail="Only PDF, DOCX, TXT, and RTF resume files are supported.",
    )
