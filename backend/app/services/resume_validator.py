import re
from typing import Any
from fastapi import HTTPException, status

from app.services.parser import (
    COMMON_SKILL_KEYWORDS,
    SECTION_HEADINGS,
    clean_line,
    classify_section_heading,
    extract_email,
    extract_name,
    extract_phone,
    is_bullet_line,
    normalize_heading,
)

# Academic, Lab Experiment, Question Paper, and Assignment negative patterns (Pattern, Weight)
ACADEMIC_LAB_PATTERNS: list[tuple[str, int]] = [
    # Lab experiment headers and instructions
    (r"\bexperiment\s*(?:no\.?|number|#)?\s*:\s*\d+", 4),
    (r"\b(?:lab\s+)?experiment\s+(?:writing\s+)?instructions\b", 4),
    (r"\b(?:aim|problem\s+statement)\s*:", 3),
    (r"\btheory\s*:\s*\[?", 3),
    (r"\bperformance\s*:\s*\[?", 3),
    (r"\bapparatus\s*(?:required)?\s*:", 3),
    (r"\bprocedure\s*:", 3),
    (r"\bconclusion\s*:\s*(?:thus\s+we\s+have|hence\s+verified|hence\s+proved|in\s+this\s+experiment)", 4),
    (r"\b(?:go\s+to|check\s+out)\s+(?:git\s*hub|github)\s+repository\b", 3),
    (r"\b(?:write|check)\s+the\s+output\s+of\s+(?:the\s+)?execution\b", 3),
    (r"\bbased\s+slide\s+shared\s+on\s+lms\b", 3),
    (r"\bdepartment\s+of\s+(?:information\s+technology|computer|electronics|mechanical|civil|electrical|science|engineering|physics|chemistry|mathematics)\b", 3),
    (r"\b(?:affiliated\s+to|approved\s+by\s+a\.?i\.?c\.?t\.?e|shaikshanik\s+sankul)\b", 3),
    
    # Assignments, Homework, and Question Papers
    (r"\b(?:question\s+paper|assignment\s*(?:no\.?|number|#)?\s*:\s*\d+)\b", 4),
    (r"\b(?:roll\s*no\.?\s*:|prn\s*:|submitted\s+by\s*:|submitted\s+to\s*:)\b", 3),
    (r"\b(?:course\s+code|subject\s+code|max\s+marks|academic\s+year\s*:|semester\s*(?:i|ii|iii|iv|v|vi|vii|viii|\d+))\b", 3),
    (r"\b(?:what\s+is\s+a?\s*[\w\s]{2,30}\?|what\s+do\s+you\s+mean\s+by|explain\s+(?:the\s+)?following\s+points)\b", 3),
    (r"\banswer\s+(?:all\s+)?(?:the\s+)?following\s+questions?\b", 4),
]

# Invoice and Commercial Billing negative patterns (Pattern, Weight)
INVOICE_PATTERNS: list[tuple[str, int]] = [
    (r"\binvoice\s*(?:#|no\.?|number)?\s*:", 4),
    (r"\btax\s+invoice\b", 4),
    (r"\bbill\s+to\s*:", 4),
    (r"\bamount\s+due\b", 3),
    (r"\bbalance\s+due\b", 3),
    (r"\bsubtotal\s*:\s*[\$€£₹]?\d+", 4),
    (r"\bpayment\s+terms\s*:\s*(?:net\s+\d+|due\s+on\s+receipt)", 4),
    (r"\bremittance\s+advice\b", 4),
    (r"\bpurchase\s+order\b", 3),
    (r"\breceipt\s*(?:#|no\.?|number)?\s*:", 3),
]

# Academic Research Paper negative patterns (when no resume sections exist)
RESEARCH_PAPER_PATTERNS: list[tuple[str, int]] = [
    (r"\babstract\s*:\s*[A-Z]", 3),
    (r"\bkeywords\s*:\s*\w+", 3),
    (r"\b(?:introduction|related\s+work|methodology|experimental\s+results)\s*\n", 2),
    (r"\b(?:arxiv:\d+|ieee\s+transactions|acm\s+digital\s+library)\b", 3),
]

