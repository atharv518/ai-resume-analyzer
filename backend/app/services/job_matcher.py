import re
from typing import TypedDict
from app.services.parser import COMMON_SKILL_KEYWORDS


class MatchResults(TypedDict):
    matching_skills: list[str]
    missing_skills: list[str]
    matching_keywords: list[str]
    missing_keywords: list[str]
    jd_skills: list[str]
    jd_keywords: list[str]
    skill_match_percentage: float
    keyword_match_percentage: float


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


def normalize_skill(skill: str) -> str:
    """Normalize skill string for case-insensitive and format-insensitive comparison."""
    cleaned = skill.strip().lower()
    cleaned = re.sub(r"[\.js|css]+$", "", cleaned)
    cleaned = re.sub(r"[\s\-_]+", "", cleaned)
    return cleaned


def extract_skills_from_text(text: str) -> list[str]:
    """Extract identified technical and soft skills from any arbitrary text."""
    found_skills: list[str] = []
    seen_normalized: set[str] = set()
    text_lower = text.lower()

    # Combine known skill vocabulary
    all_vocab = list(dict.fromkeys(COMMON_SKILL_KEYWORDS + DOMAIN_KEYWORDS))

    for term in all_vocab:
        pattern = r"(?<![\w\-])" + re.escape(term.lower()) + r"(?![\w\-])"
        if re.search(pattern, text_lower):
            norm = normalize_skill(term)
            if norm not in seen_normalized:
                seen_normalized.add(norm)
                found_skills.append(term)

    return found_skills


def extract_keywords_from_jd(jd_text: str) -> list[str]:
    """Extract key domain keywords and phrases from job description."""
    keywords = extract_skills_from_text(jd_text)

    additional_terms = [
        "Distributed Systems", "Backend Architecture", "Frontend Architecture",
        "API Integration", "Automated Testing", "Authentication", "Authorization",
        "OAuth", "JWT", "Data Modeling", "Web Security", "Monitoring", "Logging"
    ]
    jd_lower = jd_text.lower()
    for term in additional_terms:
        if re.search(r"\b" + re.escape(term.lower()) + r"\b", jd_lower):
            if term not in keywords:
                keywords.append(term)

    return keywords


def compare_resume_with_jd(
    resume_text: str,
    resume_skills: list[str],
    jd_text: str
) -> MatchResults:
    """Compare extracted resume content and skills against the job description or evaluate resume richness."""
    resume_skills_from_text = extract_skills_from_text(resume_text)
    combined_resume_skills = list(dict.fromkeys(resume_skills + resume_skills_from_text))
    resume_skills_map = {normalize_skill(s): s for s in combined_resume_skills}
    resume_text_lower = resume_text.lower()

    # If no Job Description was provided, evaluate resume's internal skill and keyword richness
    if not jd_text or not jd_text.strip():
        resume_keywords = [
            term for term in DOMAIN_KEYWORDS
            if re.search(r"(?<![\w\-])" + re.escape(term.lower()) + r"(?![\w\-])", resume_text_lower)
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
        }

    # 1. Extract JD skills and keywords
    jd_skills = extract_skills_from_text(jd_text)
    jd_keywords = extract_keywords_from_jd(jd_text)

    # 2. Match skills
    matching_skills: list[str] = []
    missing_skills: list[str] = []

    for jd_skill in jd_skills:
        norm = normalize_skill(jd_skill)
        pattern = r"(?<![\w\-])" + re.escape(jd_skill.lower()) + r"(?![\w\-])"
        if norm in resume_skills_map or re.search(pattern, resume_text_lower):
            canonical = resume_skills_map.get(norm, jd_skill)
            if canonical not in matching_skills:
                matching_skills.append(canonical)
        else:
            if jd_skill not in missing_skills:
                missing_skills.append(jd_skill)

    # 3. Match general keywords
    matching_keywords: list[str] = []
    missing_keywords: list[str] = []

    for kw in jd_keywords:
        pattern = r"(?<![\w\-])" + re.escape(kw.lower()) + r"(?![\w\-])"
        if re.search(pattern, resume_text_lower):
            if kw not in matching_keywords:
                matching_keywords.append(kw)
        else:
            if kw not in missing_keywords:
                missing_keywords.append(kw)

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
    }
