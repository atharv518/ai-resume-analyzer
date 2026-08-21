import io
import asyncio
from fastapi import UploadFile
from starlette.datastructures import Headers

from app.routes.analyze import analyze_resume
from app.services.parser import parse_resume, extract_structured_projects, clean_line, is_bullet_line
from app.services.experience_detector import classify_experience_text
from app.services.ats_scorer import calculate_ats_score
from app.services.ai_analyzer import analyze_with_ai


SYNTHETIC_SIMULATION_RESUME_TEXT = """JORDAN T. AVERY
Seattle, WA | 555-019-2834 | jordan.avery@example.com
LinkedIn: https://www.linkedin.com/in/jordan-avery-demo | GitHub: https://github.com/jordanavery-demo
EDUCATION
Pacific Northwest University of Technology
Bachelor of Science (Information Technology) | Graduating: 2027
TECHNICAL SKILLS
Languages: Python, JavaScript, C, HTML, CSS
Frameworks: Flask, React
Databases: PostgreSQL, MongoDB
Tools: Git, GitHub, VS Code, Postman
Core: OOP, DBMS, Operating Systems, Computer Networks
PROJECTS
• Cloud Document Analyzer – Built an automated document analysis platform that evaluates resumes against
job descriptions, generates compatibility scores, provides role-specific and general feedback, and supports PDF
resume uploads.
• Distributed CDN Simulator – Developed a Flask-based CDN simulator with origin server, regional edge
nodes, intelligent routing, caching (TTL), failover, health monitoring, and an interactive dashboard
demonstrating distributed system concepts.
• Real-time Stream Monitor – Built a Python application that detects video latency fluctuations and triggers
alerts using computer vision concepts.
CERTIFICATIONS
• JPMorgan Chase & Co. – Software Engineering Job Simulation (Forage)
Completed practical tasks involving project setup, Kafka integration, H2 database integration, REST
API integration, and REST API controllers in a simulated industry environment.
• Global Tech Skills Academy – AI Foundation
Learned fundamentals of AI, Generative AI essentials, prompt engineering basics, AI tools, and
responsible AI through hands-on learning.
LANGUAGES
English | Spanish | French"""


def test_clean_line_and_bullet_detection():
    """Verify clean_line and is_bullet_line handle bullets and special company names with & Co."""
    assert is_bullet_line("• JPMorgan Chase & Co. – Software Engineering Job Simulation (Forage)") is True
    assert is_bullet_line("  * Goldman Sachs & Co. Software Simulation") is True
    assert is_bullet_line("1. Python Certification") is True
    assert is_bullet_line("Completed practical tasks involving project setup...") is False

    cleaned = clean_line("• JPMorgan Chase & Co. – Software Engineering Job Simulation (Forage)")
    assert cleaned == "JPMorgan Chase & Co. – Software Engineering Job Simulation (Forage)"
    assert "JPMorgan Chase & Co." in cleaned
    print("[PASS] clean_line & is_bullet_line")


def test_simulation_fresher_resume_parsing():
    """Verify resume parses certifications and projects without line fragmentation."""
    parsed = parse_resume(SYNTHETIC_SIMULATION_RESUME_TEXT)

    # Name and Contact
    assert parsed["name"] == "JORDAN T. AVERY"
    assert parsed["email"] == "jordan.avery@example.com"
    assert parsed["phone"] == "555-019-2834"

    # Certifications: Must have exactly 2 cohesive certification entries, NOT 6 fragmented lines
    assert len(parsed["certifications"]) == 2, f"Expected 2 certifications, got {len(parsed['certifications'])}: {parsed['certifications']}"

    cert1 = parsed["certifications"][0]
    assert "JPMorgan Chase & Co." in cert1
    assert "Software Engineering Job Simulation (Forage)" in cert1
    assert "Kafka integration" in cert1
    assert not cert1.startswith("e Engineering")
    assert not cert1.startswith("& Co.")

    cert2 = parsed["certifications"][1]
    assert "Global Tech Skills Academy" in cert2
    assert "AI Foundation" in cert2
    assert "Generative AI" in cert2

    # Projects: Must have exactly 3 distinct structured projects
    assert len(parsed["projects"]) == 3, f"Expected 3 projects, got {len(parsed['projects'])}"
    print(f"[PASS] Synthetic Resume Parsing: {len(parsed['certifications'])} certifications, {len(parsed['projects'])} projects")


