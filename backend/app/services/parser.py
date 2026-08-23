from typing import Any
import re
from typing import TypedDict


class StructuredProject(TypedDict):
    title: str
    description: str
    technologies: list[str]
    is_ongoing: bool


class ParsedResumeData(TypedDict):
    name: str
    email: str
    phone: str
    skills: list[str]
    education: list[str]
    experience: list[str]
    projects: list[str]
    parsed_projects: list[StructuredProject]
    certifications: list[str]


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


def is_pure_contact_line(line: str) -> bool:
    """Check if a line consists predominantly of contact details (email, phone, URLs, address)."""
    cleaned = clean_line(line).strip()
    if not cleaned:
        return False
    # Pure email
    if re.match(r"^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$", cleaned):
        return True
    # Pure phone
    digits = re.sub(r"\D", "", cleaned)
    if (cleaned.startswith("+") or cleaned.startswith("(") or "phone" in cleaned.lower() or "tel" in cleaned.lower()) and 7 <= len(digits) <= 15:
        return True
    # Pure profile link
    if re.match(r"^(?:https?://)?(?:www\.)?(?:linkedin\.com|github\.com|twitter\.com|gitlab\.com)/[a-zA-Z0-9_\-\./]+$", cleaned, re.IGNORECASE):
        return True
    return False


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
        if is_pure_contact_line(raw_line):
            continue

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
        # Check if line looks like a human name (1-4 words, alphabetic characters)
        words = cleaned.split()
        if 1 <= len(words) <= 4 and all(re.match(r"^[A-Za-z.'-]+$", word) for word in words):
            if 2 <= len(cleaned) <= 40:
                return cleaned

    return ""


def segment_sections(text: str) -> dict[str, list[str]]:
    """Segment resume lines into standard sections based on conservative heading detection."""
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

        # Clean potential section header formatting (e.g. "1. PROJECTS:", "--- SKILLS ---")
        normalized_line = re.sub(r"^[\s•*·▪▫○●–—\-\+#\d\.\)\(\[\]]+", "", line).strip()
        normalized_line = re.sub(r"[:#\-_–—]+$", "", normalized_line).strip().lower()

        matched_section = None
        # Conservative check: only match if normalized line is short (< 50 chars) and matches known headings
        if len(normalized_line) <= 50:
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
        if is_pure_contact_line(line):
            continue
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


def is_explicitly_ongoing(project_text: str) -> bool:
    """Detect ongoing status ONLY if explicit indicators exist within the project's own text."""
    lower = project_text.lower()
    
    # 1. Explicit word indicators
    if re.search(r"\b(?:ongoing|in\s*[-–—]?\s*progress|currently\s+working\s+on|under\s+development|continuing)\b", lower):
        return True
        
    # 2. Parenthetical status indicator e.g. (Current), (Present), (Ongoing)
    if re.search(r"\((?:ongoing|current|present|in\s*progress)\)", lower):
        return True

    # 3. Explicit project date range ending in present or current e.g. Jan 2024 - Present, 2023 – Current
    if re.search(r"\b(?:(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s*)?(?:19|20)\d{2}\s*[\-\–\—\to]\s*(?:present|current)\b", lower):
        return True

    return False


