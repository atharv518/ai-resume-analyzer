import re
from typing import TypedDict


class ParsedResumeData(TypedDict):
    name: str
    email: str
    phone: str
    skills: list[str]
    education: list[str]
    experience: list[str]
    projects: list[str]
    certifications: list[str]


class StructuredProject(TypedDict):
    title: str
    description: str
    technologies: list[str]


# Common technical and soft skills to look for in addition to section parsing
COMMON_SKILL_KEYWORDS = [
    "Python", "JavaScript", "TypeScript", "Java", "C++", "C#", "C", "Go", "Rust", "PHP", "Ruby", "Swift", "Kotlin", "R",
    "HTML", "HTML5", "CSS", "CSS3", "Tailwind CSS", "Bootstrap", "Sass",
    "React", "React.js", "Next.js", "Vue", "Vue.js", "Angular", "Svelte", "Redux",
    "Node.js", "Express", "Express.js", "FastAPI", "Flask", "Django", "Spring Boot", "ASP.NET",
    "SQL", "MySQL", "PostgreSQL", "SQLite", "MongoDB", "Redis", "Oracle", "Firebase", "Supabase",
    "Docker", "Kubernetes", "AWS", "Azure", "GCP", "Google Cloud", "CI/CD", "Linux", "Git", "GitHub", "GitLab",
    "REST API", "REST APIs", "GraphQL", "Microservices",
    "Machine Learning", "Deep Learning", "Data Analysis", "NLP", "Pandas", "NumPy", "Scikit-Learn", "TensorFlow", "PyTorch",
    "Agile", "Scrum", "Jira", "Figma", "Problem Solving", "Communication"
]

SECTION_HEADINGS = {
    "skills": [
        "technical skills", "skills & abilities", "skills and abilities", "core skills",
        "key skills", "skills", "technologies", "tools & technologies", "competencies",
        "programming skills", "technical proficiencies", "areas of expertise"
    ],
    "education": [
        "education", "educational background", "academic background", "academic qualifications",
        "academics", "qualifications", "education & certifications"
    ],
    "experience": [
        "work experience", "professional experience", "employment history", "work history",
        "experience", "internships", "internship experience", "relevant experience"
    ],
    "projects": [
        "projects", "academic projects", "personal projects", "key projects",
        "technical projects", "featured projects", "selected projects"
    ],
    "certifications": [
        "certifications", "certificates", "licenses & certifications", "certifications & courses",
        "training & certifications", "licenses", "courses", "professional certifications"
    ],
    "other": [
        "summary", "professional summary", "about me", "objective", "career objective",
        "awards", "honors", "achievements", "publications", "languages", "references",
        "interests", "hobbies", "extracurricular activities", "volunteer experience"
    ]
}


def clean_line(line: str) -> str:
    """Remove bullet characters and surrounding whitespace."""
    cleaned = re.sub(r"^[\s•*·▪▫○●–—\-\+]+", "", line).strip()
    cleaned = re.sub(r"^\(?\d+[\.\)]\s*", "", cleaned).strip()
    return cleaned


def is_bullet_line(line: str) -> bool:
    """Check if a line starts with a bullet marker or list number."""
    stripped = line.strip()
    if not stripped:
        return False
    return bool(re.match(r"^[\s•*·▪▫○●–—\-\+]|^\(?\d+[\.\)]\s+", stripped))


def group_section_entries(lines: list[str]) -> list[dict[str, str]]:
    """Group lines into distinct section entries (handling multi-line bullet points and descriptions)."""
    entries: list[dict[str, str]] = []
    has_bullets = any(is_bullet_line(l) for l in lines)

    current_title = ""
    current_descs: list[str] = []

    def flush_entry():
        nonlocal current_title, current_descs
        if current_title:
            desc_str = " ".join(current_descs).strip()
            full_str = f"{current_title}\n{desc_str}" if desc_str else current_title
            entries.append({
                "title": current_title,
                "description": desc_str,
                "full_text": full_str,
            })
            current_title = ""
            current_descs = []

    for raw_line in lines:
        line_clean = clean_line(raw_line)
        if not line_clean:
            if not has_bullets and current_title:
                flush_entry()
            continue

        if has_bullets:
            if is_bullet_line(raw_line):
                flush_entry()
                current_title = line_clean
            else:
                if current_title:
                    current_descs.append(line_clean)
                else:
                    current_title = line_clean
        else:
            is_header = len(line_clean) < 60 and not line_clean.endswith(".")
            if is_header and current_title and current_descs:
                flush_entry()
                current_title = line_clean
            elif not current_title:
                current_title = line_clean
            else:
                current_descs.append(line_clean)

    flush_entry()
    return entries


def extract_email(text: str) -> str:
    """Extract first valid email address from text."""
    match = re.search(r"[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+", text)
    return match.group(0).strip().rstrip(".") if match else ""


def extract_phone(text: str) -> str:
    """Extract first valid phone number from text."""
    # Matches common phone number formats with international/area codes
    patterns = [
        r"(?:\+?\d{1,3}[-.\s]?)?\(?\d{2,4}\)?[-.\s]?\d{3,4}[-.\s]?\d{3,5}",
    ]
    for pattern in patterns:
        for match in re.finditer(pattern, text):
            candidate = match.group(0).strip()
            digits = re.sub(r"\D", "", candidate)
            # Valid phone numbers usually have 7 to 15 digits
            if 7 <= len(digits) <= 15:
                return candidate
    return ""


