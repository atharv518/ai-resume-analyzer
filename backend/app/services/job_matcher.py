import re
from typing import Any, TypedDict
from app.services.parser import COMMON_SKILL_KEYWORDS


class MatchResults(TypedDict, total=False):
    matching_skills: list[str]
    missing_skills: list[str]
    matching_keywords: list[str]
    missing_keywords: list[str]
    jd_skills: list[str]
    jd_keywords: list[str]
    skill_match_percentage: float
    keyword_match_percentage: float
    synonym_matches: dict[str, str]
    categorized_skills: dict[str, list[str]]
    jd_experience_requirement: str | None
    jd_education_requirement: str | None
    matching_responsibilities: list[str]
    missing_responsibilities: list[str]
    required_skills: list[str]
    preferred_skills: list[str]


# Extended vocabulary of domain concepts, methodologies, tools, and technical keywords
DOMAIN_KEYWORDS = [
    # Concepts & Methodologies
    "REST API", "REST APIs", "RESTful", "Microservices", "System Design", "Agile", "Scrum", "CI/CD",
    "Unit Testing", "Integration Testing", "TDD", "Clean Code", "Design Patterns",
    "MVC", "Object Oriented Programming", "OOP", "Data Structures", "Algorithms",
    "Concurrency", "Multithreading", "Scalability", "High Availability", "Performance Optimization",
    "Cloud Computing", "DevOps", "Containerization", "Version Control", "Code Review",
    "Database Design", "Schema Design", "ORM", "ETL", "Data Pipelines",
    # Tools & Platforms
    "Docker", "Kubernetes", "Git", "GitHub", "GitLab", "Bitbucket", "Jira", "Postman",
    "Swagger", "OpenAPI", "Linux", "Unix", "Bash", "Shell Scripting", "Nginx", "Apache",
    "AWS", "Azure", "GCP", "Google Cloud", "S3", "EC2", "Lambda", "DynamoDB", "RDS",
    "Redis", "Kafka", "RabbitMQ", "Celery", "Elasticsearch", "Grafana", "Prometheus",
    # Frameworks & Libraries
    "FastAPI", "Flask", "Django", "React", "React.js", "Next.js", "Vue", "Angular",
    "Node.js", "Express", "Express.js", "Spring Boot", "PyTorch", "TensorFlow", "Pandas", "NumPy",
    "Scikit-Learn", "SQLAlchemy", "Pydantic", "Tailwind CSS", "Bootstrap",
    # Languages & DBs
    "Python", "JavaScript", "TypeScript", "Java", "C++", "C#", "Go", "Rust", "SQL", "HTML", "CSS",
    "PostgreSQL", "MySQL", "MongoDB", "SQLite"
]

# Comprehensive Synonym and Alias Dictionary
TECH_SYNONYMS: dict[str, list[str]] = {
    "React": ["react", "react.js", "reactjs", "react js"],
    "JavaScript": ["javascript", "js", "ecmascript", "es6", "es6+"],
    "TypeScript": ["typescript", "ts"],
    "PostgreSQL": ["postgresql", "postgres", "psql", "postgre sql", "postgre"],
    "Machine Learning": ["machine learning", "ml"],
    "Deep Learning": ["deep learning", "dl"],
    "Natural Language Processing": ["natural language processing", "nlp"],
    "Kubernetes": ["kubernetes", "k8s"],
    "AWS": ["aws", "amazon web services", "amazon cloud"],
    "GCP": ["gcp", "google cloud platform", "google cloud"],
    "Azure": ["azure", "microsoft azure"],
    "Node.js": ["node.js", "nodejs", "node js", "node"],
    "Express.js": ["express.js", "expressjs", "express js", "express"],
    "Vue.js": ["vue", "vue.js", "vuejs"],
    "Angular": ["angular", "angular.js", "angularjs", "angular 2+"],
    "FastAPI": ["fastapi", "fast api"],
    "MongoDB": ["mongodb", "mongo db", "mongo"],
    "REST API": ["rest api", "rest apis", "restful", "restful api", "restful apis", "rest"],
    "CI/CD": ["ci/cd", "ci cd", "cicd", "continuous integration", "continuous deployment", "ci / cd"],
    "Docker": ["docker", "containerization", "docker containers", "containers"],
    "Tailwind CSS": ["tailwind css", "tailwindcss", "tailwind"],
    "Bootstrap": ["bootstrap", "bootstrap css", "bootstrap 5"],
    "Scikit-Learn": ["scikit-learn", "scikit learn", "sklearn"],
    "Object Oriented Programming": ["object oriented programming", "oop"],
    "HTML": ["html", "html5"],
    "CSS": ["css", "css3"],
    "SQLAlchemy": ["sqlalchemy", "sql alchemy"],
    "Spring Boot": ["spring boot", "springboot", "spring framework", "spring"],
    "Git": ["git", "github", "gitlab", "bitbucket", "version control"],
    "C++": ["c++", "cpp"],
    "C#": ["c#", "csharp", "c sharp", ".net", "dotnet", "asp.net"],
    "Go": ["go", "golang"],
    "Microservices": ["microservices", "microservice architecture", "micro-services", "microservice"],
    "Redis": ["redis", "redis cache"],
    "GraphQL": ["graphql", "graph ql"],
    "Postman": ["postman", "api testing"],
    "Linux": ["linux", "unix", "ubuntu", "debian", "centos", "redhat", "bash", "shell scripting"],
    "Agile": ["agile", "scrum", "kanban", "sprints"],
    "PyTorch": ["pytorch", "torch"],
    "TensorFlow": ["tensorflow", "tf"],
}

