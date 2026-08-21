from typing import TypedDict
from app.services.experience_detector import ExperienceClassification
from app.services.job_matcher import MatchResults


class ScoreBreakdown(TypedDict):
    skills_score: int
    keyword_score: int
    projects_score: int
    experience_score: int | None
    education_score: int
    structure_score: int


class ATSScoreResult(TypedDict):
    overall_score: int
    rating: str  # "Excellent Match", "Strong Match", "Moderate Match", "Needs Improvement"
    breakdown: ScoreBreakdown
    weights_used: dict[str, float]
    summary_feedback: str


def calculate_structure_score(
    name: str,
    email: str,
    phone: str,
    skills: list[str],
    education: list[str],
    projects: list[str],
    experience: list[str],
    raw_text: str
) -> int:
    """Evaluate formatting quality, contact completeness, and structural balance."""
    score = 0

    # Contact information presence (up to 30 pts)
    if name and len(name.split()) >= 2:
        score += 10
    if email:
        score += 10
    if phone:
        score += 10

    # Section organization (up to 40 pts)
    if skills:
        score += 15
    if education:
        score += 15
    if projects or experience:
        score += 10

    # Content length & verb density (up to 30 pts)
    word_count = len(raw_text.split())
    if 150 <= word_count <= 1200:
        score += 20
    elif word_count > 50:
        score += 10

    action_verbs = ["developed", "built", "implemented", "designed", "created", "led", "managed", "deployed", "optimized"]
    found_verbs = sum(1 for verb in action_verbs if verb in raw_text.lower())
    if found_verbs >= 3:
        score += 10
    elif found_verbs >= 1:
        score += 5

    return min(score, 100)


def calculate_projects_score(projects: list[str], jd_text: str, raw_text: str) -> int:
    """Evaluate quality and relevance of candidate projects."""
    if not projects:
        # If no explicit projects section, check if projects are in text
        if "project" in raw_text.lower():
            return 45
        return 20

    base_score = min(len(projects) * 25, 60)

    # Check for tech stack & measurable metrics in projects
    proj_text = " ".join(projects).lower()
    metrics_count = sum(1 for char in ["%", "$", "+", "k", "reduced", "improved", "increased"] if char in proj_text)
    metric_bonus = min(metrics_count * 10, 20)

    # Check if project words match JD or general tech concepts
    if jd_text and jd_text.strip():
        jd_words = set(jd_text.lower().split())
        proj_words = set(proj_text.split())
        overlap = len(jd_words.intersection(proj_words))
        relevance_bonus = min(overlap * 2, 20)
    else:
        tech_terms = ["api", "full-stack", "database", "backend", "frontend", "cloud", "service", "model", "pipeline"]
        tech_count = sum(1 for t in tech_terms if t in proj_text)
        relevance_bonus = min(tech_count * 4, 20)

    return min(base_score + metric_bonus + relevance_bonus, 100)


def calculate_education_score(education: list[str], certifications: list[str]) -> int:
    """Evaluate educational qualifications and certifications."""
    score = 0
    edu_text = " ".join(education).lower()

    if any(deg in edu_text for deg in ["master", "m.s.", "m.tech", "phd", "mba"]):
        score += 75
    elif any(deg in edu_text for deg in ["bachelor", "b.s.", "b.tech", "b.e.", "degree", "university", "college"]):
        score += 65
    elif education:
        score += 50
    else:
        score += 25

    # Certifications bonus (up to 25 pts)
    if certifications:
        score += min(len(certifications) * 15, 25)

    return min(score, 100)


def calculate_experience_score(
    exp_classification: ExperienceClassification,
    match_results: MatchResults,
    jd_text: str
) -> int:
    """Evaluate professional experience relevance against the job description or industry baseline."""
    if not exp_classification["has_professional_experience"] and not exp_classification["has_internship_experience"]:
        return 0

    score = 50  # baseline for verified experience

    prof_items = exp_classification["professional_items"]
    intern_items = exp_classification["internship_items"]

    if prof_items:
        score += min(len(prof_items) * 15, 30)
    elif intern_items:
        score += min(len(intern_items) * 10, 20)

    # Keyword overlap in experience lines
    exp_combined = " ".join(prof_items + intern_items).lower()
    if jd_text and jd_text.strip():
        for skill in match_results["matching_skills"]:
            if skill.lower() in exp_combined:
                score += 4
    else:
        action_verbs = ["developed", "built", "designed", "led", "managed", "deployed", "scaled", "architected"]
        verb_count = sum(1 for verb in action_verbs if verb in exp_combined)
        score += min(verb_count * 3, 20)

    return min(score, 100)