# Specific Degree & Academic Qualification indicators
CANDIDATE_DEGREE_PATTERNS: list[str] = [
    r"\bb\.?tech\b",
    r"\bm\.?tech\b",
    r"\bb\.?s\.?\b(?:\s+in\b)?",
    r"\bm\.?s\.?\b(?:\s+in\b)?",
    r"\bb\.?e\.?\b(?:\s+in\b)?",
    r"\bm\.?e\.?\b(?:\s+in\b)?",
    r"\bb\.?c\.?a\b",
    r"\bm\.?c\.?a\b",
    r"\bbachelor(?:\s+of|\s+degree|\s+in|\'s)",
    r"\bmaster(?:\s+of|\s+degree|\s+in|\'s)",
    r"\bph\.?d\b",
    r"\bdiploma\s+in\b",
    r"\b(?:cgpa|gpa)\s*:\s*\d+",
    r"\bhigh\s+school\b",
    r"\bsecondary\s+school\b",
]

# Role / Professional Experience terminology
ROLE_TITLE_PATTERNS: list[str] = [
    r"\bsoftware\s+engineer\b",
    r"\bsoftware\s+developer\b",
    r"\bfrontend\s+developer\b",
    r"\bbackend\s+developer\b",
    r"\bfull\s*stack\s+developer\b",
    r"\bweb\s+developer\b",
    r"\bdata\s+scientist\b",
    r"\bdata\s+analyst\b",
    r"\bdevops\s+engineer\b",
    r"\bcloud\s+engineer\b",
    r"\bsystem\s+engineer\b",
    r"\bqa\s+engineer\b",
    r"\bsoftware\s+development\s+intern\b",
    r"\bengineering\s+intern\b",
    r"\bintern\b",
]

# Common action verbs in candidate project/experience bullet points
ACTION_VERBS: list[str] = [
    "developed", "built", "implemented", "designed", "created", "maintained",
    "collaborated", "engineered", "architected", "managed", "led", "optimized",
    "analyzed", "deployed", "spearheaded", "programmed", "orchestrated",
]


def detect_explicit_section_headings(text: str) -> set[str]:
    """Detect distinct, standard resume section headings appearing on dedicated lines."""
    detected_sections: set[str] = set()
    lines = text.splitlines()

    for raw_line in lines:
        matched = classify_section_heading(raw_line)
        if matched:
            if matched == "other":
                normalized = normalize_heading(raw_line)
                if any(k in normalized for k in ["summary", "profile", "objective", "about me"]):
                    detected_sections.add("summary")
            else:
                detected_sections.add(matched)

    return detected_sections