def extract_name(text: str) -> str:
    """Extract candidate name from the top lines of the resume."""
    lines = [line.strip() for line in text.splitlines() if line.strip()]
    skip_terms = {"resume", "curriculum", "vitae", "cv", "page", "contact", "email", "phone", "profile", "summary"}

    for line in lines[:6]:
        # Ignore lines with contact links or common labels
        if "@" in line or "http" in line or "linkedin" in line or "github" in line or "|" in line:
            continue
        lower_line = line.lower()
        if any(term in lower_line for term in skip_terms):
            continue

        cleaned = clean_line(line)
        # Check if line looks like a human name (2-4 words, alphabetic characters)
        words = cleaned.split()
        if 1 <= len(words) <= 4 and all(re.match(r"^[A-Za-z.'-]+$", word) for word in words):
            # Check length is reasonable
            if 2 <= len(cleaned) <= 40:
                return cleaned

    return ""


def segment_sections(text: str) -> dict[str, list[str]]:
    """Segment resume lines into standard sections based on detected headings."""
    sections: dict[str, list[str]] = {
        "skills": [],
        "education": [],
        "experience": [],
        "projects": [],
        "certifications": [],
        "other": []
    }

    current_section = "other"
    lines = text.splitlines()

    for raw_line in lines:
        line = raw_line.strip()
        if not line:
            continue

        normalized_line = re.sub(r"[:#\-_]+$", "", line).strip().lower()
        normalized_line = clean_line(normalized_line)

        matched_section = None
        # Check if line is a section heading
        for section_name, heading_variants in SECTION_HEADINGS.items():
            if normalized_line in heading_variants:
                matched_section = section_name
                break

        if matched_section:
            current_section = matched_section
        else:
            sections[current_section].append(line)

    return sections


def parse_skills_section(skill_lines: list[str], full_text: str) -> list[str]:
    """Parse skills from skills section and cross-reference common keywords."""
    extracted_skills: list[str] = []
    seen: set[str] = set()

    def add_skill(skill: str):
        cleaned = clean_line(skill)
        cleaned = re.sub(r"^(languages|frameworks|tools|databases|technologies|libraries|concepts):\s*", "", cleaned, flags=re.IGNORECASE)
        cleaned = cleaned.strip(" ,;|:")
        if cleaned and 1 < len(cleaned) < 40 and cleaned.lower() not in seen:
            seen.add(cleaned.lower())
            extracted_skills.append(cleaned)

    # 1. Parse lines from the detected skills section
    for line in skill_lines:
        # Split by typical separators
        parts = re.split(r"[,|•·▪;/\n]", line)
        for part in parts:
            if ":" in part:
                subparts = part.split(":")
                for subpart in subparts[1:]:
                    for item in subpart.split(","):
                        add_skill(item)
            else:
                add_skill(part)

    # 2. Cross-match common keywords from full text if section was empty or small
    full_text_lower = full_text.lower()
    for keyword in COMMON_SKILL_KEYWORDS:
        pattern = r"\b" + re.escape(keyword.lower()) + r"\b"
        if re.search(pattern, full_text_lower):
            if keyword.lower() not in seen:
                seen.add(keyword.lower())
                extracted_skills.append(keyword)

    return extracted_skills


def parse_section_entries(lines: list[str]) -> list[str]:
    """Group and clean section entries (multi-line aware) for structured section display."""
    grouped = group_section_entries(lines)
    entries: list[str] = []
    for item in grouped:
        full_text = item["full_text"].strip()
        if full_text and len(full_text) > 2:
            entries.append(full_text)
    return entries


def extract_structured_projects(project_lines: list[str], full_text: str) -> list[StructuredProject]:
    """Group project lines into structured project representations."""
    if not project_lines:
        return []

    grouped = group_section_entries(project_lines)
    structured: list[StructuredProject] = []

    for entry in grouped:
        raw_title = entry["title"]
        desc = entry["description"]

        title = raw_title
        inline_desc = ""
        for sep in [" – ", " — ", " - ", " | ", ": "]:
            if sep in raw_title:
                parts = raw_title.split(sep, 1)
                # Ensure the part before separator looks like a project name (<= 50 chars)
                if len(parts[0].strip()) <= 50 and len(parts[1].strip()) > 3:
                    title = parts[0].strip()
                    inline_desc = parts[1].strip()
                    break

        full_desc = (inline_desc + " " + desc).strip() if (inline_desc or desc) else title
        combined_text = f"{title} {full_desc}".lower()

        techs = [
            s for s in COMMON_SKILL_KEYWORDS
            if re.search(r"\b" + re.escape(s.lower()) + r"\b", combined_text)
        ]

        structured.append({
            "title": title,
            "description": full_desc,
            "technologies": list(dict.fromkeys(techs)),
        })

    return structured


def parse_resume(text: str) -> ParsedResumeData:
    """Parse basic resume fields and sections from extracted text."""
    email = extract_email(text)
    phone = extract_phone(text)
    name = extract_name(text)

    sections = segment_sections(text)

    skills = parse_skills_section(sections.get("skills", []), text)
    education = parse_section_entries(sections.get("education", []))
    experience = parse_section_entries(sections.get("experience", []))
    projects = parse_section_entries(sections.get("projects", []))
    certifications = parse_section_entries(sections.get("certifications", []))

    return {
        "name": name,
        "email": email,
        "phone": phone,
        "skills": skills,
        "education": education,
        "experience": experience,
        "projects": projects,
        "certifications": certifications,
    }
