import asyncio
import io
from fastapi import UploadFile
from starlette.datastructures import Headers

from app.routes.analyze import analyze_resume
from app.services.parser import (
    extract_structured_projects,
    parse_resume,
    segment_sections,
    is_explicitly_ongoing,
)
from app.services.experience_detector import classify_experience_text
from app.services.ai_analyzer import generate_fallback_analysis


def test_resume_a_three_projects():
    """Resume A: 3 normal projects -> 3 displayed, AI analyzes 3."""
    text = """
John Doe
john.doe@example.com
+1 555-123-4567

PROJECTS
Project Alpha – Developed a real-time analytics dashboard with React and WebSockets.
Project Beta: Built a microservices architecture using Python and FastAPI.
Project Gamma | Created an automated CI/CD pipeline deploying Docker containers to AWS.

EDUCATION
B.S. in Computer Science, Tech University
"""
    parsed = parse_resume(text)
    projects = parsed["parsed_projects"]
    assert len(projects) == 3, f"Expected 3 projects, got {len(projects)}"
    assert projects[0]["title"] == "Project Alpha"
    assert projects[1]["title"] == "Project Beta"
    assert projects[2]["title"] == "Project Gamma"
    assert all(not p["is_ongoing"] for p in projects), "None should be ongoing"
    print("[PASS] Resume A: 3 normal projects correctly parsed")


def test_resume_b_five_projects():
    """Resume B: 5 projects -> 5 extracted/displayed, AI analyzes top 3."""
    text = """
Alice Smith
alice@example.com
123-456-7890

PROJECTS
1. Smart Home Hub (Python, MQTT)
Engineered IoT controller for home automation devices.

2. Cloud File Storage (React, Node.js, AWS S3)
Built secure cloud storage system with AES-256 encryption.

3. Distributed Task Queue – Implemented asynchronous queue with Redis and Celery.

4. E-Commerce Storefront: Developed responsive shopping platform with Stripe payments.

5. Log Aggregator | High-throughput log parser handling 50k events per second.

SKILLS
Python, JavaScript, React, Node.js, AWS, Redis, Docker
"""
    parsed = parse_resume(text)
    projects = parsed["parsed_projects"]
    assert len(projects) == 5, f"Expected 5 projects, got {len(projects)}"
    assert projects[0]["title"] == "Smart Home Hub"
    assert projects[1]["title"] == "Cloud File Storage"
    assert projects[2]["title"] == "Distributed Task Queue"
    assert projects[3]["title"] == "E-Commerce Storefront"
    assert projects[4]["title"] == "Log Aggregator"

    # AI evaluation must be capped at top 3
    exp_class = classify_experience_text([], parsed["projects"], text)
    ai_result = generate_fallback_analysis(
        name=parsed["name"],
        skills=parsed["skills"],
        projects=parsed["projects"],
        education=parsed["education"],
        certifications=parsed["certifications"],
        raw_text=text,
        jd_text="",
        match_results={},
        exp_classification=exp_class,
    )
    assert len(ai_result["project_evaluations"]) == 3, f"Expected exactly 3 AI project evaluations, got {len(ai_result['project_evaluations'])}"
    print("[PASS] Resume B: 5 projects displayed, exactly 3 evaluated by AI")


def test_resume_c_twelve_projects():
    """Resume C: 12 projects -> capped at maximum 10 displayed, AI analyzes top 3."""
    project_entries = "\n\n".join([f"Project {i}\nDeveloped scalable component number {i} using Python and React." for i in range(1, 13)])
    text = f"""
Robert Johnson
robert@example.com
(555) 999-8888

PROJECTS
{project_entries}

EDUCATION
B.E. Computer Engineering
"""
    parsed = parse_resume(text)
    projects = parsed["parsed_projects"]
    assert len(projects) == 10, f"Expected max 10 projects, got {len(projects)}"

    exp_class = classify_experience_text([], parsed["projects"], text)
    ai_result = generate_fallback_analysis(
        name=parsed["name"],
        skills=parsed["skills"],
        projects=parsed["projects"],
        education=parsed["education"],
        certifications=parsed["certifications"],
        raw_text=text,
        jd_text="",
        match_results={},
        exp_classification=exp_class,
    )
    assert len(ai_result["project_evaluations"]) == 3, f"Expected 3 AI project evaluations, got {len(ai_result['project_evaluations'])}"
    print("[PASS] Resume C: 12 projects capped at 10 for display, exactly 3 evaluated by AI")


