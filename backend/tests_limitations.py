import io
import asyncio
from fastapi import UploadFile
from starlette.datastructures import Headers

from app.routes.analyze import analyze_resume
from app.services.extractor import extract_text_from_txt, extract_text_from_rtf, clean_linkedin_pdf_artifacts, extract_resume_text
from app.services.job_matcher import extract_dynamic_skills_from_jd, extract_skills_from_text, compare_resume_with_jd
from app.utils.file_validation import validate_resume_file


SAMPLE_TXT_RESUME = """
Alex Mercer
alex.mercer@example.com
(555) 234-5678

EDUCATION
Bachelor of Science in Computer Science, Tech State University (2020 - 2024)

SKILLS
Python, FastAPI, Tauri, LangChain, PostgreSQL, Docker, Git

PROJECTS
Desktop ATS Platform
Built cross-platform AI resume tool with Tauri, Rust, and LangChain for automated scoring. Reduced processing time by 50%.

CERTIFICATIONS
AWS Certified Cloud Practitioner
"""

SAMPLE_RTF_RESUME = r"""{\rtf1\ansi\deff0
{\fonttbl{\f0 Arial;}}
\f0\fs24
Alex Mercer\par
alex.mercer@example.com | (555) 234-5678\par
\b EDUCATION\b0\par
B.S. in Computer Science, Tech State University (2024)\par
\b SKILLS\b0\par
Python, FastAPI, PostgreSQL, Docker, Git, Polars, Mojo\par
\b PROJECTS\b0\par
High-Throughput Analytics Engine\par
Engineered data processing pipeline with Polars and Mojo achieving 10x throughput.\par
\b CERTIFICATIONS\b0\par
AWS Cloud Practitioner\par
}"""

SAMPLE_LINKEDIN_TEXT = """
Contact
www.linkedin.com/in/alexmercer (LinkedIn)
Top Skills
FastAPI
Python
Docker

Alex Mercer
Full-Stack Software Engineer
Tech State University (2020 - 2024)

Experience
Acme Solutions
Software Engineer
Page 1 of 2

Projects
AI Resume Analyzer
Built full-stack ATS resume analysis platform with FastAPI and React.

Education
Bachelor of Science in Computer Science
Page 2 of 2
"""


def test_txt_and_rtf_extraction():
    """Verify text extraction from plain text (.txt) and Rich Text Format (.rtf)."""
    # 1. Plain Text extraction
    txt_bytes = SAMPLE_TXT_RESUME.encode("utf-8")
    extracted_txt = extract_resume_text(".txt", txt_bytes)
    assert "Alex Mercer" in extracted_txt
    assert "Tauri" in extracted_txt
    assert "LangChain" in extracted_txt
    print("[PASS] Plain Text (.txt) Extractor: Successfully extracted clean resume text")

    # 2. RTF extraction
    rtf_bytes = SAMPLE_RTF_RESUME.encode("latin-1")
    extracted_rtf = extract_resume_text(".rtf", rtf_bytes)
    assert "Alex Mercer" in extracted_rtf
    assert "Polars" in extracted_rtf
    assert "Mojo" in extracted_rtf
    print("[PASS] Rich Text Format (.rtf) Extractor: Successfully parsed control words and extracted plain text")


def test_linkedin_pdf_artifact_cleaning():
    """Verify that LinkedIn PDF export artifacts and pagination are cleaned."""
    cleaned = clean_linkedin_pdf_artifacts(SAMPLE_LINKEDIN_TEXT)
    assert "Page 1 of 2" not in cleaned
    assert "Page 2 of 2" not in cleaned
    assert "www.linkedin.com/in/alexmercer" not in cleaned
    assert "Alex Mercer" in cleaned
    print("[PASS] LinkedIn PDF Export Optimizer: Stripped pagination and header watermarks")


def test_dynamic_jd_skill_extraction():
    """Verify that novel, emerging tech skills are dynamically extracted from JD."""
    sample_jd_with_novel_tech = """
    Job Title: AI Applications Engineer
    Requirements:
    - 2+ years of experience with Python and FastAPI
    - Hands-on experience with Tauri, LangChain, and Polars
    - Familiarity with Vector Databases and Mojo
    - Strong knowledge of PostgreSQL and Docker
    """
    dynamic_skills = extract_dynamic_skills_from_jd(sample_jd_with_novel_tech)
    assert "Tauri" in dynamic_skills or any("tauri" in s.lower() for s in dynamic_skills)
    assert "LangChain" in dynamic_skills or any("langchain" in s.lower() for s in dynamic_skills)
    assert "Polars" in dynamic_skills or any("polars" in s.lower() for s in dynamic_skills)

    # Test matching against resume text
    resume_text = "I built applications using Python, Tauri, LangChain, and Polars."
    match_res = compare_resume_with_jd(
        resume_text=resume_text,
        resume_skills=["Python"],
        jd_text=sample_jd_with_novel_tech,
    )
    matching_lower = [s.lower() for s in match_res["matching_skills"]]
    assert "tauri" in matching_lower
    assert "langchain" in matching_lower
    assert "polars" in matching_lower
    print(f"[PASS] Dynamic Skill Extraction: Matched emerging skills ({', '.join(match_res['matching_skills'])})")


async def test_end_to_end_txt_analysis_pipeline():
    """Verify full end-to-end analysis pipeline with a .txt resume."""
    txt_bytes = SAMPLE_TXT_RESUME.encode("utf-8")
    upload_file = UploadFile(
        file=io.BytesIO(txt_bytes),
        filename="alex_resume.txt",
        headers=Headers({"content-type": "text/plain"}),
    )

    response = await analyze_resume(
        resume=upload_file,
        job_description="Looking for a Python and FastAPI developer with LangChain and Tauri experience.",
    )
    assert response.success is True
    assert response.filename == "alex_resume.txt"
    assert response.ats_score is not None
    assert response.ats_score.overall_score > 0
    assert "FastAPI" in response.skill_comparison.matching_skills
    print(f"[PASS] End-to-End TXT Resume Pipeline: Overall ATS Score = {response.ats_score.overall_score}")


async def test_end_to_end_rtf_analysis_pipeline():
    """Verify full end-to-end analysis pipeline with a .rtf resume."""
    rtf_bytes = SAMPLE_RTF_RESUME.encode("latin-1")
    upload_file = UploadFile(
        file=io.BytesIO(rtf_bytes),
        filename="alex_resume.rtf",
        headers=Headers({"content-type": "application/rtf"}),
    )

    response = await analyze_resume(
        resume=upload_file,
        job_description="Looking for a Python and FastAPI developer with Polars and Mojo experience.",
    )
    assert response.success is True
    assert response.filename == "alex_resume.rtf"
    assert response.ats_score is not None
    assert response.ats_score.overall_score > 0
    print(f"[PASS] End-to-End RTF Resume Pipeline: Overall ATS Score = {response.ats_score.overall_score}")


def run_all_limitations_tests():
    print("\n--- RUNNING FUNCTIONAL LIMITATIONS TEST SUITE ---")
    test_txt_and_rtf_extraction()
    test_linkedin_pdf_artifact_cleaning()
    test_dynamic_jd_skill_extraction()
    asyncio.run(test_end_to_end_txt_analysis_pipeline())
    asyncio.run(test_end_to_end_rtf_analysis_pipeline())
    print("\nALL LIMITATIONS TESTS PASSED SUCCESSFULLY! ---\n")


if __name__ == "__main__":
    run_all_limitations_tests()