def is_project_metadata_line(line: str) -> bool:
    """Determine if a line is project metadata/continuation rather than a new project title.

    This uses STRUCTURAL patterns (label:value, URLs, tech-list shape, date patterns,
    lowercase continuation) — NOT hardcoded project names or technology lists.
    """
    stripped = line.strip()
    if not stripped:
        return False

    # Title with parenthetical tech e.g. "Smart Home Hub (Python, MQTT)" or "Project Nebula (ZetaLang, BarDB)"
    # This is a project title, NOT metadata
    if re.match(r'^[A-Z0-9][A-Za-z0-9\s/&+\-]{1,50}\s*\([^)]+\)$', stripped):
        left_name = stripped.split("(")[0].strip().lower()
        if left_name not in {"technologies", "tech stack", "tools", "frameworks", "stack", "languages", "database", "skills"}:
            return False

    # 1. Label:value pattern — "Word(s): content" where the label is a short field name
    #    Catches: Technologies: ..., GitHub: ..., Duration: ..., Stack: FooLang, etc.
    #    Excludes: "Project Beta: Built a microservices..." (project title: description)
    colon_match = re.match(r'^([A-Za-z][A-Za-z\s&/]{0,25}):\s+(.+)', stripped)
    if colon_match:
        label = colon_match.group(1).strip()
        value = colon_match.group(2).strip()
        label_words = label.split()
        value_first_word = value.split()[0].lower() if value.split() else ""
        is_action_start = value_first_word in COMMON_ACTION_VERBS
        if len(label_words) == 1 and not is_action_start:
            return True
        if len(label_words) <= 3 and not is_action_start:
            label_lower = label.lower()
            field_indicators = {
                "tech", "technologies", "tools", "stack", "framework", "frameworks",
                "language", "languages", "platform", "platforms", "database", "databases",
                "github", "gitlab", "bitbucket", "repository", "repo", "source",
                "demo", "live", "website", "url", "link", "duration", "timeline",
                "role", "team", "status", "type", "category", "domain", "environment",
                "project link", "source code", "live demo", "tech stack",
                "project url", "project type", "libraries", "key skills", "built with",
                "tools used", "core technologies",
            }
            if label_lower in field_indicators or any(ind in label_lower for ind in ["tech", "stack", "tool", "link", "repo", "github", "demo", "duration"]):
                return True

    # 2. URL pattern — contains http(s)://, github.com, gitlab.com, etc.
    if re.search(r'https?://|github\.com|gitlab\.com|bitbucket\.org|\.netlify\.app|\.vercel\.app|\.herokuapp\.com|\.render\.com', stripped, re.IGNORECASE):
        return True

    # 3. Pure parenthetical or bracketed content: e.g. "(React, Node.js)", "[Python, SQLite]"
    if (stripped.startswith("(") and stripped.endswith(")")) or (stripped.startswith("[") and stripped.endswith("]")):
        inner = stripped[1:-1].strip()
        if len(inner) <= 60 and not is_action_bullet(inner):
            return True

    # 4. Delimited short-token list (tech-stack shape: "MEAN Stack, Prompt Engineering" or "Python, SQLite" or "React | Node.js")
    #    Split by comma, pipe, slash, bullet
    #    Catches 2 or more short tokens (each <= 35 chars) that are not full sentences / action verbs
    delims = r'[,|/•·▪▫]'
    parts = [p.strip() for p in re.split(delims, stripped) if p.strip()]
    if len(parts) >= 2:
        all_short = all(0 < len(p) <= 35 for p in parts)
        no_action_verbs = not any(is_action_bullet(p) for p in parts)
        not_sentence = not stripped.endswith(('.', '!', ';'))
        if all_short and no_action_verbs and not_sentence:
            return True

    # 5. Date/duration pattern — "Jan 2024 - Present", "3 months", "2023-2024", "Duration: ..."
    if re.search(r'\b(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s*(?:19|20)\d{2}', stripped, re.IGNORECASE):
        return True
    if re.search(r'\b\d+\s*(?:months?|weeks?|years?|days?)\b', stripped, re.IGNORECASE):
        return True
    if re.search(r'\b(?:19|20)\d{2}\s*[-–—]\s*(?:(?:19|20)\d{2}|present|current|ongoing)\b', stripped, re.IGNORECASE):
        return True

    # 6. Starts with lowercase — likely a continuation sentence
    if stripped[0].islower():
        return True

    # 7. Single word or short phrase that is clearly a field label
    single_word_labels = {
        "features", "highlights", "details", "responsibilities", "description",
        "overview", "outcome", "outcomes", "impact", "results", "achievements",
        "deliverables", "contributions", "role", "summary", "technologies",
        "tech stack", "stack", "tools", "libraries", "frameworks", "links",
        "repositories", "source code", "live demo"
    }
    if stripped.lower().rstrip(':') in single_word_labels:
        return True

    return False


