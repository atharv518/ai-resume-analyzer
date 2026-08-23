import re
from typing import TypedDict
from app.services.parser import clean_line, is_bullet_line, is_pure_contact_line


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
    full_text: str,
    certifications_lines: list[str] | None = None,
) -> ExperienceClassification:
    """Analyze resume entries across sections and full text to classify candidate type and experience."""
    professional_items: list[str] = []
    internship_items: list[str] = []
    virtual_simulation_items: list[str] = []
    structured_items: list[ExperienceItem] = []

    cert_lines = certifications_lines or []

    def check_and_add_simulation(entry_str: str) -> bool:
        """Check if an entry is a virtual simulation and add if not duplicated."""
        entry_lower = entry_str.lower()
        if any(re.search(pat, entry_lower) for pat in VIRTUAL_SIMULATION_KEYWORDS):
            parts = entry_str.split("\n", 1)
            title = parts[0].strip()
            desc = parts[1].strip() if len(parts) > 1 else ""

            # Check if this item is already recorded
            for existing in virtual_simulation_items:
                existing_title = existing.split("\n", 1)[0].strip().lower()
                if title.lower() in existing_title or existing_title in title.lower():
                    return True

            virtual_simulation_items.append(entry_str)
            structured_items.append({
                "title": title,
                "organization": "Virtual Job Simulation",
                "category": "virtual_simulation",
                "description": [desc] if desc else [title]
            })
            return True
        return False

    # 1. Check certifications entries for virtual simulations (e.g. Forage, Job Simulations listed under Certifications)
    for entry in cert_lines:
        check_and_add_simulation(entry)

    # 2. Process explicit experience lines
    for entry in experience_lines:
        entry_lower = entry.lower()

        # Check if entry is contact/profile information mistakenly passed in
        if is_pure_contact_line(entry) or "@" in entry or "linkedin.com" in entry_lower or "github.com" in entry_lower:
            continue

        # Check for virtual simulation first
        if check_and_add_simulation(entry):
            continue

        # Check for internship
        if any(re.search(pat, entry_lower) for pat in INTERNSHIP_PATTERNS):
            internship_items.append(entry)
            title = entry.split("\n", 1)[0].strip()
            desc = entry.split("\n", 1)[1].strip() if "\n" in entry else ""
            structured_items.append({
                "title": title,
                "organization": "Internship",
                "category": "internship",
                "description": [desc] if desc else [title]
            })
            continue

        # Check if it looks like a project mistakenly placed under experience
        if any(re.search(pat, entry_lower) for pat in PROJECT_PATTERNS):
            continue

        # Check if it has genuine professional role or date markers
        is_role = any(re.search(pat, entry_lower) for pat in PROFESSIONAL_ROLE_PATTERNS)
        is_date = any(re.search(pat, entry_lower) for pat in EXPERIENCE_YEARS_PATTERNS)

        if is_role or is_date or (len(entry) > 10 and not any(p in entry_lower for p in ["student", "school", "college", "bachelor", "master"])):
            professional_items.append(entry)
            title = entry.split("\n", 1)[0].strip()
            desc = entry.split("\n", 1)[1].strip() if "\n" in entry else ""
            structured_items.append({
                "title": title,
                "organization": "Professional Experience",
                "category": "professional",
                "description": [desc] if desc else [title]
            })


    # 3. Check projects entries for virtual simulations
    for entry in projects_lines:
        check_and_add_simulation(entry)

    # 4. Fallback search across full text lines/blocks if not yet detected in section entries
    if not virtual_simulation_items:
        lines = full_text.splitlines()
        for idx, raw_line in enumerate(lines):
            line_clean = clean_line(raw_line)
            if any(re.search(pat, line_clean.lower()) for pat in VIRTUAL_SIMULATION_KEYWORDS):
                # Collect continuation lines belonging to this block/bullet
                block_lines = [line_clean]
                for next_line in lines[idx + 1:]:
                    if not next_line.strip() or is_bullet_line(next_line):
                        break
                    block_lines.append(clean_line(next_line))
                full_entry = f"{block_lines[0]}\n{' '.join(block_lines[1:])}" if len(block_lines) > 1 else block_lines[0]
                check_and_add_simulation(full_entry)

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
    # Virtual simulation is highlighted separately and not counted as employment history.
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
