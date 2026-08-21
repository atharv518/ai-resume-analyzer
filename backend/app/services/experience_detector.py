import re
from typing import TypedDict


class ExperienceItem(TypedDict):
    title: str
    organization: str
    category: str  # "professional", "internship", "virtual_simulation", "project"
    description: list[str]


class ExperienceClassification(TypedDict):
    candidate_type: str  # "fresher" or "experienced"
    has_professional_experience: bool
    has_internship_experience: bool
    has_virtual_experience: bool
    include_experience_section: bool
    professional_items: list[str]
    internship_items: list[str]
    virtual_simulation_items: list[str]
    detected_experience_items: list[ExperienceItem]
    explanation: str


# Patterns indicating virtual job simulations / virtual programs
VIRTUAL_SIMULATION_KEYWORDS = [
    r"\bforage\b",
    r"\binsidesherpa\b",
    r"\bjob simulation\b",
    r"\bvirtual experience\b",
    r"\bvirtual internship\b",
    r"\bvirtual work experience\b",
    r"\bsimulation participant\b",
    r"\bvirtual program\b",
]

# Common professional job title indicators
PROFESSIONAL_ROLE_PATTERNS = [
    r"\bsoftware engineer\b",
    r"\bsoftware developer\b",
    r"\bbackend developer\b",
    r"\bfrontend developer\b",
    r"\bfull[\s\-]stack developer\b",
    r"\bdata engineer\b",
    r"\bdata scientist\b",
    r"\bdevops engineer\b",
    r"\bsystem administrator\b",
    r"\bqa engineer\b",
    r"\btechnical lead\b",
    r"\barchitect\b",
    r"\bconsultant\b",
    r"\banalyst\b",
    r"\bassociate\b",
    r"\bprogrammer\b",
    r"\bengineering lead\b",
    r"\bsenior\b",
    r"\bjr\.?\b",
    r"\bjunior developer\b",
]

INTERNSHIP_PATTERNS = [
    r"\bintern\b",
    r"\binternship\b",
    r"\btrainee\b",
    r"\bco[\-\s]?op\b",
    r"\bapprentice\b",
    r"\bstudent researcher\b",
]

PROJECT_PATTERNS = [
    r"\bpersonal project\b",
    r"\bacademic project\b",
    r"\bcapstone project\b",
    r"\bmini project\b",
    r"\bfinal year project\b",
    r"\bhackathon\b",
    r"\bbuilt using\b",
    r"\bdeveloped a web app\b",
    r"\bgithub\.com\b",
]

# Patterns for employment date ranges (e.g. 2021 - 2024, May 2022 - Present, 2 yrs, 3 years)
EXPERIENCE_YEARS_PATTERNS = [
    r"\b(?:19|20)\d{2}\s*[\-\–\—\to]\s*(?:(?:19|20)\d{2}|present|current)\b",
    r"\b(\d+)\+?\s*(?:years?|yrs?)\s*(?:of\s*)?experience\b",
]


def classify_experience_text(
    experience_lines: list[str],
    projects_lines: list[str],
    full_text: str
) -> ExperienceClassification:
    """Analyze resume experience lines and full text to classify candidate type and experience."""
    professional_items: list[str] = []
    internship_items: list[str] = []
    virtual_simulation_items: list[str] = []
    structured_items: list[ExperienceItem] = []

    # Combined text for heuristic search
    exp_text = "\n".join(experience_lines).lower()
    full_text_lower = full_text.lower()

    # 1. Process explicit experience lines
    for line in experience_lines:
        line_lower = line.lower()

        # Check for virtual simulation first (e.g. Forage, Job Simulation)
        if any(re.search(pat, line_lower) for pat in VIRTUAL_SIMULATION_KEYWORDS):
            virtual_simulation_items.append(line)
            structured_items.append({
                "title": line,
                "organization": "Virtual Job Simulation",
                "category": "virtual_simulation",
                "description": [line]
            })
            continue

        # Check for internship
        if any(re.search(pat, line_lower) for pat in INTERNSHIP_PATTERNS):
            internship_items.append(line)
            structured_items.append({
                "title": line,
                "organization": "Internship",
                "category": "internship",
                "description": [line]
            })
            continue

        # Check if it looks like project mistakenly placed under experience
        if any(re.search(pat, line_lower) for pat in PROJECT_PATTERNS):
            # Treat as project, not professional employment
            continue

        # Check if it has genuine professional role or date markers
        is_role = any(re.search(pat, line_lower) for pat in PROFESSIONAL_ROLE_PATTERNS)
        is_date = any(re.search(pat, line_lower) for pat in EXPERIENCE_YEARS_PATTERNS)

        if is_role or is_date or (len(line) > 10 and not any(p in line_lower for p in ["student", "school", "college", "bachelor", "master"])):
            professional_items.append(line)
            structured_items.append({
                "title": line,
                "organization": "Professional Experience",
                "category": "professional",
                "description": [line]
            })

    # 2. Check full text for virtual simulations if not caught in section
    for pat in VIRTUAL_SIMULATION_KEYWORDS:
        for match in re.finditer(pat, full_text_lower):
            matched_line = match.group(0)
            # Find surrounding snippet
            start = max(0, match.start() - 30)
            end = min(len(full_text), match.end() + 50)
            snippet = full_text[start:end].replace("\n", " ").strip()
            if snippet and snippet not in virtual_simulation_items and not any(snippet in s for s in virtual_simulation_items):
                virtual_simulation_items.append(snippet)
                structured_items.append({
                    "title": snippet,
                    "organization": "Virtual Job Simulation",
                    "category": "virtual_simulation",
                    "description": [snippet]
                })

    has_prof = len(professional_items) > 0
    has_intern = len(internship_items) > 0
    has_virt = len(virtual_simulation_items) > 0

    # Determine candidate type:
    # A candidate is experienced if they have full-time professional experience.
    # Internships or virtual simulations alone classify the candidate as a Fresher / Early Career.
    if has_prof:
        candidate_type = "experienced"
        explanation = "Candidate possesses verified professional work experience."
    elif has_intern:
        candidate_type = "fresher"
        explanation = "Candidate is a fresher/early career candidate with internship experience."
    elif has_virt:
        candidate_type = "fresher"
        explanation = "Candidate is a fresher with virtual job simulation experience."
    else:
        candidate_type = "fresher"
        explanation = "Candidate is a fresher with academic and project background."

    # Experience section should ONLY be shown if genuine professional or internship experience exists.
    # Virtual simulation can be highlighted separately in profile / projects / certifications.
    include_exp_section = has_prof or has_intern

    return {
        "candidate_type": candidate_type,
        "has_professional_experience": has_prof,
        "has_internship_experience": has_intern,
        "has_virtual_experience": has_virt,
        "include_experience_section": include_exp_section,
        "professional_items": professional_items,
        "internship_items": internship_items,
        "virtual_simulation_items": virtual_simulation_items,
        "detected_experience_items": structured_items,
        "explanation": explanation,
    }