def calculate_resume_scores(text: str) -> tuple[int, int, dict[str, Any]]:
    """Compute weighted positive resume score and negative document score."""
    text_lower = text.lower()
    
    # 1. Compute Negative Score
    negative_score = 0
    negative_reasons: list[str] = []

    for pattern, weight in ACADEMIC_LAB_PATTERNS:
        if re.search(pattern, text_lower):
            negative_score += weight
            negative_reasons.append(f"academic_lab_pattern: {pattern}")

    for pattern, weight in INVOICE_PATTERNS:
        if re.search(pattern, text_lower):
            negative_score += weight
            negative_reasons.append(f"invoice_pattern: {pattern}")

    for pattern, weight in RESEARCH_PAPER_PATTERNS:
        if re.search(pattern, text_lower):
            negative_score += weight
            negative_reasons.append(f"research_paper_pattern: {pattern}")

    # 2. Compute Positive Score
    positive_score = 0
    positive_signals: list[str] = []

    # Name signal
    candidate_name = extract_name(text)
    if candidate_name:
        positive_score += 3
        positive_signals.append(f"name: {candidate_name}")

    # Contact signals
    email = extract_email(text)
    if email:
        positive_score += 3
        positive_signals.append(f"email: {email}")

    phone = extract_phone(text)
    if phone:
        positive_score += 3
        positive_signals.append(f"phone: {phone}")

    has_profile_links = bool(
        re.search(
            r"\b(linkedin\.com/in/|linkedin\.com/pub/|github\.com/[a-zA-Z0-9_-]+/?(?:\s|$)|leetcode\.com/|kaggle\.com/)\b",
            text_lower,
        )
    )
    if has_profile_links:
        positive_score += 2
        positive_signals.append("personal_profile_link")

    # Explicit Section Headings
    detected_sections = detect_explicit_section_headings(text)
    if detected_sections:
        heading_points = min(len(detected_sections) * 3, 15)
        positive_score += heading_points
        positive_signals.append(f"sections: {list(detected_sections)}")

    # Specific Degree Phrasing
    has_degree = any(re.search(pat, text_lower) for pat in CANDIDATE_DEGREE_PATTERNS)
    if has_degree:
        positive_score += 2
        positive_signals.append("degree_qualification")

    # Role Titles & Action Verbs
    has_roles = any(re.search(pat, text_lower) for pat in ROLE_TITLE_PATTERNS)
    action_verb_count = sum(1 for v in ACTION_VERBS if re.search(r"\b" + v + r"\b", text_lower))
    if has_roles or action_verb_count >= 2:
        positive_score += 2
        positive_signals.append("roles_and_action_verbs")

    # Skills vocabulary
    matched_skills = [
        s for s in COMMON_SKILL_KEYWORDS
        if re.search(r"\b" + re.escape(s.lower()) + r"\b", text_lower)
    ]
    if len(matched_skills) >= 3:
        positive_score += 2
        positive_signals.append(f"skills_count: {len(matched_skills)}")

    # Bullet points structure
    bullet_count = sum(1 for line in text.splitlines() if is_bullet_line(line))
    if bullet_count >= 2:
        positive_score += 2
        positive_signals.append(f"bullet_points: {bullet_count}")

    details = {
        "positive_score": positive_score,
        "negative_score": negative_score,
        "positive_signals": positive_signals,
        "negative_reasons": negative_reasons,
        "detected_sections": list(detected_sections),
        "has_candidate_name": bool(candidate_name),
        "has_email": bool(email),
        "has_phone": bool(phone),
        "has_degree": has_degree,
        "skills_count": len(matched_skills),
    }

    return positive_score, negative_score, details


def validate_resume_content(extracted_text: str) -> None:
    """Validate that the extracted document reasonably looks like a candidate resume.
    
    Rejects academic assignments, lab manuals, experiment instruction sheets, invoices,
    and non-resume texts deterministically.
    
    Raises:
        HTTPException(status_code=400, detail="The uploaded document does not appear to be a resume. Please upload a valid resume.")
    """
    error_message = "The uploaded document does not appear to be a resume. Please upload a valid resume."

    if not extracted_text or not extracted_text.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=error_message,
        )

    words = extracted_text.split()
    if len(words) < 25:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=error_message,
        )

    pos_score, neg_score, details = calculate_resume_scores(extracted_text)
    section_count = len(details["detected_sections"])

    # 1. Negative override: High negative score immediately disqualifies the document
    if neg_score >= 5:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=error_message,
        )

    if neg_score >= 3 and pos_score < 12:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=error_message,
        )

    # 2. Affirmative validation: Resumes with standard section headings
    if section_count >= 2:
        # Fresher or experienced resume with 2+ standard section headers
        if pos_score >= 8 and neg_score <= 2:
            return
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=error_message,
        )

    if section_count == 1:
        # Resume with 1 section header (e.g., Skills or Education) must have strong candidate identity
        if pos_score >= 10 and neg_score == 0 and (details["has_candidate_name"] or details["has_email"]):
            return
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=error_message,
        )

    # 3. Unconventional resumes without explicit section headings
    if section_count == 0:
        # Must have clear personal identity (name + email/phone) and candidate skills/degree with 0 negative flags
        if (
            details["has_candidate_name"]
            and details["has_email"]
            and (details["has_degree"] or details["skills_count"] >= 3)
            and neg_score == 0
            and pos_score >= 10
        ):
            return

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=error_message,
        )
