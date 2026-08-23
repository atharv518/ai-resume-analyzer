"""
Test Suite: Section Segmentation and Semantic Heading Classification

Verifies that:
1. Semantic variations of resume headings are mapped to correct sections.
2. Headings with diverse formatting (uppercase, colons, numbering, decorative borders) are recognized.
3. Complex real-world resume with 'Core Competencies', 'Relevant Projects', 'Research & Publications'
   segments correctly without cross-contamination.
4. Normal sentences with heading keywords are never falsely treated as section headings.
5. Completely new headings not in SECTION_HEADINGS behave safely and correctly.
"""

from app.services.parser import (
    classify_section_heading,
    normalize_heading,
    parse_resume,
    segment_sections,
)
from app.services.experience_detector import classify_experience_text


def test_section_heading_classification():
    """Test classification of various semantic heading strings."""
    test_cases = [
        # Projects variations
        ("Projects", "projects"),
        ("Relevant Projects", "projects"),
        ("Relevant Project Work", "projects"),
        ("Selected Projects", "projects"),
        ("Featured Projects", "projects"),
        ("Technical Projects", "projects"),
        ("Personal Projects", "projects"),
        ("Academic Projects", "projects"),
        ("Key Projects", "projects"),
        ("Major Projects", "projects"),
        ("Project Experience", "projects"),
        ("Project Portfolio", "projects"),
        ("Selected Project Work", "projects"),
        ("Software Projects", "projects"),
        ("Capstone Projects", "projects"),

        # Skills variations
        ("Skills", "skills"),
        ("Technical Skills", "skills"),
        ("Core Skills", "skills"),
        ("Core Competencies", "skills"),
        ("Technical Competencies", "skills"),
        ("Key Competencies", "skills"),
        ("Professional Competencies", "skills"),
        ("Relevant Skills", "skills"),
        ("Areas of Expertise", "skills"),
        ("Technical Proficiencies", "skills"),
        ("Technical Expertise", "skills"),
        ("Skills & Competencies", "skills"),
        ("Core Technical Competencies", "skills"),
        ("Competencies & Skills", "skills"),
        ("Tools & Technologies", "skills"),
        ("Programming Languages & Tools", "skills"),
        ("Technical Toolkit", "skills"),

        # Experience variations
        ("Experience", "experience"),
        ("Relevant Experience", "experience"),
        ("Professional Experience", "experience"),
        ("Work Experience", "experience"),
        ("Employment History", "experience"),
        ("Work History", "experience"),
        ("Career History", "experience"),
        ("Professional Background", "experience"),
        ("Industry Experience", "experience"),
        ("Relevant Work Experience", "experience"),
        ("Internship Experience", "experience"),
        ("Internships", "experience"),
        ("Professional & Internship Experience", "experience"),

        # Education variations
        ("Education", "education"),
        ("Educational Background", "education"),
        ("Academic Background", "education"),
        ("Academic Qualifications", "education"),
        ("Academic History", "education"),
        ("Education & Qualifications", "education"),
        ("Qualifications", "education"),
        ("Academics", "education"),

        # Other / Publications / Achievements variations
        ("Research", "other"),
        ("Research Experience", "other"),
        ("Research & Publications", "other"),
        ("Publications", "other"),
        ("Papers", "other"),
        ("Academic Research", "other"),
        ("Achievements", "other"),
        ("Honors", "other"),
        ("Awards", "other"),
        ("Honors & Awards", "other"),
        ("Leadership", "other"),
        ("Volunteer Experience", "other"),
        ("Extracurricular Activities", "other"),
        ("Languages", "other"),
        ("Interests", "other"),
    ]

    for heading, expected_section in test_cases:
        actual = classify_section_heading(heading)
        assert actual == expected_section, f"Heading '{heading}' classified as '{actual}', expected '{expected_section}'"

    print("[PASS] Semantic heading classification for all standard & extended variations")


