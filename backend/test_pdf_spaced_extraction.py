"""Regression and unit tests for PDF extraction of character-spaced and fragmented resumes."""

import io
import os
import unittest
from unittest.mock import patch, MagicMock
from fastapi import HTTPException, UploadFile
from starlette.datastructures import Headers
from PIL import Image

from app.services.extractor import (
    extract_resume_text,
    extract_text_from_pdf,
    is_suspicious_extraction,
    reconstruct_spaced_text,
    render_pdf_pages_to_images,
    extract_ocr_from_pdf,
)
from app.utils.file_validation import validate_resume_file
from app.routes.analyze import analyze_resume, process_resume_pipeline


# Standard normal resume PDF bytes
SAMPLE_NORMAL_RESUME_TEXT = """
Alex Mercer
alex.mercer@example.com | (555) 234-5678 | San Francisco, CA

SUMMARY
Experienced Software Engineer with 4 years of expertise in Python, FastAPI, Docker, and PostgreSQL.

TECHNICAL SKILLS
Languages: Python, JavaScript, TypeScript, SQL
Frameworks & Tools: FastAPI, React, Docker, Kubernetes, AWS, Git, PostgreSQL

EXPERIENCE
Software Engineer - Acme Systems
- Developed scalable REST APIs using FastAPI and PostgreSQL handling 500+ requests per second.
- Deployed microservices on AWS ECS using Docker and GitHub Actions CI/CD pipelines.

PROJECTS
AI Resume Analyzer - GitHub
- Built full-stack ATS analyzer using FastAPI and React with automated document parsing.

EDUCATION
Bachelor of Science in Computer Science - University of California, Berkeley (2020)
"""

def generate_simple_pdf_bytes(text_lines: list[tuple[int, str]]) -> bytes:
    """Generate minimal valid PDF bytes with custom text lines."""
    stream_ops = ["BT\n50 750 Td\n"]
    for i, (size, text) in enumerate(text_lines):
        escaped = text.replace("(", "\\(").replace(")", "\\)")
        if i == 0:
            stream_ops.append(f"/F1 {size} Tf\n({escaped}) Tj\n")
        else:
            stream_ops.append(f"0 -18 Td\n/F1 {size} Tf\n({escaped}) Tj\n")
    stream_ops.append("ET\n")

    stream_content = "".join(stream_ops).encode("latin-1")
    stream_len = len(stream_content)

    return f"""%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>
endobj
4 0 obj
<< /Length {stream_len} >>
stream
""".encode("latin-1") + stream_content + f"""endstream
endobj
5 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
endobj
xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000224 00000 n 
0000000450 00000 n 
trailer
<< /Size 6 /Root 1 0 R >>
startxref
550
%%EOF
""".encode("latin-1")