# Inverted mapping: alias -> canonical name
ALIAS_TO_CANONICAL: dict[str, str] = {}
for canonical, aliases in TECH_SYNONYMS.items():
    for alias in aliases:
        ALIAS_TO_CANONICAL[alias.lower()] = canonical

# Skill Categories
SKILL_CATEGORIES: dict[str, list[str]] = {
    "Programming Languages": ["Python", "JavaScript", "TypeScript", "Java", "C++", "C#", "Go", "Rust", "SQL", "HTML", "CSS", "R", "PHP", "Ruby", "Swift", "Kotlin"],
    "Frameworks & Libraries": ["React", "FastAPI", "Django", "Flask", "Node.js", "Express.js", "Next.js", "Vue.js", "Angular", "Spring Boot", "PyTorch", "TensorFlow", "Pandas", "NumPy", "Scikit-Learn", "SQLAlchemy", "Tailwind CSS", "Bootstrap"],
    "Databases & Storage": ["PostgreSQL", "MySQL", "MongoDB", "Redis", "SQLite", "DynamoDB", "Elasticsearch", "Oracle", "Firebase", "Supabase"],
    "Cloud & DevOps": ["AWS", "GCP", "Azure", "Docker", "Kubernetes", "CI/CD", "Linux", "Nginx", "Terraform", "Cloud Computing"],
    "Tools & Platforms": ["Git", "GitHub", "GitLab", "Jira", "Postman", "Swagger", "Grafana", "Prometheus", "Figma"],
    "Architecture & Concepts": ["REST API", "Microservices", "System Design", "Agile", "Unit Testing", "Object Oriented Programming", "Machine Learning", "Natural Language Processing", "Data Pipelines", "Scalability"],
}


def normalize_skill(skill: str) -> str:
    """Normalize skill string for case-insensitive and format-insensitive comparison."""
    cleaned = skill.strip().lower()
    cleaned = re.sub(r"[\.js|css]+$", "", cleaned)
    cleaned = re.sub(r"[\s\-_]+", "", cleaned)
    return cleaned


def get_canonical_name(term: str) -> str:
    """Return the canonical technology name if an alias exists, or the cleaned term."""
    term_lower = term.strip().lower()
    if term_lower in ALIAS_TO_CANONICAL:
        return ALIAS_TO_CANONICAL[term_lower]
    # Check normalized
    norm = normalize_skill(term)
    for alias, canonical in ALIAS_TO_CANONICAL.items():
        if normalize_skill(alias) == norm:
            return canonical
    return term.strip()