def test_heading_formatting_styles():
    """Test classification across various formatting styles (numbering, borders, colons, cases)."""
    cases = [
        ("1. RELEVANT PROJECTS:", "projects"),
        ("--- Relevant Projects ---", "projects"),
        ("RELEVANT PROJECTS", "projects"),
        ("Relevant Projects:", "projects"),
        ("=== PROFESSIONAL EXPERIENCE ===", "experience"),
        ("2. WORK EXPERIENCE:", "experience"),
        ("I. EDUCATION", "education"),
        ("Education:", "education"),
        ("--- Academic Qualifications ---", "education"),
        ("*** CORE COMPETENCIES ***", "skills"),
        ("1) Technical Skills:", "skills"),
        ("[A] Areas of Expertise", "skills"),
        ("### RESEARCH & PUBLICATIONS ###", "other"),
        ("Achievements:", "other"),
        ("--- HONORS & AWARDS ---", "other"),
    ]

    for heading, expected in cases:
        actual = classify_section_heading(heading)
        assert actual == expected, f"Formatted heading '{heading}' classified as '{actual}', expected '{expected}'"

    print("[PASS] Heading classification across diverse formatting styles (numbering, borders, colons, cases)")


def test_conservative_rejection_of_sentences():
    """Test that normal sentences containing keywords are NEVER classified as section headings."""
    sentences = [
        "Built several projects using Python and React.",
        "Acquired 3 years of professional experience in backend development.",
        "Completed education with a high GPA in Computer Science.",
        "Demonstrated technical skills in machine learning algorithms.",
        "Received certifications in AWS Cloud Architecture.",
        "Published research papers during undergraduate studies.",
        "Managed multiple projects simultaneously under tight deadlines.",
    ]

    for s in sentences:
        actual = classify_section_heading(s)
        assert actual is None, f"Sentence '{s}' was falsely classified as a heading: '{actual}'"

    print("[PASS] Conservative rejection of normal sentences containing heading vocabulary")