def calculate_ats_score(
    name: str,
    email: str,
    phone: str,
    skills: list[str],
    education: list[str],
    projects: list[str],
    experience: list[str],
    certifications: list[str],
    raw_text: str,
    jd_text: str,
    match_results: MatchResults,
    exp_classification: ExperienceClassification,
) -> ATSScoreResult:
    """Compute deterministic and transparent ATS score between 0 and 100 with adaptive weighting."""
    # 1. Compute Individual Component Scores (0 - 100 each)
    skills_score = int(round(match_results["skill_match_percentage"]))
    keyword_score = int(round(match_results["keyword_match_percentage"]))
    projects_score = calculate_projects_score(projects, jd_text, raw_text)
    education_score = calculate_education_score(education, certifications)
    structure_score = calculate_structure_score(
        name, email, phone, skills, education, projects, experience, raw_text
    )

    candidate_type = exp_classification["candidate_type"]
    is_experienced = candidate_type == "experienced" and exp_classification["has_professional_experience"]

    if is_experienced:
        exp_score = calculate_experience_score(exp_classification, match_results, jd_text)
        weights = {
            "skills": 0.25,
            "keywords": 0.10,
            "experience": 0.30,
            "projects": 0.10,
            "education": 0.10,
            "structure": 0.15,
        }
        raw_total = (
            skills_score * weights["skills"]
            + keyword_score * weights["keywords"]
            + exp_score * weights["experience"]
            + projects_score * weights["projects"]
            + education_score * weights["education"]
            + structure_score * weights["structure"]
        )
        experience_score_val = exp_score
    else:
        # Fresher / Early Career weights: NO penalty for lack of professional work experience
        weights = {
            "skills": 0.30,
            "keywords": 0.15,
            "projects": 0.25,
            "education": 0.15,
            "structure": 0.15,
        }
        raw_total = (
            skills_score * weights["skills"]
            + keyword_score * weights["keywords"]
            + projects_score * weights["projects"]
            + education_score * weights["education"]
            + structure_score * weights["structure"]
        )
        experience_score_val = None

    overall_score = int(round(max(0.0, min(100.0, raw_total))))

    # Qualitative Rating
    has_jd = bool(jd_text and jd_text.strip())
    if overall_score >= 85:
        rating = "Excellent Match" if has_jd else "Excellent Profile"
        summary_feedback = (
            "Your profile shows outstanding alignment with the target role and key technical requirements."
            if has_jd
            else "Your profile demonstrates outstanding technical depth, strong project evidence, and clean structure."
        )
    elif overall_score >= 70:
        rating = "Strong Match" if has_jd else "Strong Profile"
        summary_feedback = (
            "Your resume demonstrates solid competence and meets most core requirements of the job."
            if has_jd
            else "Your resume demonstrates solid competence and well-structured technical sections. Add a target job description to evaluate specific role fit."
        )
    elif overall_score >= 50:
        rating = "Moderate Match" if has_jd else "Moderate Profile"
        summary_feedback = (
            "Good foundation, but targeted improvements in matching skills and keywords will improve your ATS ranking."
            if has_jd
            else "Good foundation. Consider expanding on project details and quantifiable outcomes to enhance your resume impact."
        )
    else:
        rating = "Needs Improvement"
        summary_feedback = (
            "Significant skill and keyword gaps detected compared to the job description. Follow the recommendations below."
            if has_jd
            else "Resume structure and keyword density can be improved. Follow the recommendations below."
        )

    return {
        "overall_score": overall_score,
        "rating": rating,
        "breakdown": {
            "skills_score": skills_score,
            "keyword_score": keyword_score,
            "projects_score": projects_score,
            "experience_score": experience_score_val,
            "education_score": education_score,
            "structure_score": structure_score,
        },
        "weights_used": weights,
        "summary_feedback": summary_feedback,
    }