def is_strong_project_boundary(clean_content: str, raw_line: str, has_active_project: bool,
                                detected_pattern: str | None) -> bool:
    """Determine if a line represents a strong new-project boundary using multiple signals.

    Returns True only when there is confident evidence that a NEW project starts here,
    rather than this line being metadata/content of the current project.

    Signals considered:
    - Title-like formatting (short, doesn't end with sentence punctuation)
    - NOT metadata (not a label:value, URL, tech list, date, or continuation)
    - Structural match with previously detected project title patterns
    - Presence of inline parenthetical tech after a name
    """
    # If the line is clearly metadata, it's never a boundary
    if is_project_metadata_line(clean_content):
        return False

    # If there's no active project, any non-metadata title-like line can start the first project
    if not has_active_project:
        if len(clean_content) <= 80 and not clean_content.endswith(('.', ',', ';')):
            return True
        return False

    # With an active project, require stronger evidence.
    signals = 0

    # Signal: Line is short and title-like (not a full sentence)
    if len(clean_content) <= 60 and not clean_content.endswith(('.', ',', ';', '!')):
        signals += 1

    # Signal: Line contains parenthetical tech/status hint e.g. "Project Name (React, Node.js)"
    if re.search(r'\([^)]{2,40}\)\s*$', clean_content):
        signals += 1

    # Signal: Title case or all-caps (common for project titles)
    words = clean_content.split()
    alpha_words = [w for w in words if w[0:1].isalpha()]
    if alpha_words and alpha_words[0][0].isupper() and not is_action_bullet(clean_content):
        # Check if the alphabetic words are capitalized (title case)
        cap_count = sum(1 for w in alpha_words if w[0].isupper())
        if cap_count >= min(len(alpha_words), 2) or (len(alpha_words) == 1 and cap_count == 1):
            signals += 1

    # Signal: matches previously detected project pattern
    if detected_pattern == "standalone_title":
        # Previous projects used standalone title lines — this matches
        if len(clean_content) <= 60:
            signals += 1

    # Require at least 2 signals for a boundary when a project is already active
    return signals >= 2


def parse_techs_from_line(line: str) -> list[str]:
    """Extract individual technology/skill items from a metadata line."""
    cleaned = re.sub(
        r'^(?:technologies|tech\s+stack|stack|tools|built\s+with|frameworks|languages|libraries|database|databases|key\s+skills|skills|tech|environment):\s*',
        '',
        line,
        flags=re.IGNORECASE
    ).strip()
    cleaned = re.sub(r'[\(\)\[\]]', '', cleaned).strip()
    parts = [p.strip() for p in re.split(r'[,|/•·▪▫]', cleaned) if p.strip()]
    extracted = []
    for p in parts:
        p_clean = p.strip(" ,;|:-–—()[]")
        if 1 < len(p_clean) <= 35 and not is_action_bullet(p_clean) and not is_explicitly_ongoing(p_clean):
            if not re.search(r'https?://|github\.com|\b(?:19|20)\d{2}\b|\b\d+\s*months?\b', p_clean, re.I):
                extracted.append(p_clean)
    return extracted