class TestPDFSpacedExtraction(unittest.IsolatedAsyncioTestCase):
    synthetic_pdf_path: str

    def setUp(self):
        # Locate synthetic PDF fixture
        possible_paths = [
            "test_files/synthetic_spaced_text_resume.pdf",
            "../test_files/synthetic_spaced_text_resume.pdf",
            os.path.join(os.path.dirname(__file__), "test_files", "synthetic_spaced_text_resume.pdf"),
            os.path.join(os.path.dirname(__file__), "..", "test_files", "synthetic_spaced_text_resume.pdf"),
        ]
        found_path: str | None = None
        for p in possible_paths:
            if os.path.exists(p):
                found_path = p
                break
        if not found_path:
            self.fail("synthetic_spaced_text_resume.pdf fixture must exist")
        self.synthetic_pdf_path = found_path

    def test_extraction_quality_detection(self):
        """Verify is_suspicious_extraction correctly classifies good vs suspicious text."""
        # 1. Normal resume text should be GOOD (not suspicious)
        good_text = (
            "Alex Mercer\nalex.mercer@example.com | (555) 234-5678\n"
            "SUMMARY\nExperienced Software Engineer specializing in Python, FastAPI, and Docker.\n"
            "TECHNICAL SKILLS\nProgramming: Python, JavaScript, TypeScript, SQL\n"
            "EXPERIENCE\nSoftware Engineer at Acme Systems. Built REST APIs.\n"
            "PROJECTS\nResume Insight Tool - Automated document analysis.\n"
            "EDUCATION\nBachelor of Science in Computer Science"
        )
        self.assertFalse(is_suspicious_extraction(good_text), "Normal text should not be flagged as suspicious")

        # 2. Spaced text should be BAD (suspicious)
        spaced_text = (
            "A L E X   J O H N S O N\n"
            "P u n e ,   I n d i a   |   a l e x . j o h n s o n @ e x a m p l e . c o m\n"
            "S U M M A R Y\n"
            "F i n a l - y e a r   C o m p u t e r   E n g i n e e r i n g   s t u d e n t\n"
            "T E C H N I C A L   S K I L L S\n"
            "P r o g r a m m i n g :   P y t h o n ,   J a v a ,   J a v a S c r i p t"
        )
        self.assertTrue(is_suspicious_extraction(spaced_text), "Character-spaced text must be flagged as suspicious")

        # 3. Vertical single-character lines should be BAD (suspicious)
        vertical_text = "A\nL\nE\nX\n\nJ\nO\nH\nN\nS\nO\nN\n\nP\nu\nn\ne"
        self.assertTrue(is_suspicious_extraction(vertical_text), "Vertical character lines must be flagged as suspicious")

        # 4. Empty / very short text should be BAD
        self.assertTrue(is_suspicious_extraction(""), "Empty text must be suspicious")
        self.assertTrue(is_suspicious_extraction("Hello world"), "Short text (<5 words) must be suspicious")
        print("[PASS] is_suspicious_extraction quality checks passed across all scenarios")

    def test_reconstruct_spaced_text(self):
        """Verify reconstruct_spaced_text recovers words from character-spaced streams."""
        spaced_input = (
            "A L E X   J O H N S O N\n"
            "P u n e ,   I n d i a   |   a l e x . j o h n s o n @ e x a m p l e . c o m\n"
            "S U M M A R Y\n"
            "F i n a l - y e a r   C o m p u t e r   E n g i n e e r i n g   s t u d e n t\n"
            "T E C H N I C A L   S K I L L S\n"
            "P r o g r a m m i n g :   P y t h o n ,   J a v a ,   J a v a S c r i p t ,   C + +"
        )
        recovered = reconstruct_spaced_text(spaced_input)
        self.assertIn("ALEX JOHNSON", recovered)
        self.assertIn("Pune, India", recovered)
        self.assertIn("alex.johnson@example.com", recovered)
        self.assertIn("SUMMARY", recovered)
        self.assertIn("TECHNICAL SKILLS", recovered)
        self.assertIn("Python", recovered)
        self.assertIn("C++", recovered)
        print("[PASS] reconstruct_spaced_text successfully reconstructed clean strings")

    def test_normal_pdf_extraction(self):
        """Scenario 1: Standard text PDF should continue working seamlessly via pypdf."""
        normal_lines = [
            (14, "Alex Mercer"),
            (10, "alex.mercer@example.com | (555) 234-5678"),
            (12, "SUMMARY"),
            (10, "Software engineer with 4 years of experience building Python and FastAPI applications."),
            (12, "TECHNICAL SKILLS"),
            (10, "Python, FastAPI, Docker, PostgreSQL, React, AWS, Git"),
            (12, "EXPERIENCE"),
            (10, "Software Engineer - Acme Corp. Built backend REST APIs."),
            (12, "PROJECTS"),
            (10, "AI Resume Tool - Analyzes documents and scores ATS compatibility."),
            (12, "EDUCATION"),
            (10, "B.S. in Computer Science - Tech University (2020)"),
        ]
        pdf_bytes = generate_simple_pdf_bytes(normal_lines)
        extracted = extract_resume_text(".pdf", pdf_bytes)
        self.assertIn("Alex Mercer", extracted)
        self.assertIn("TECHNICAL SKILLS", extracted)
        self.assertIn("FastAPI", extracted)
        print("[PASS] Scenario 1: Normal PDF text extracted cleanly without unnecessary OCR")

    def test_synthetic_character_spaced_pdf(self):
        """Scenario 2: Synthetic character-spaced PDF is detected as suspicious and recovered."""
        with open(self.synthetic_pdf_path, "rb") as f:
            pdf_bytes = f.read()

        extracted = extract_resume_text(".pdf", pdf_bytes)
        # Verify required strings are recovered as normal readable text
        self.assertIn("ALEX JOHNSON", extracted)
        self.assertIn("TECHNICAL SKILLS", extracted)
        self.assertIn("EXPERIENCE", extracted)
        self.assertIn("PROJECTS", extracted)
        self.assertIn("EDUCATION", extracted)
        self.assertIn("CERTIFICATIONS", extracted)
        self.assertIn("alex.johnson@example.com", extracted)
        self.assertIn("Python", extracted)
        self.assertIn("PostgreSQL", extracted)
        print("[PASS] Scenario 2: Character-spaced synthetic PDF successfully recovered")

    def test_scanned_pdf_with_ocr_available(self):
        """Scenario 3A: Scanned/image PDF when OCR is available extracts text via OCR."""
        # Create minimal PDF with an empty page
        blank_pdf = generate_simple_pdf_bytes([(12, "   ")])

        mock_ocr_text = (
            "ALEX JOHNSON\n"
            "alex.johnson@example.com | Pune, India\n"
            "SUMMARY\nComputer Engineering student.\n"
            "TECHNICAL SKILLS\nPython, Docker, SQL, React\n"
            "EXPERIENCE\nSoftware Intern at Tech Corp.\n"
            "PROJECTS\nResume Analyzer Project\n"
            "EDUCATION\nBachelor of Engineering"
        )

        with patch("app.services.extractor.extract_ocr_from_pdf", return_value=mock_ocr_text):
            extracted = extract_text_from_pdf(blank_pdf)
            self.assertIn("ALEX JOHNSON", extracted)
            self.assertIn("TECHNICAL SKILLS", extracted)
            self.assertIn("Python", extracted)
        print("[PASS] Scenario 3A: Scanned PDF successfully processed when OCR is available")

    def test_scanned_pdf_with_ocr_unavailable(self):
        """Scenario 3B: Scanned/image PDF when OCR is unavailable raises controlled HTTP 400 error."""
        blank_pdf = generate_simple_pdf_bytes([(12, "   ")])

        with patch("app.services.extractor.extract_ocr_from_pdf", return_value=""):
            with self.assertRaises(HTTPException) as ctx:
                extract_text_from_pdf(blank_pdf)
            self.assertEqual(ctx.exception.status_code, 400)
            self.assertIn("scanned image", ctx.exception.detail)
        print("[PASS] Scenario 3B: Scanned PDF without OCR raises controlled HTTP 400 error")

    def test_corrupted_pdf_handling(self):
        """Scenario 4: Corrupted PDF bytes produce controlled HTTP 400."""
        corrupt_bytes = b"%PDF-1.4 corrupted garbage binary stream that cannot be parsed %%EOF"
        with self.assertRaises(HTTPException) as ctx:
            extract_text_from_pdf(corrupt_bytes)
        self.assertEqual(ctx.exception.status_code, 400)
        self.assertIn("Could not read the PDF file", ctx.exception.detail)
        print("[PASS] Scenario 4: Corrupted PDF produced controlled HTTP 400")

    async def test_oversized_pdf_validation(self):
        """Scenario 5: Oversized file exceeding 10 MB is rejected with HTTP 413."""
        # 10 MB + 10 bytes
        oversized_data = b"%PDF" + b"0" * (10 * 1024 * 1024 + 10)
        upload = UploadFile(
            file=io.BytesIO(oversized_data),
            filename="large_resume.pdf",
            headers=Headers({"content-type": "application/pdf"}),
        )
        with self.assertRaises(HTTPException) as ctx:
            await validate_resume_file(upload)
        self.assertEqual(ctx.exception.status_code, 413)
        self.assertIn("10 MB or smaller", ctx.exception.detail)
        print("[PASS] Scenario 5: Oversized PDF correctly rejected with HTTP 413")

    def test_non_pdf_formats_no_regression(self):
        """Scenario 6: Plain text (.txt) and RTF (.rtf) extractions do not regress."""
        txt_content = (
            "Alex Mercer\n"
            "alex.mercer@example.com | (555) 234-5678\n"
            "Summary: Full stack developer.\n"
            "Skills: Python, FastAPI, React, SQL\n"
            "Experience: Software Engineer at Acme\n"
            "Education: B.S. in Computer Science"
        ).encode("utf-8")
        txt_extracted = extract_resume_text(".txt", txt_content)
        self.assertIn("Alex Mercer", txt_extracted)
        self.assertIn("FastAPI", txt_extracted)

        rtf_content = rb"{\rtf1\ansi Alex Mercer\par Skills: Python, FastAPI, SQL\par Education: B.S. CS}"
        rtf_extracted = extract_resume_text(".rtf", rtf_content)
        self.assertIn("Alex Mercer", rtf_extracted)
        self.assertIn("FastAPI", rtf_extracted)
        print("[PASS] Scenario 6: Non-PDF formats (TXT, RTF) continue working without regression")

    async def test_end_to_end_analyze_pipeline_synthetic_pdf(self):
        """Scenario 7: Full pipeline analysis of synthetic character-spaced PDF."""
        with open(self.synthetic_pdf_path, "rb") as f:
            pdf_bytes = f.read()

        jd_text = (
            "We are looking for a Software Developer with experience in Python, REST APIs, "
            "PostgreSQL, Git, Docker, and full-stack development."
        )

        res = await process_resume_pipeline(
            extension=".pdf",
            file_bytes=pdf_bytes,
            filename="synthetic_spaced_text_resume.pdf",
            clean_jd=jd_text,
        )

        self.assertTrue(res["success"])
        self.assertEqual(res["parsed_resume"]["name"], "ALEX JOHNSON")
        self.assertEqual(res["parsed_resume"]["email"], "alex.johnson@example.com")
        self.assertIn("Python", res["parsed_resume"]["skills"])
        self.assertIn("PostgreSQL", res["parsed_resume"]["skills"])
        self.assertGreater(len(res["parsed_resume"]["parsed_projects"]), 0)
        self.assertIsNotNone(res["ats_score"])
        self.assertGreater(res["ats_score"]["overall_score"], 50)
        self.assertGreater(res["skill_comparison"]["skill_match_percentage"], 50)
        print(f"[PASS] Scenario 7: End-to-End API Pipeline succeeded with ATS Score = {res['ats_score']['overall_score']}")


if __name__ == "__main__":
    unittest.main()