def test_simulation_virtual_experience_classification():
    """Verify virtual experience classification without string corruption or false professional experience."""
    parsed = parse_resume(SYNTHETIC_SIMULATION_RESUME_TEXT)
    exp_class = classify_experience_text(
        experience_lines=parsed["experience"],
        projects_lines=parsed["projects"],
        full_text=SYNTHETIC_SIMULATION_RESUME_TEXT,
        certifications_lines=parsed["certifications"],
    )

    # 1. Classified as fresher
    assert exp_class["candidate_type"] == "fresher"

    # 2. Classified as virtual experience
    assert exp_class["has_virtual_experience"] is True

    # 3. NOT counted as professional employment experience
    assert exp_class["has_professional_experience"] is False
    assert exp_class["has_internship_experience"] is False
    assert exp_class["include_experience_section"] is False
    assert len(exp_class["professional_items"]) == 0

    # 4. Virtual simulation items: Exactly 1 entry, completely uncorrupted
    assert len(exp_class["virtual_simulation_items"]) == 1, f"Expected 1 virtual simulation item, got {len(exp_class['virtual_simulation_items'])}: {exp_class['virtual_simulation_items']}"
    item = exp_class["virtual_simulation_items"][0]
    assert "JPMorgan Chase & Co." in item
    assert "Software Engineering Job Simulation (Forage)" in item
    assert "Kafka integration" in item

    # Verify no corrupted prefix exists
    assert not item.startswith("e Engineering")
    assert not item.startswith("& Co.")

    print(f"[PASS] Virtual Experience Classification: candidate_type={exp_class['candidate_type']}, has_virtual_experience={exp_class['has_virtual_experience']}")


def test_generic_company_names_and_multiline_certifications():
    """Verify generic support for other company names with & Co., long titles, and multi-line descriptions."""
    test_resume = """Jane Doe
jane.doe@example.com | 123-456-7890
EDUCATION
B.S. in Information Systems, 2024
SKILLS
Python, Java, Spring Boot
CERTIFICATIONS
• McKinsey & Company – Forward Leadership Program (Forage)
Completed 6 practical problem-solving and digital capability modules across strategy and tech transformation.
• Goldman Sachs & Co. – Software Engineering Virtual Experience Program
Completed tasks in password security, encryption algorithms, and system optimization.
• AWS Certified Solutions Architect – Associate (SAA-C03)
Comprehensive cloud architecture certification covering VPC, EC2, S3, and IAM security.
"""
    parsed = parse_resume(test_resume)
    assert len(parsed["certifications"]) == 3

    exp_class = classify_experience_text(
        experience_lines=parsed["experience"],
        projects_lines=parsed["projects"],
        full_text=test_resume,
        certifications_lines=parsed["certifications"],
    )

    assert exp_class["has_virtual_experience"] is True
    assert exp_class["has_professional_experience"] is False
    assert len(exp_class["virtual_simulation_items"]) == 2  # McKinsey & Goldman Sachs
    assert "McKinsey & Company" in exp_class["virtual_simulation_items"][0]
    assert "Goldman Sachs & Co." in exp_class["virtual_simulation_items"][1]
    print("[PASS] Generic Company Names (& Co., & Company) and Multi-line Certifications")


async def test_end_to_end_analyze_with_simulation_payload():
    """Verify the /api/analyze route response on synthetic fresher simulation resume."""
    file_bytes = SYNTHETIC_SIMULATION_RESUME_TEXT.encode("utf-8")
    # Wrap in docx or mock analyze
    import docx
    doc = docx.Document()
    for line in SYNTHETIC_SIMULATION_RESUME_TEXT.splitlines():
        if line.strip():
            doc.add_paragraph(line)
    doc_io = io.BytesIO()
    doc.save(doc_io)
    doc_bytes = doc_io.getvalue()

    upload_file = UploadFile(
        file=io.BytesIO(doc_bytes),
        filename="simulation_fresher_resume.docx",
        headers=Headers({"content-type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document"})
    )

    response = await analyze_resume(resume=upload_file, job_description="")
    assert response.success is True
    assert response.parsed_resume.name == "JORDAN T. AVERY"
    assert len(response.parsed_resume.certifications) == 2
    assert response.experience_analysis is not None
    assert response.experience_analysis.candidate_type == "fresher"
    assert response.experience_analysis.has_virtual_experience is True
    assert response.experience_analysis.has_professional_experience is False
    assert response.experience_analysis.include_experience_section is False
    assert len(response.experience_analysis.virtual_simulation_items) == 1
    assert "JPMorgan Chase & Co." in response.experience_analysis.virtual_simulation_items[0]
    # pyrefly: ignore [missing-attribute]
    print(f"[PASS] End-to-End Analyze API with Synthetic Resume Payload: Score={response.ats_score.overall_score}")


async def main():
    test_clean_line_and_bullet_detection()
    test_simulation_fresher_resume_parsing()
    test_simulation_virtual_experience_classification()
    test_generic_company_names_and_multiline_certifications()
    await test_end_to_end_analyze_with_simulation_payload()
    print("\nALL REGRESSION TESTS FOR CERTIFICATIONS & VIRTUAL EXPERIENCE PASSED!")


if __name__ == "__main__":
    asyncio.run(main())
