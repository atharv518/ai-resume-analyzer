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
    skip_terms = {
        "resume", "curriculum", "vitae", "cv", "page", "contact", "email", "phone", "profile", "summary",
        "college", "university", "department", "school", "institute", "engineering", "experiment", "assignment",
        "invoice", "question", "instructions", "laboratory", "lab", "academic", "theory", "performance", "conclusion",
        "aim", "semester", "syllabus", "subject", "chapter", "abstract", "receipt"
    }

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


COMMON_ACTION_VERBS = {
    "built", "developed", "created", "implemented", "designed", "engineered",
    "used", "utilized", "managed", "conducted", "spearheaded", "trained",
    "integrated", "wrote", "constructed", "configured", "maintained", "automated",
    "optimized", "achieved", "analyzed", "deployed", "enhanced", "facilitated",
    "generated", "leveraged", "orchestrated", "performed", "resolved", "streamlined",
    "supervised", "tested", "worked", "collaborated", "applied", "assisted",
    "delivered", "established", "formulated", "improved", "launched", "modelled",
    "modeled", "programmed", "researched", "secured", "upgraded"
}


def is_action_bullet(text: str) -> bool:
    """Check if a line starts with a common project action verb."""
    clean = re.sub(r"^[•\-\*–—\d\.\)\(\[\]\s]+", "", text).strip().lower()
    first_word = clean.split()[0] if clean.split() else ""
    return first_word in COMMON_ACTION_VERBS


def extract_structured_projects(project_lines: list[str], full_text: str = "") -> list[StructuredProject]:
    """Extract and group distinct project entries with up to a max limit of 3 projects."""
    if not project_lines:
        return []

    raw_joined = "\n".join(project_lines)

    # Detect inline project delimiters (e.g. "...uploads. CDN Network Simulator – Developed...")
    split_pattern = r"(?<=[.!?])\s+(?=[A-Z][A-Za-z0-9\s/&+\-]{2,45}\s+(?:[–—\-|:]|\([A-Za-z0-9,\s+]+\))\s+)"
    normalized_text = re.sub(split_pattern, "\n", raw_joined)

    lines = [l.strip() for l in normalized_text.splitlines() if l.strip()]

    projects_raw: list[dict[str, str]] = []
    current_title = ""
    current_descs: list[str] = []

    def flush():
        nonlocal current_title, current_descs
        if current_title:
            desc_str = " ".join(current_descs).strip()
            projects_raw.append({
                "title": current_title,
                "description": desc_str,
            })
            current_title = ""
            current_descs = []

    for line in lines:
        is_bullet = is_bullet_line(line) or bool(re.match(r"^[•\-\*–—]|\d+\.|\(\d+\)|\[\d+\]", line))
        clean_content = clean_line(line)
        if not clean_content:
            continue

        # Check if line contains inline project separator "Title: Desc" or "Title – Desc" or "Title | Desc"
        has_inline_sep = False
        for sep in [" – ", " — ", " | ", ": ", " - "]:
            if sep in clean_content:
                parts = clean_content.split(sep, 1)
                left = parts[0].strip()
                right = parts[1].strip()
                # Left is title if 2-50 chars and doesn't start with an action verb
                if 2 <= len(left) <= 50 and not is_action_bullet(left) and len(right) > 2:
                    flush()
                    current_title = left
                    current_descs = [right]
                    has_inline_sep = True
                    break

        if has_inline_sep:
            continue

        # If it's a bullet line or starts with an action verb, it belongs to the current project description
        if is_bullet or is_action_bullet(clean_content):
            if not current_title:
                current_title = clean_content.split(".")[0][:45].strip()
                current_descs.append(clean_content)
            else:
                current_descs.append(clean_content)
        else:
            # Short header-like line without bullet/action verb -> New Project Title!
            if len(clean_content) <= 60 and not clean_content.endswith((".", ",", ";")):
                flush()
                current_title = clean_content
            else:
                if current_title:
                    current_descs.append(clean_content)
                else:
                    current_title = clean_content[:45].strip()
                    current_descs.append(clean_content)

    flush()

    structured: list[StructuredProject] = []
    for item in projects_raw[:3]:  # Strictly limit to top 3 projects
        title = item["title"]
        desc = item["description"]

        # Clean title if it still contains a separator
        for sep in [" – ", " — ", " | ", ": ", " - "]:
            if sep in title:
                parts = title.split(sep, 1)
                if len(parts[0].strip()) <= 50 and len(parts[1].strip()) > 3:
                    title = parts[0].strip()
                    desc = (parts[1].strip() + " " + desc).strip()
                    break

        full_desc = desc if desc else title
        combined = f"{title} {full_desc}".lower()

        techs = [
            s for s in COMMON_SKILL_KEYWORDS
            if re.search(r"\b" + re.escape(s.lower()) + r"\b", combined)
        ]

        structured.append({
            "title": title,
            "description": full_desc,
            "technologies": list(dict.fromkeys(techs)),
        })

    return structured[:3]


def parse_resume(text: str) -> ParsedResumeData:
    """Parse basic resume fields and sections from extracted text."""
    email = extract_email(text)
    phone = extract_phone(text)
    name = extract_name(text)

    sections = segment_sections(text)

    skills = parse_skills_section(sections.get("skills", []), text)
    education = parse_section_entries(sections.get("education", []))
    experience = parse_section_entries(sections.get("experience", []))
    
    # Extract distinct structured projects (capped at top 3 max)
    structured_projects = extract_structured_projects(sections.get("projects", []), text)
    projects = [
        f"{p['title']} – {p['description']}" if p["description"] and p["description"] != p["title"] else p["title"]
        for p in structured_projects
    ]
    if not projects:
        projects = parse_section_entries(sections.get("projects", []))[:3]

    certifications = parse_section_entries(sections.get("certifications", []))

    return {
        "name": name,
        "email": email,
        "phone": phone,
        "skills": skills,
        "education": education,
        "experience": experience,
        "projects": projects[:3],
        "certifications": certifications,
    }
