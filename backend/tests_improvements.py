import io
from fastapi.testclient import TestClient
import docx

from app.main import app
from app.services.resume_validator import detect_resume_signals, validate_resume_content

client = TestClient(app)


def test_resume_signals_fresher():
    fresher_text = """
    Alex Mercer
    alex.mercer@example.com | +1 (555) 234-5678 | San Francisco, CA | linkedin.com/in/alexmercer
    
    Education
    B.S. in Computer Science - University of California, Berkeley (2020 - 2024)
    
    Technical Skills
    Languages & Frameworks: Python, FastAPI, JavaScript, React, SQL, HTML, CSS
    Tools: Docker, PostgreSQL, Git, GitHub, REST APIs, Linux
    
    Projects
    AI ATS Resume Analyzer (2024)
    Built a full-stack automated document analysis platform using FastAPI, Python, and React.
    Implemented PDF parsing with pypdf and achieved 95% keyword extraction accuracy.
    
    Certifications
    AWS Certified Cloud Practitioner (2024)
    """
    signals = detect_resume_signals(fresher_text)
    assert signals["has_contact"] is True
    assert signals["has_skills"] is True
    assert signals["has_education"] is True
    assert signals["has_projects"] is True
    assert signals["has_certifications"] is True

    # Validation should succeed without throwing
    validate_resume_content(fresher_text)
    print("[PASS] Fresher resume content validation passed.")


def test_resume_signals_experienced():
    exp_text = """
    Sarah Jenkins
    sarah.jenkins@example.com | +1 (555) 987-6543 | New York, NY | github.com/sarahjenkins
    
    Professional Experience
    Senior Software Engineer - Acme Cloud Solutions (2021 - 2024)
    Architected and deployed enterprise microservices in Python, FastAPI, Docker, and AWS ECS.
    Mentored 4 junior engineers and optimized database queries in PostgreSQL, reducing query latency by 40%.
    
    Software Developer - TechCore Systems (2018 - 2021)
    Developed and maintained scalable RESTful APIs with Python, Django, and PostgreSQL.
    
    Education
    B.S. in Computer Science - Columbia University (2014 - 2018)
    
    Technical Skills
    Python, FastAPI, Django, PostgreSQL, Docker, AWS, Microservices, CI/CD, Redis, Git
    """
    signals = detect_resume_signals(exp_text)
    assert signals["has_contact"] is True
    assert signals["has_skills"] is True
    assert signals["has_education"] is True
    assert signals["has_experience"] is True

    # Validation should succeed without throwing
    validate_resume_content(exp_text)
    print("[PASS] Experienced resume content validation passed.")


def test_resume_content_validation_rejections():
    # 1. Invoice Document
    invoice_text = """
    INVOICE
    Invoice Number: INV-2024-0091
    Date: August 12, 2024
    Bill To: Global Tech Enterprise LLC
    Payment Terms: Net 30 Days
    
    Description                  Quantity     Rate       Amount
    Web Development Consulting         40     $120.00    $4,800.00
    Server Maintenance & DevOps        10     $150.00    $1,500.00
    
    Subtotal: $6,300.00
    Tax (8%): $504.00
    Amount Due: $6,804.00
    
    Remittance Advice: Please send payments via wire transfer to Acme Corp.
    """
    try:
        validate_resume_content(invoice_text)
        assert False, "Invoice should have failed resume content validation"
    except Exception as exc:
        assert "The uploaded document does not appear to be a resume" in str(exc.detail)
        print("[PASS] Invoice rejection confirmed:", exc.detail)

    # 2. Homework / Essay Assignment
    homework_text = """
    History of Computing - Assignment 2
    Student Name: John
    Date: September 2024
    
    Question 1: Describe the architectural differences between RISC and CISC instruction set architectures.
    Reduced Instruction Set Computer (RISC) architectures emphasize simple instructions that can be executed
    within one clock cycle. In contrast, Complex Instruction Set Computer (CISC) architectures provide single
    instructions that can execute multiple low-level operations such as memory load, arithmetic operation, and memory store.
    
    Conclusion:
    Modern processors often blend both approaches by decoding CISC instructions into internal RISC-like micro-operations.
    """
    try:
        validate_resume_content(homework_text)
        assert False, "Homework assignment should have failed resume content validation"
    except Exception as exc:
        assert "The uploaded document does not appear to be a resume" in str(exc.detail)
        print("[PASS] Homework assignment rejection confirmed:", exc.detail)

    # 3. Short random text
    short_text = "This is a random short text note."
    try:
        validate_resume_content(short_text)
        assert False, "Short text should have failed resume content validation"
    except Exception as exc:
        assert "The uploaded document does not appear to be a resume" in str(exc.detail)
        print("[PASS] Short text rejection confirmed:", exc.detail)