def check_term_in_text(term: str, text_lower: str) -> tuple[bool, str | None]:
    """Check if term or any of its known aliases are present in the lowercase text."""
    canonical = get_canonical_name(term)
    aliases = TECH_SYNONYMS.get(canonical, [term])

    for alias in aliases:
        alias_lower = alias.lower()
        if alias_lower in ["c", "go", "r", "js", "ts", "ml", "dl", "db", "ui", "ux"]:
            # Stricter word boundary for short 1-2 char acronyms
            pattern = r"(?<![a-zA-Z0-9_\-\.\+])" + re.escape(alias_lower) + r"(?![a-zA-Z0-9_\-\.\+])"
        elif "+" in alias_lower or "#" in alias_lower:
            pattern = r"(?<![a-zA-Z0-9_])" + re.escape(alias_lower) + r"(?![a-zA-Z0-9_])"
        else:
            pattern = r"(?<![\w\-])" + re.escape(alias_lower) + r"(?![\w\-])"

        if re.search(pattern, text_lower):
            return True, alias

    return False, None


def extract_skills_from_text(text: str) -> list[str]:
    """Extract identified technical and domain skills with alias awareness."""
    found_skills: list[str] = []
    seen_canonical: set[str] = set()
    text_lower = text.lower()

    # 1. Search through known canonical synonym dictionary
    for canonical, aliases in TECH_SYNONYMS.items():
        is_present, matched_alias = check_term_in_text(canonical, text_lower)
        if is_present and canonical not in seen_canonical:
            seen_canonical.add(canonical)
            found_skills.append(canonical)

    # 2. Search other vocab items
    all_vocab = list(dict.fromkeys(COMMON_SKILL_KEYWORDS + DOMAIN_KEYWORDS))
    for term in all_vocab:
        canonical = get_canonical_name(term)
        if canonical not in seen_canonical:
            is_present, _ = check_term_in_text(term, text_lower)
            if is_present:
                seen_canonical.add(canonical)
                found_skills.append(canonical)

    return found_skills


def extract_keywords_from_jd(jd_text: str) -> list[str]:
    """Extract key domain keywords and phrases from job description."""
    keywords = extract_skills_from_text(jd_text)

    additional_terms = [
        "Distributed Systems", "Backend Architecture", "Frontend Architecture",
        "API Integration", "Automated Testing", "Authentication", "Authorization",
        "OAuth", "JWT", "Data Modeling", "Web Security", "Monitoring", "Logging",
        "Performance Tuning", "Database Optimization", "Clean Architecture"
    ]
    jd_lower = jd_text.lower()
    for term in additional_terms:
        if re.search(r"\b" + re.escape(term.lower()) + r"\b", jd_lower):
            if term not in keywords:
                keywords.append(term)

    return keywords


