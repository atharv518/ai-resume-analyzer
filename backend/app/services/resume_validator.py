import re
from fastapi import HTTPException, status

from app.services.parser import (
    COMMON_SKILL_KEYWORDS,
    SECTION_HEADINGS,
    clean_line,
    extract_email,
    extract_phone,
)

# Negative indicator terms commonly found in invoices, receipts, and non-resume documents
NON_RESUME_INDICATORS = [
    r"\binvoice\b",
    r"\btax invoice\b",
    r"\bbill to\b",
    r"\bamount due\b",
    r"\bbalance due\b",
    r"\bsubtotal\b",
    r"\bpayment terms\b",
    r"\bremittance advice\b",
    r"\bpurchase order\b",
    r"\breceipt\b",
]

# Common education degree and institution keywords
EDUCATION_KEYWORDS = [
    r"\bbachelor",
    r"\bmaster",
    r"\bb\.s\b",
    r"\bm\.s\b",
    r"\bb\.tech\b",
    r"\bm\.tech\b",
    r"\bb\.e\b",
    r"\bph\.?d\b",
    r"\bdegree\b",
    r"\buniversity\b",
    r"\bcollege\b",
    r"\bgpa\b",
    r"\bacademic\b",
    r"\bdiploma\b",
    r"\bhigh school\b",
    r"\bcurriculum\b",
]

# Action verbs commonly found in resume bullet points
ACTION_VERBS = [
    "developed", "built", "implemented", "designed", "created", "maintained",
    "collaborated", "engineered", "architected", "managed", "led", "optimized",
    "analyzed", "deployed", "spearheaded", "programmed", "orchestrated",
]


def detect_resume_signals(text: str) -> dict[str, bool]:
    """Inspect extracted document text for resume-characteristic structural and semantic signals."""
    text_lower = text.lower()
    lines = [clean_line(line).lower() for line in text.splitlines() if clean_line(line)]

    # 1. Contact Information Signal
    email = extract_email(text)
    phone = extract_phone(text)
    has_links = bool(
        re.search(
            r"\b(linkedin\.com|github\.com|gitlab\.com|kaggle\.com|leetcode\.com|portfolio|behance\.net|bitbucket\.org)\b",
            text_lower,
        )
    )
    has_contact = bool(email or phone or has_links)

    # 2. Section Heading Signals
    heading_matches = {
        "skills": False,
        "education": False,
        "experience": False,
        "projects": False,
        "certifications": False,
        "summary": False,
    }

    for line in lines:
        for section, variants in SECTION_HEADINGS.items():
            if section in heading_matches and line in variants:
                heading_matches[section] = True

    # 3. Content-based heuristics in case headings vary slightly
    # Skills content
    matched_skills = [
        s for s in COMMON_SKILL_KEYWORDS
        if re.search(r"\b" + re.escape(s.lower()) + r"\b", text_lower)
    ]
    has_skills = heading_matches["skills"] or len(matched_skills) >= 2

    # Education content
    has_edu_keywords = any(re.search(pattern, text_lower) for pattern in EDUCATION_KEYWORDS)
    has_education = heading_matches["education"] or has_edu_keywords

    # Experience / Work content
    has_exp_keywords = bool(
        re.search(
            r"\b(internship|intern|work experience|employment|software engineer|developer|analyst|full-time|part-time|co-op)\b",
            text_lower,
        )
    )
    has_experience = heading_matches["experience"] or has_exp_keywords

    # Projects content
    has_proj_keywords = bool(re.search(r"\b(projects?|built a |developed a |personal projects?)\b", text_lower))
    has_projects = heading_matches["projects"] or (has_proj_keywords and len(matched_skills) >= 1)

    # Certifications content
    has_cert_keywords = bool(re.search(r"\b(certif|aws certified|license|credential|coursera|udemy)\b", text_lower))
    has_certifications = heading_matches["certifications"] or has_cert_keywords

    # Summary / Objective
    has_summary = (
        heading_matches["summary"]
        or "objective" in text_lower
        or "summary" in text_lower
        or "about me" in text_lower
    )

    # Action verbs
    matched_verbs = [v for v in ACTION_VERBS if re.search(r"\b" + v + r"\b", text_lower)]
    has_action_verbs = len(matched_verbs) >= 2

    return {
        "has_contact": has_contact,
        "has_skills": has_skills,
        "has_education": has_education,
        "has_experience": has_experience,
        "has_projects": has_projects,
        "has_certifications": has_certifications,
        "has_summary": has_summary,
        "has_action_verbs": has_action_verbs,
    }


def validate_resume_content(extracted_text: str) -> None:
    """Validate that the extracted text contains sufficient resume-characteristic signals.
    
    Raises an HTTPException(400) if the document is too short, resembles an invoice/receipt,
    or lacks minimum resume signals.
    """
    if not extracted_text or not extracted_text.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The uploaded document does not appear to be a resume. Please upload a valid resume.",
        )

    words = extracted_text.split()
    if len(words) < 25:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The uploaded document does not appear to be a resume. Please upload a valid resume.",
        )

    text_lower = extracted_text.lower()

    # Check for strong invoice / receipt indicators
    invoice_matches = [ind for ind in NON_RESUME_INDICATORS if re.search(ind, text_lower)]
    signals = detect_resume_signals(extracted_text)

    # Count affirmative signals
    # Sections of interest: skills, education, experience, projects, certifications, summary
    section_signal_count = sum(
        1 for k in [
            "has_skills",
            "has_education",
            "has_experience",
            "has_projects",
            "has_certifications",
            "has_summary",
        ] if signals[k]
    )

    total_signal_score = (
        (1 if signals["has_contact"] else 0)
        + section_signal_count
        + (1 if signals["has_action_verbs"] else 0)
    )

    # An invoice or receipt with 2+ invoice keywords and fewer than 2 standard resume sections is rejected
    if len(invoice_matches) >= 2 and section_signal_count < 2:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The uploaded document does not appear to be a resume. Please upload a valid resume.",
        )

    # Legitimate resumes (fresher or experienced) should have at least 2 distinct resume signals
    # (e.g. Contact + Education, Contact + Skills, Skills + Projects, Education + Experience, etc.)
    if total_signal_score < 2 or section_signal_count < 1:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The uploaded document does not appear to be a resume. Please upload a valid resume.",
        )