def test_api_general_audit_vs_jd_audit():
    # Create docx resume bytes in memory
    doc = docx.Document()
    doc.add_heading("Alex Mercer", level=1)
    doc.add_paragraph("alex.mercer@example.com | +1 (555) 234-5678 | San Francisco, CA")
    doc.add_heading("Education", level=2)
    doc.add_paragraph("B.S. in Computer Science - University of California, Berkeley (2020 - 2024)")
    doc.add_heading("Technical Skills", level=2)
    doc.add_paragraph("Python, FastAPI, JavaScript, React, SQL, HTML, CSS, Git, PostgreSQL")
    doc.add_heading("Projects", level=2)
    doc.add_paragraph("AI Resume Analyzer\nBuilt a full-stack automated document analysis platform using FastAPI, Python, and React.")

    bio = io.BytesIO()
    doc.save(bio)
    bio.seek(0)
    resume_bytes = bio.getvalue()

    # 1. Test General Profile Audit (No JD provided)
    res_general = client.post(
        "/api/analyze",
        files={"resume": ("resume.docx", resume_bytes, "application/vnd.openxmlformats-officedocument.wordprocessingml.document")},
        data={"job_description": ""}
    )
    assert res_general.status_code == 200, res_general.text
    data_general = res_general.json()
    assert data_general["success"] is True
    assert data_general["job_description_provided"] is False
    assert len(data_general["skill_comparison"]["matching_skills"]) > 0
    # Must NOT have missing skills or missing keywords in general audit
    assert data_general["skill_comparison"]["missing_skills"] == []
    assert data_general["skill_comparison"]["missing_keywords"] == []
    print("[PASS] General Audit API returns empty missing_skills & missing_keywords.")

    # 2. Test Target JD Audit (JD provided with missing requirements)
    jd_text = """
    Senior Cloud Engineer
    Requirements:
    - 3+ years experience with Python, FastAPI, Docker, Kubernetes, AWS, Terraform, Kafka
    - Bachelor's degree in Computer Science
    """
    res_jd = client.post(
        "/api/analyze",
        files={"resume": ("resume.docx", resume_bytes, "application/vnd.openxmlformats-officedocument.wordprocessingml.document")},
        data={"job_description": jd_text}
    )
    assert res_jd.status_code == 200, res_jd.text
    data_jd = res_jd.json()
    assert data_jd["success"] is True
    assert data_jd["job_description_provided"] is True
    assert len(data_jd["skill_comparison"]["matching_skills"]) > 0
    # Must have missing skills detected against JD
    assert len(data_jd["skill_comparison"]["missing_skills"]) > 0
    assert any("docker" in s.lower() or "aws" in s.lower() or "kubernetes" in s.lower() for s in data_jd["skill_comparison"]["missing_skills"])
    print("[PASS] Target JD Audit API correctly detects missing skills:", data_jd["skill_comparison"]["missing_skills"])

    # 3. Test Non-Resume Upload via API (Invoice docx)
    doc_inv = docx.Document()
    doc_inv.add_heading("INVOICE #9821", level=1)
    doc_inv.add_paragraph("Bill To: Acme Corp | Payment Terms: Net 30 Days")
    doc_inv.add_paragraph("Amount Due: $5,000.00 | Subtotal: $4,500.00 | Tax: $500.00")
    bio_inv = io.BytesIO()
    doc_inv.save(bio_inv)
    bio_inv.seek(0)

    res_inv = client.post(
        "/api/analyze",
        files={"resume": ("invoice.docx", bio_inv.getvalue(), "application/vnd.openxmlformats-officedocument.wordprocessingml.document")},
        data={"job_description": ""}
    )
    assert res_inv.status_code == 400
    assert "The uploaded document does not appear to be a resume. Please upload a valid resume." in res_inv.json()["detail"]
    print("[PASS] API non-resume rejection returned HTTP 400 with expected error detail.")


if __name__ == "__main__":
    print("Running Improvements Test Suite...")
    test_resume_signals_fresher()
    test_resume_signals_experienced()
    test_resume_content_validation_rejections()
    test_api_general_audit_vs_jd_audit()
    print("\nALL IMPROVEMENT TESTS PASSED SUCCESSFULLY!")