def extract_structured_jd_info(jd_text: str) -> dict[str, Any]:
    """Extract experience requirements, education requirements, and responsibilities from JD."""
    if not jd_text or not jd_text.strip():
        return {
            "experience_req": None,
            "education_req": None,
            "responsibilities": [],
            "required_skills": [],
            "preferred_skills": [],
        }

    jd_lower = jd_text.lower()

    # Experience requirement detection (e.g., "3+ years", "2-4 years of experience", "entry level")
    exp_req: str | None = None
    exp_matches = re.findall(r"\b(\d+\s*[\-\–\+to]\s*\d*|\d+\+?)\s*(?:years?|yrs?)(?:\s+of)?(?:\s+experience)?\b", jd_lower)
    if exp_matches:
        exp_req = f"{exp_matches[0].strip()} years of experience"
    elif "entry level" in jd_lower or "fresher" in jd_lower or "junior" in jd_lower or "new grad" in jd_lower:
        exp_req = "Entry Level / Junior (0-2 years)"
    elif "senior" in jd_lower or "lead" in jd_lower:
        exp_req = "Senior / Lead (5+ years)"

    # Education requirement detection
    edu_req: str | None = None
    if any(deg in jd_lower for deg in ["master", "m.s.", "m.tech", "phd", "advanced degree"]):
        edu_req = "Master's or Advanced Degree in Computer Science or related field"
    elif any(deg in jd_lower for deg in ["bachelor", "b.s.", "b.tech", "b.e.", "degree in computer science"]):
        edu_req = "Bachelor's Degree in Computer Science or related engineering discipline"
    elif "degree" in jd_lower or "university" in jd_lower:
        edu_req = "Relevant Degree or equivalent practical experience"

    # Responsibilities extraction (lines or sentences with action verbs)
    responsibilities: list[str] = []
    lines = [line.strip() for line in jd_text.splitlines() if line.strip()]
    action_starters = (
        "design", "build", "develop", "create", "implement", "maintain", "collaborate",
        "lead", "optimize", "architect", "scale", "manage", "deploy", "participate", "write"
    )
    for line in lines:
        cleaned = re.sub(r"^[\s•*·▪–\-\d+\.)]+", "", line).strip()
        cleaned_lower = cleaned.lower()
        if any(cleaned_lower.startswith(starter) for starter in action_starters) and 15 <= len(cleaned) <= 150:
            responsibilities.append(cleaned)
        elif len(responsibilities) < 4 and len(cleaned) > 20 and any(f" {starter} " in f" {cleaned_lower} " for starter in action_starters[:6]):
            responsibilities.append(cleaned)

    # Required vs Preferred skill extraction heuristics
    all_skills = extract_skills_from_text(jd_text)
    required_skills: list[str] = []
    preferred_skills: list[str] = []

    preferred_section = False
    for line in lines:
        line_lower = line.lower()
        if any(w in line_lower for w in ["nice to have", "preferred", "bonus", "plus", "good to have"]):
            preferred_section = True
        elif any(w in line_lower for w in ["required", "must have", "qualifications", "requirements"]):
            preferred_section = False

        found_in_line = extract_skills_from_text(line)
        for s in found_in_line:
            if preferred_section and s not in preferred_skills:
                preferred_skills.append(s)
            elif not preferred_section and s not in required_skills:
                required_skills.append(s)

    if not required_skills:
        required_skills = all_skills
    if not preferred_skills:
        preferred_skills = [s for s in all_skills if s not in required_skills[:len(all_skills)//2]]

    return {
        "experience_req": exp_req,
        "education_req": edu_req,
        "responsibilities": responsibilities[:6],
        "required_skills": list(dict.fromkeys(required_skills)),
        "preferred_skills": list(dict.fromkeys(preferred_skills)),
    }


def categorize_skills_list(skills: list[str]) -> dict[str, list[str]]:
    """Group a list of skills into clean domain categories."""
    categorized: dict[str, list[str]] = {cat: [] for cat in SKILL_CATEGORIES}
    categorized["Other Technical Skills"] = []

    for skill in skills:
        canonical = get_canonical_name(skill)
        placed = False
        for cat_name, cat_skills in SKILL_CATEGORIES.items():
            if any(canonical.lower() == s.lower() or normalize_skill(canonical) == normalize_skill(s) for s in cat_skills):
                if skill not in categorized[cat_name]:
                    categorized[cat_name].append(skill)
                placed = True
                break
        if not placed:
            if skill not in categorized["Other Technical Skills"]:
                categorized["Other Technical Skills"].append(skill)

    return {k: v for k, v in categorized.items() if v}


def compare_resume_with_jd(
    resume_text: str,
    resume_skills: list[str],
    jd_text: str
) -> MatchResults:
    """Compare extracted resume content and skills against the job description with synonym awareness."""
    resume_skills_from_text = extract_skills_from_text(resume_text)
    combined_resume_skills = list(dict.fromkeys(resume_skills + resume_skills_from_text))
    resume_text_lower = resume_text.lower()

    # Map of all canonical resume skills
    canonical_resume_skills = {get_canonical_name(s): s for s in combined_resume_skills}
    normalized_resume_skills = {normalize_skill(s): s for s in combined_resume_skills}

    # If no Job Description was provided, evaluate resume's internal skill and keyword richness
    if not jd_text or not jd_text.strip():
        resume_keywords = [
            term for term in DOMAIN_KEYWORDS
            if check_term_in_text(term, resume_text_lower)[0]
        ]
        skill_score = min(max(len(combined_resume_skills) * 14.0, 40.0), 100.0) if combined_resume_skills else 40.0
        keyword_score = min(max(len(resume_keywords) * 10.0, 40.0), 100.0) if resume_keywords else 40.0

        return {
            "matching_skills": combined_resume_skills,
            "missing_skills": [],
            "matching_keywords": list(dict.fromkeys(resume_keywords)),
            "missing_keywords": [],
            "jd_skills": [],
            "jd_keywords": [],
            "skill_match_percentage": round(skill_score, 1),
            "keyword_match_percentage": round(keyword_score, 1),
            "synonym_matches": {},
            "categorized_skills": categorize_skills_list(combined_resume_skills),
            "jd_experience_requirement": None,
            "jd_education_requirement": None,
            "matching_responsibilities": [],
            "missing_responsibilities": [],
            "required_skills": [],
            "preferred_skills": [],
        }

    # 1. Extract structured JD info, skills and keywords
    jd_info = extract_structured_jd_info(jd_text)
    jd_skills = extract_skills_from_text(jd_text)
    jd_keywords = extract_keywords_from_jd(jd_text)

    # 2. Match skills with synonym recognition
    matching_skills: list[str] = []
    missing_skills: list[str] = []
    synonym_matches: dict[str, str] = {}

    for jd_skill in jd_skills:
        canonical_jd = get_canonical_name(jd_skill)
        norm_jd = normalize_skill(jd_skill)

        is_in_text, matched_alias = check_term_in_text(jd_skill, resume_text_lower)

        if canonical_jd in canonical_resume_skills:
            actual_resume_skill = canonical_resume_skills[canonical_jd]
            if actual_resume_skill not in matching_skills:
                matching_skills.append(actual_resume_skill)
            if actual_resume_skill.lower() != jd_skill.lower():
                synonym_matches[jd_skill] = f"{actual_resume_skill} (matched in resume)"
        elif norm_jd in normalized_resume_skills:
            actual_resume_skill = normalized_resume_skills[norm_jd]
            if actual_resume_skill not in matching_skills:
                matching_skills.append(actual_resume_skill)
            if actual_resume_skill.lower() != jd_skill.lower():
                synonym_matches[jd_skill] = f"{actual_resume_skill} (matched in resume)"
        elif is_in_text:
            matched_display = matched_alias or jd_skill
            if matched_display not in matching_skills:
                matching_skills.append(matched_display)
            if matched_alias and matched_alias.lower() != jd_skill.lower():
                synonym_matches[jd_skill] = f"{matched_alias} (matched in resume text)"
        else:
            if jd_skill not in missing_skills:
                missing_skills.append(jd_skill)

    # 3. Match general keywords
    matching_keywords: list[str] = []
    missing_keywords: list[str] = []

    for kw in jd_keywords:
        is_present, _ = check_term_in_text(kw, resume_text_lower)
        if is_present:
            if kw not in matching_keywords:
                matching_keywords.append(kw)
        else:
            if kw not in missing_keywords:
                missing_keywords.append(kw)

    # 4. Compare Responsibilities
    matching_resp: list[str] = []
    missing_resp: list[str] = []
    for resp in jd_info["responsibilities"]:
        resp_words = [w for w in re.findall(r"\b\w+\b", resp.lower()) if len(w) > 3]
        matches = sum(1 for w in resp_words if w in resume_text_lower)
        if resp_words and (matches / len(resp_words)) >= 0.3:
            matching_resp.append(resp)
        else:
            missing_resp.append(resp)

    # Calculate match percentages
    skill_match_pct = (
        (len(matching_skills) / len(jd_skills) * 100.0) if jd_skills else 100.0
    )
    keyword_match_pct = (
        (len(matching_keywords) / len(jd_keywords) * 100.0) if jd_keywords else 100.0
    )

    return {
        "matching_skills": matching_skills,
        "missing_skills": missing_skills,
        "matching_keywords": matching_keywords,
        "missing_keywords": missing_keywords,
        "jd_skills": jd_skills,
        "jd_keywords": jd_keywords,
        "skill_match_percentage": round(min(skill_match_pct, 100.0), 1),
        "keyword_match_percentage": round(min(keyword_match_pct, 100.0), 1),
        "synonym_matches": synonym_matches,
        "categorized_skills": categorize_skills_list(matching_skills),
        "jd_experience_requirement": jd_info["experience_req"],
        "jd_education_requirement": jd_info["education_req"],
        "matching_responsibilities": matching_resp,
        "missing_responsibilities": missing_resp,
        "required_skills": jd_info["required_skills"],
        "preferred_skills": jd_info["preferred_skills"],
    }