def extract_structured_projects(project_lines: list[str], full_text: str = "") -> list[StructuredProject]:
    """Extract and group distinct project entries with up to a max limit of 10 projects.

    Uses multi-signal boundary detection: a new project starts only when there is strong
    structural evidence. The default behavior when a project is active is to ATTACH
    content to the current project unless boundary evidence is found.
    """
    if not project_lines:
        return []

    raw_joined = "\n".join(project_lines)

    # Detect inline project delimiters (e.g. "...uploads. CDN Network Simulator – Developed...")
    split_pattern = r"(?<=[.!?])\s+(?=[A-Z][A-Za-z0-9\s/&+\-]{2,45}\s+(?:[–—\-|:]|\([A-Za-z0-9,\s+]+\))\s+)"
    normalized_text = re.sub(split_pattern, "\n", raw_joined)

    lines = [l.strip() for l in normalized_text.splitlines() if l.strip()]

    projects_raw: list[dict[str, Any]] = []
    current_title = ""
    current_meta: list[str] = []
    current_descs: list[str] = []
    current_techs: list[str] = []
    detected_pattern: str | None = None  # Learned from first entries

    def flush():
        nonlocal current_title, current_meta, current_descs, current_techs
        if current_title:
            raw_title = current_title
            title = current_title
            extra_descs = []
            for sep in [" – ", " — ", " | ", ": ", " - "]:
                if sep in title:
                    parts = title.split(sep, 1)
                    left = parts[0].strip()
                    right = parts[1].strip()
                    if 2 <= len(left) <= 50 and len(right) > 2:
                        title = left
                        if is_project_metadata_line(right):
                            current_techs.extend(parse_techs_from_line(right))
                            current_meta.append(right)
                        else:
                            extra_descs.append(right)
                        break

            # Extract parenthetical tech if present in title e.g. "Project Name (React, Node.js)"
            parenthetical_match = re.search(r"\(([^)]+)\)", title)
            if parenthetical_match:
                paren_content = parenthetical_match.group(1)
                for t_part in re.split(r"[,/|•]", paren_content):
                    t_clean = t_part.strip()
                    if 1 < len(t_clean) <= 35 and not is_explicitly_ongoing(t_clean):
                        current_techs.append(t_clean)
                title = re.sub(r"\s*\([^)]+\)\s*$", "", title).strip()

            all_desc_lines = extra_descs + current_descs
            if all_desc_lines:
                desc_str = " ".join(all_desc_lines).strip()
            elif current_meta:
                desc_str = " ".join(current_meta).strip()
            else:
                desc_str = title

            combined = f"{raw_title} {title} {desc_str} {' '.join(current_meta)}"

            # Also match common skill keywords across combined text
            for kw in COMMON_SKILL_KEYWORDS:
                if re.search(r"\b" + re.escape(kw.lower()) + r"\b", combined.lower()):
                    current_techs.append(kw)

            # Clean and deduplicate techs while preserving order
            unique_techs = []
            seen_lower = set()
            for t in current_techs:
                t_clean = t.strip()
                t_low = t_clean.lower()
                if t_low not in seen_lower and 1 < len(t_clean) <= 35:
                    seen_lower.add(t_low)
                    unique_techs.append(t_clean)

            is_ongoing = is_explicitly_ongoing(combined)

            projects_raw.append({
                "title": title,
                "description": desc_str,
                "technologies": unique_techs,
                "is_ongoing": is_ongoing,
            })
            current_title = ""
            current_meta = []
            current_descs = []
            current_techs = []

    for line in lines:
        if is_pure_contact_line(line):
            continue

        raw_stripped = line.strip()
        is_numbered = bool(re.match(r"^\(?\d+[\.\\)]\s+", raw_stripped))
        is_bullet = is_bullet_line(raw_stripped) and not is_numbered
        clean_content = clean_line(raw_stripped)
        if not clean_content:
            continue

        # --- Check if line is metadata ---
        if is_project_metadata_line(clean_content):
            current_meta.append(clean_content)
            current_techs.extend(parse_techs_from_line(clean_content))
            continue

        # --- STRONG BOUNDARY: Inline separator "Title – Desc" / "Title | Desc" ---
        has_inline_sep = False
        for sep in [" – ", " — ", " | "]:
            if sep in clean_content:
                parts = clean_content.split(sep, 1)
                left = parts[0].strip()
                right = parts[1].strip()
                if 2 <= len(left) <= 50 and not is_action_bullet(left) and len(right) > 2:
                    if not is_project_metadata_line(left + ": " + right):
                        flush()
                        current_title = left
                        if is_project_metadata_line(right):
                            current_meta.append(right)
                            current_techs.extend(parse_techs_from_line(right))
                        else:
                            current_descs.append(right)
                        has_inline_sep = True
                        if not detected_pattern:
                            detected_pattern = "inline_separator"
                        break

        if has_inline_sep:
            continue

        # Handle ": " separator carefully — only treat as project boundary if
        # the full line doesn't look like project metadata (label: value)
        if ": " in clean_content and not has_inline_sep:
            parts = clean_content.split(": ", 1)
            left = parts[0].strip()
            right = parts[1].strip()
            if 2 <= len(left) <= 50 and not is_action_bullet(left) and len(right) > 2:
                flush()
                current_title = left
                if is_project_metadata_line(right):
                    current_meta.append(right)
                    current_techs.extend(parse_techs_from_line(right))
                else:
                    current_descs.append(right)
                if not detected_pattern:
                    detected_pattern = "inline_separator"
                continue

        # Handle " - " separator
        if " - " in clean_content and not has_inline_sep:
            parts = clean_content.split(" - ", 1)
            left = parts[0].strip()
            right = parts[1].strip()
            if 2 <= len(left) <= 50 and not is_action_bullet(left) and len(right) > 2:
                flush()
                current_title = left
                if is_project_metadata_line(right):
                    current_meta.append(right)
                    current_techs.extend(parse_techs_from_line(right))
                else:
                    current_descs.append(right)
                if not detected_pattern:
                    detected_pattern = "inline_separator"
                continue

        # --- STRONG BOUNDARY: Numbered entry ---
        if is_numbered:
            flush()
            current_title = clean_content
            if not detected_pattern:
                detected_pattern = "numbered"
            continue

        # --- ATTACH: Bullet lines or action-verb lines belong to current project ---
        if is_bullet or is_action_bullet(clean_content):
            if not current_title:
                # No active project — first bullet becomes the seed
                current_title = clean_content.split(".")[0][:45].strip()
                current_descs.append(clean_content)
            else:
                current_descs.append(clean_content)
            continue

        # --- MULTI-SIGNAL BOUNDARY CHECK ---
        has_active = bool(current_title)
        if is_strong_project_boundary(clean_content, raw_stripped, has_active, detected_pattern):
            flush()
            current_title = clean_content
            if not detected_pattern:
                detected_pattern = "standalone_title"
        else:
            # DEFAULT: Attach to current project
            if current_title:
                current_descs.append(clean_content)
            else:
                current_title = clean_content
                if len(clean_content) > 60:
                    current_descs.append(clean_content)

    flush()
    # pyrefly: ignore [bad-return]
    return projects_raw[:10]