def test_real_world_complex_resume_regression():
    """Test the exact real-world failure case resume structure (Requirement 10)."""
    resume_text = """
Atharv Sharma
atharv.sharma@example.com
+1 555-019-2834

Education
B.S. in Computer Science, Tech University (2020 - 2024)
CGPA: 3.85 / 4.0

Core Competencies
ML & LLM Engineering
PyTorch, TensorFlow, LangChain, HuggingFace, Llama-cpp
Systems & Deployment
FastAPI, Docker, Kubernetes, AWS, Redis
Data & Backend
Python, SQL, PostgreSQL, MongoDB, Pandas
Tools & Practices
Git/GitHub, CI/CD, Agile, Linux

Relevant Experience
Backend & AI Systems Engineering Intern
Acme AI Systems | June 2023 - Aug 2023
- Built low-latency inference endpoints with FastAPI and Redis caching.
- Optimized RAG pipeline response time by 45% using hybrid vector search.

ML Engineering Intern
Beta Labs | Jan 2023 - May 2023
- Developed fine-tuned transformer models for biomedical entity recognition.
- Evaluated model precision and recall across 50k validation samples.

Relevant Projects
CareerOracle AI – Production RAG System
- Implemented hybrid search with LangChain, Pinecone, and FastAPI backend.
- Deployed scalable Docker container to AWS ECS.

Theta AI Assistant – Quantized Local LLM Inference
- Engineered local inference pipeline using 4-bit quantized Mistral-7B models.
- Integrated WebSocket streaming interface with React frontend.

Early-Stage Cancer Prediction Model
- Trained ensemble XGBoost and CNN on histopathology imaging datasets.
- Achieved 94.2% ROC-AUC on unseen test partitions.

Research & Publications
Privacy-Preserving Medical Diagnostics Using Federated Learning
- Published in IEEE Symposium on Biomedical AI, 2024.
- Proposed differential privacy mechanism for distributed healthcare data.

Achievements
- Winner of National AI Hackathon 2023 (1st out of 300 teams).
- Dean's List for Academic Excellence (all semesters).
"""

    parsed = parse_resume(resume_text)
    sections = segment_sections(resume_text)

    # 1. Verify Education section segmentation
    edu_text = " ".join(sections["education"])
    assert "B.S. in Computer Science" in edu_text
    assert "Core Competencies" not in edu_text
    assert "PyTorch" not in edu_text
    assert len(parsed["education"]) >= 1

    # 2. Verify Skills section segmentation
    skills_text = " ".join(sections["skills"])
    assert "ML & LLM Engineering" in skills_text
    assert "FastAPI" in skills_text
    assert "Python" in parsed["skills"]
    assert "PyTorch" in parsed["skills"]
    assert "FastAPI" in parsed["skills"]

    # 3. Verify Experience section segmentation
    exp_text = " ".join(sections["experience"])
    assert "Backend & AI Systems Engineering Intern" in exp_text
    assert "ML Engineering Intern" in exp_text
    assert "CareerOracle AI" not in exp_text
    assert "Theta AI Assistant" not in exp_text
    assert "Privacy-Preserving Medical Diagnostics" not in exp_text

    # Experience entries parsed
    assert len(parsed["experience"]) == 2, f"Expected 2 experience entries, got {len(parsed['experience'])}: {parsed['experience']}"

    # 4. Verify Projects section segmentation
    proj_text = " ".join(sections["projects"])
    assert "CareerOracle AI" in proj_text
    assert "Theta AI Assistant" in proj_text
    assert "Early-Stage Cancer Prediction Model" in proj_text
    assert "Privacy-Preserving Medical Diagnostics" not in proj_text

    # Structured projects parsed
    assert len(parsed["parsed_projects"]) == 3, f"Expected exactly 3 projects, got {len(parsed['parsed_projects'])}: {[p['title'] for p in parsed['parsed_projects']]}"
    proj_titles = [p["title"] for p in parsed["parsed_projects"]]
    assert "CareerOracle AI" in proj_titles
    assert "Theta AI Assistant" in proj_titles
    assert "Early-Stage Cancer Prediction Model" in proj_titles

    # 5. Verify Other section segmentation
    other_text = " ".join(sections["other"])
    assert "Privacy-Preserving Medical Diagnostics" in other_text
    assert "Winner of National AI Hackathon" in other_text

    # 6. Verify Experience classification doesn't pollute candidate type
    exp_class = classify_experience_text(parsed["experience"], parsed["projects"], resume_text)
    assert len(exp_class["internship_items"]) == 2
    assert len(exp_class["professional_items"]) == 0
    assert exp_class["candidate_type"] == "fresher"

    print("[PASS] Real-world complex resume regression test (Requirement 10) PASSED with 0 cross-contamination!")


def test_completely_novel_and_unrecognized_headings():
    """Test completely novel headings and strong structural isolation."""
    # Novel heading with semantic tokens
    assert classify_section_heading("Applied Machine Learning Projects") == "projects"
    assert classify_section_heading("Software & Developer Toolkit") == "skills"
    assert classify_section_heading("University Education & Coursework") == "education"
    assert classify_section_heading("Corporate Experience & Employment") == "experience"

    # Novel heading with strong structural borders -> isolated to 'other'
    assert classify_section_heading("--- MILITARY SERVICE ---") == "other"
    assert classify_section_heading("=== GRANT FUNDING ===") == "other"
    assert classify_section_heading("VII. CIVIC ENGAGEMENT") == "other"
    assert classify_section_heading("Section 3: FELLOWSHIPS") == "other"

    # Ordinary non-heading words must NOT be isolated to 'other'
    assert classify_section_heading("Google Inc.") is None
    assert classify_section_heading("Software Engineer") is None
    assert classify_section_heading("FastAPI, Docker, Kubernetes") is None
    assert classify_section_heading("Stanford University") is None

    print("[PASS] Completely novel headings and structural fallback isolation PASSED")


if __name__ == "__main__":
    test_section_heading_classification()
    test_heading_formatting_styles()
    test_conservative_rejection_of_sentences()
    test_real_world_complex_resume_regression()
    test_completely_novel_and_unrecognized_headings()
    print("\nALL SECTION SEGMENTATION TESTS PASSED SUCCESSFULLY!")