def test_resume_d_ongoing_and_completed_projects():
    """Resume D: 1 ongoing project and 2 completed projects."""
    text = """
David Miller
david@example.com

PROJECTS
Real-Time Chat Application (Ongoing)
Building a multi-room messaging platform with WebSockets and Go.

Search Engine Indexer
Built inverted indexer in Python with BM25 ranking algorithm.

Database Backup Daemon
Automated daily PostgreSQL snapshot rotation script with S3 upload.
"""
    parsed = parse_resume(text)
    projects = parsed["parsed_projects"]
    assert len(projects) == 3
    assert projects[0]["is_ongoing"] is True, "Project 1 should be detected as ongoing"
    assert projects[1]["is_ongoing"] is False, "Project 2 should be completed"
    assert projects[2]["is_ongoing"] is False, "Project 3 should be completed"
    print("[PASS] Resume D: Explicit ongoing project correctly isolated from completed projects")


def test_resume_e_no_ongoing_projects():
    """Resume E: No ongoing projects -> is_ongoing is False for all."""
    text = """
Emily Davis
emily@example.com

PROJECTS
Project One – Finished database migration.
Project Two – Finished API gateway.
"""
    parsed = parse_resume(text)
    projects = parsed["parsed_projects"]
    assert len(projects) == 2
    assert all(not p["is_ongoing"] for p in projects)
    print("[PASS] Resume E: Zero ongoing projects correctly detected")


def test_resume_f_contact_isolation():
    """Resume F: Contact details below name and unusual formatting must not leak into experience."""
    text = """
Michael Chang
Phone: +1 (555) 789-0123
Email: michael.chang@example.com
Address: 742 Evergreen Terrace, Springfield, OR 97477
LinkedIn: linkedin.com/in/michaelchang
GitHub: github.com/mchang

TECHNICAL SKILLS
Python, JavaScript, Docker, SQL

PROFESSIONAL EXPERIENCE
Software Engineer, Tech Corp (June 2022 – Present)
• Built REST microservices in FastAPI serving 10k daily requests.
• Automated test pipeline reducing deployment failures by 35%.

EDUCATION
B.S. in Computer Science (2018 - 2022)
"""
    parsed = parse_resume(text)
    assert parsed["name"] == "Michael Chang"
    assert parsed["email"] == "michael.chang@example.com"
    assert parsed["phone"] == "+1 (555) 789-0123"

    exp_lines = parsed["experience"]
    # Check that contact details are NOT inside experience lines
    for line in exp_lines:
        assert "@" not in line, f"Email leaked into experience: {line}"
        assert "742 Evergreen" not in line, f"Address leaked into experience: {line}"
        assert "555" not in line, f"Phone leaked into experience: {line}"

    exp_class = classify_experience_text(exp_lines, parsed["projects"], text)
    assert exp_class["has_professional_experience"] is True
    for item in exp_class["professional_items"]:
        assert "@" not in item
        assert "555" not in item
    print("[PASS] Resume F: Contact info isolated completely from experience section")


def test_resume_g_experience_date_does_not_affect_projects():
    """Experience date 'Jan 2025 - Present' must NOT cause completed projects to become ongoing."""
    text = """
Sarah Connor
sarah@example.com

EXPERIENCE
Senior Software Engineer (Jan 2023 – Present)
Leading backend infrastructure team.

PROJECTS
Static Code Linter
Engineered AST-based Python linter with custom style rules.
"""
    parsed = parse_resume(text)
    projects = parsed["parsed_projects"]
    assert len(projects) == 1
    assert projects[0]["is_ongoing"] is False, "Project must not be marked ongoing due to Experience date"
    print("[PASS] Resume G: Experience 'Present' date does not mark project as ongoing")