def parse_resume(text: str) -> ParsedResumeData:
    """Parse basic resume fields and sections from extracted text."""
    email = extract_email(text)
    phone = extract_phone(text)
    name = extract_name(text)

    sections = segment_sections(text)

    skills = parse_skills_section(sections.get("skills", []), text)
    education = parse_section_entries(sections.get("education", []))
    experience = parse_section_entries(sections.get("experience", []))
    
    # Extract distinct structured projects (up to 10 max)
    structured_projects = extract_structured_projects(sections.get("projects", []), text)
    projects = [
        f"{p['title']} – {p['description']}" if p["description"] and p["description"] != p["title"] else p["title"]
        for p in structured_projects
    ]
    if not projects:
        raw_proj_entries = parse_section_entries(sections.get("projects", []))[:10]
        projects = raw_proj_entries
        for p in raw_proj_entries:
            parts = p.split("\n", 1)
            title = parts[0].strip()
            desc = parts[1].strip() if len(parts) > 1 else title
            structured_projects.append({
                "title": title,
                "description": desc,
                "technologies": [],
                "is_ongoing": is_explicitly_ongoing(p),
            })

    certifications = parse_section_entries(sections.get("certifications", []))

    return {
        "name": name,
        "email": email,
        "phone": phone,
        "skills": skills,
        "education": education,
        "experience": experience,
        "projects": projects[:10],
        "parsed_projects": structured_projects[:10],
        "certifications": certifications,
    }