def test_resume_h_multi_project_with_short_tech_stacks():
    """Verify arbitrary number of projects with variable-length tech stack lines are parsed cleanly."""
    text = """
Atharv Patil
atharv@example.com

PROJECTS
AI Resume Analyzer & Interview Coach (Ongoing)
FastAPI, PostgreSQL, JWT, Gemini/OpenAI, ChromaDB, RAG, React
Developing an Agentic RAG pipeline combining LLM APIs (Gemini/OpenAI) with ChromaDB vector search.

Q&A PDF Splitter & Processor
FastAPI, PyMuPDF, Regex, React
Built a FastAPI backend that extracts text from multi-page PDFs using PyMuPDF.

Micro Language Model for Enterprise Consulting
TensorFlow, LSTM, NLP
Designed and trained a lightweight domain-specific language model using TensorFlow and LSTM networks.

AI Chatbot for Online AC Service
MEAN Stack, Prompt Engineering
Developed a full-stack customer-support chatbot on the MEAN stack to automate service queries.

Student Database Management System
Python, SQLite
Built a CRUD-based student management system in Python and SQLite with a terminal interface.
"""
    parsed = parse_resume(text)
    projects = parsed["parsed_projects"]
    assert len(projects) == 5, f"Expected exactly 5 projects, got {len(projects)}: {[p['title'] for p in projects]}"
    
    assert projects[0]["title"] == "AI Resume Analyzer & Interview Coach"
    assert projects[0]["is_ongoing"] is True
    assert "FastAPI" in projects[0]["technologies"]
    assert "React" in projects[0]["technologies"]
    assert "Developing an Agentic" in projects[0]["description"]

    assert projects[1]["title"] == "Q&A PDF Splitter & Processor"
    assert projects[1]["is_ongoing"] is False
    assert "PyMuPDF" in projects[1]["technologies"]

    assert projects[2]["title"] == "Micro Language Model for Enterprise Consulting"
    assert "TensorFlow" in projects[2]["technologies"]

    assert projects[3]["title"] == "AI Chatbot for Online AC Service"
    assert "MEAN Stack" in projects[3]["technologies"]
    assert "Prompt Engineering" in projects[3]["technologies"]
    assert "Developed a full-stack" in projects[3]["description"]

    assert projects[4]["title"] == "Student Database Management System"
    assert "Python" in projects[4]["technologies"]
    assert "SQLite" in projects[4]["technologies"]
    assert "Built a CRUD-based" in projects[4]["description"]

    print("[PASS] Resume H: 5 projects with short tech-stack metadata lines correctly parsed with title, tech, and description")


def test_resume_pipe_tech_list_four_projects():
    """Verify generic 'Title | Tech1, Tech2, Tech3' pattern parses all 4 projects cleanly."""
    text = """
Projects

AI Resume Analyzer | Python, FastAPI, React, Gemini
Built an AI-powered resume analysis platform that extracts structured resume information, calculates ATS compatibility, compares resumes with job descriptions, and generates recommendations.

Smart Job Matcher | Python, NLP, FastAPI
Created a job matching application that compares candidate skills and domain keywords against job requirements.

Inventory Management Platform | React, Node.js, PostgreSQL
Developed a responsive inventory application with product management, search, filtering, and database-backed APIs.

Local LLM Assistant | Python, FastAPI, Docker
Implemented a lightweight developer assistant using a local language model with a FastAPI service layer.
"""
    parsed = parse_resume(text)
    projects = parsed["parsed_projects"]
    assert len(projects) == 4, f"Expected 4 projects, got {len(projects)}: {[p['title'] for p in projects]}"

    # Project 1
    assert projects[0]["title"] == "AI Resume Analyzer"
    assert "Python" in projects[0]["technologies"]
    assert "FastAPI" in projects[0]["technologies"]
    assert "React" in projects[0]["technologies"]
    assert "Gemini" in projects[0]["technologies"]
    assert "Built an AI-powered" in projects[0]["description"]

    # Project 2
    assert projects[1]["title"] == "Smart Job Matcher"
    assert "Python" in projects[1]["technologies"]
    assert "NLP" in projects[1]["technologies"]
    assert "FastAPI" in projects[1]["technologies"]
    assert "Created a job matching" in projects[1]["description"]

    # Project 3
    assert projects[2]["title"] == "Inventory Management Platform"
    assert "React" in projects[2]["technologies"]
    assert "Node.js" in projects[2]["technologies"]
    assert "PostgreSQL" in projects[2]["technologies"]
    assert "Developed a responsive" in projects[2]["description"]

    # Project 4
    assert projects[3]["title"] == "Local LLM Assistant"
    assert "Python" in projects[3]["technologies"]
    assert "FastAPI" in projects[3]["technologies"]
    assert "Docker" in projects[3]["technologies"]
    assert "Implemented a lightweight" in projects[3]["description"]

    # AI evaluation must be capped at top 3
    exp_class = classify_experience_text([], parsed["projects"], text)
    ai_result = generate_fallback_analysis(
        name=parsed["name"],
        skills=parsed["skills"],
        projects=parsed["projects"],
        education=parsed["education"],
        certifications=parsed["certifications"],
        raw_text=text,
        jd_text="",
        match_results={},
        exp_classification=exp_class,
    )
    assert len(ai_result["project_evaluations"]) <= 3, f"Expected <= 3 AI project evaluations, got {len(ai_result['project_evaluations'])}"

    print("[PASS] Resume Pipe Tech List: 4 projects correctly parsed with title, tech, and description; AI evaluated <= 3")


def test_resume_fictional_pipe_tech_projects():
    """Verify generic 'Title | Tech1, Tech2' works with completely fictional names and stacks."""
    text = """
Projects

Nebula Engine | FooLang, BarDB
Engineered real-time telemetry processing pipeline for distributed nodes.

Orion Dashboard | XFramework, YSQL
Built distributed monitoring interface for cluster metrics and health alerts.
"""
    parsed = parse_resume(text)
    projects = parsed["parsed_projects"]
    assert len(projects) == 2, f"Expected 2 projects, got {len(projects)}: {[p['title'] for p in projects]}"
    assert projects[0]["title"] == "Nebula Engine"
    assert "FooLang" in projects[0]["technologies"]
    assert "BarDB" in projects[0]["technologies"]
    assert "Engineered real-time" in projects[0]["description"]

    assert projects[1]["title"] == "Orion Dashboard"
    assert "XFramework" in projects[1]["technologies"]
    assert "YSQL" in projects[1]["technologies"]
    assert "Built distributed monitoring" in projects[1]["description"]

    print("[PASS] Fictional Pipe Tech Projects: 2 fictional projects correctly parsed")


def test_end_to_end_analyze_route():
    """End-to-end analyze route returns structured projects up to 10 and project_evaluations <= 3."""
    async def run():
        resume_content = """
Marcus Vance
marcus.vance@example.com
(555) 345-6789

SKILLS
Python, FastAPI, Docker, PostgreSQL, React, AWS

PROJECTS
1. Cloud Observability Platform (In Progress)
Building distributed tracing and APM agent using OpenTelemetry and Go.

2. Distributed Cache
Implemented Raft consensus algorithm for distributed key-value cache.

3. Graph Query Engine
Designed graph database storage layer with custom indexing.

4. Microservices Template (React, FastAPI)
Starter boilerplate for secure cloud native services.

EDUCATION
Master of Science in Software Engineering, State University (2022 - 2024)
"""
        import docx

        doc = docx.Document()
        for line in resume_content.splitlines():
            doc.add_paragraph(line)
        docx_buffer = io.BytesIO()
        doc.save(docx_buffer)
        docx_bytes = docx_buffer.getvalue()

        file_obj = UploadFile(
            filename="marcus_resume.docx",
            file=io.BytesIO(docx_bytes),
            headers=Headers({"content-type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document"}),
        )

        response = await analyze_resume(resume=file_obj, job_description="")
        assert response.success is True
        assert len(response.parsed_resume.projects) == 4
        assert len(response.parsed_resume.parsed_projects) == 4
        assert response.parsed_resume.parsed_projects[0].is_ongoing is True
        assert response.parsed_resume.parsed_projects[1].is_ongoing is False
        assert response.ai_insights is not None
        assert len(response.ai_insights.project_evaluations) <= 3
        print("[PASS] End-to-End Analyze Route: Returned 4 parsed_projects and <= 3 project_evaluations")


    asyncio.run(run())


if __name__ == "__main__":
    test_resume_a_three_projects()
    test_resume_b_five_projects()
    test_resume_c_twelve_projects()
    test_resume_d_ongoing_and_completed_projects()
    test_resume_e_no_ongoing_projects()
    test_resume_f_contact_isolation()
    test_resume_g_experience_date_does_not_affect_projects()
    test_resume_h_multi_project_with_short_tech_stacks()
    test_resume_pipe_tech_list_four_projects()
    test_resume_fictional_pipe_tech_projects()
    test_end_to_end_analyze_route()
    print("\nALL UNIVERSAL PARSING TESTS PASSED!")
