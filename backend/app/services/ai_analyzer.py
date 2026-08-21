import json
import logging
from typing import Any, TypedDict
import httpx
from app.config import get_ai_config
from app.services.experience_detector import ExperienceClassification
from app.services.job_matcher import MatchResults

logger = logging.getLogger(__name__)


class AIAnalysisResult(TypedDict):
    role_fit_summary: str
    resume_strengths: list[str]
    recommendations: list[str]
    project_relevance_summary: str
    is_ai_powered: bool


def generate_fallback_analysis(
    name: str,
    skills: list[str],
    projects: list[str],
    education: list[str],
    certifications: list[str],
    match_results: MatchResults,
    exp_classification: ExperienceClassification,
) -> AIAnalysisResult:
    """Generate high-quality, actionable observations and recommendations using deterministic rules."""
    strengths: list[str] = []
    recommendations: list[str] = []

    matching_skills = match_results["matching_skills"]
    missing_skills = match_results["missing_skills"]
    matching_keywords = match_results["matching_keywords"]
    missing_keywords = match_results["missing_keywords"]
    has_jd_comparison = bool(match_results.get("jd_skills") or match_results.get("jd_keywords"))

    # 1. Strengths Generation
    if matching_skills:
        top_skills = ", ".join(matching_skills[:4])
        if has_jd_comparison:
            strengths.append(f"Strong technical alignment with key role requirements in {top_skills}.")
        else:
            strengths.append(f"Solid technical competencies demonstrated in {top_skills}.")

    if projects:
        strengths.append(f"Practical portfolio demonstrates hands-on implementation across {len(projects)} distinct project(s).")

    if exp_classification["has_virtual_experience"]:
        strengths.append("Demonstrated industry familiarity through virtual job simulation / experiential learning.")
    elif exp_classification["has_internship_experience"]:
        strengths.append("Practical experience gained through internship positions.")
    elif exp_classification["has_professional_experience"]:
        strengths.append("Verified commercial track record in software engineering and system development.")

    if certifications:
        strengths.append(f"Holds valuable certifications ({', '.join(certifications[:2])}) that reinforce domain expertise.")

    if education:
        strengths.append("Solid educational foundation supporting technical problem-solving capabilities.")

    if not strengths:
        strengths.append("Clear resume structure with accessible contact and background details.")

    # 2. Actionable Recommendations Generation
    if missing_skills:
        top_missing = ", ".join(missing_skills[:3])
        recommendations.append(
            f"Review missing technologies mentioned in the job description ({top_missing}). If you have experience with these, add them to your skills and project descriptions."
        )

    if missing_keywords:
        top_missing_kw = ", ".join(missing_keywords[:3])
        recommendations.append(
            f"Incorporate relevant domain keywords ({top_missing_kw}) naturally into your experience bullet points where truthful."
        )

    if not has_jd_comparison:
        recommendations.append(
            "Paste a target Job Description to run role-specific ATS keyword gap detection and calculate tailored alignment scores."
        )

    recommendations.append(
        "Quantify project outcomes with measurable metrics (e.g., 'improved API latency by 25%' or 'served 100+ concurrent requests')."
    )

    if exp_classification["candidate_type"] == "fresher" and not certifications:
        recommendations.append(
            "Consider adding relevant certifications or live deployment links (GitHub, live demos) to boost fresher credibility."
        )

    # 3. Summaries
    cand_label = "fresher candidate" if exp_classification["candidate_type"] == "fresher" else "experienced professional"
    if has_jd_comparison:
        role_fit_summary = (
            f"The candidate is evaluated as a {cand_label} matching {match_results['skill_match_percentage']}% of required skills. "
            f"{'Key strengths include ' + ', '.join(matching_skills[:3]) + '.' if matching_skills else 'Recommended to align skills closer to job requirements.'}"
        )
    else:
        role_fit_summary = (
            f"Comprehensive profile audit completed for {name or 'the candidate'} ({cand_label}). "
            f"{'Core strengths identified in ' + ', '.join(matching_skills[:3]) + '.' if matching_skills else 'Profile contains well-structured technical sections.'}"
        )

    proj_summary = (
        f"Analyzed {len(projects)} project(s). Projects demonstrate practical coding capability."
        if projects else "No distinct projects section detected; recommend adding a dedicated Projects section."
    )

    return {
        "role_fit_summary": role_fit_summary,
        "resume_strengths": strengths,
        "recommendations": recommendations,
        "project_relevance_summary": proj_summary,
        "is_ai_powered": False,
    }


async def call_gemini_api(
    api_key: str,
    model: str,
    prompt: str
) -> dict[str, Any] | None:
    """Call Google Gemini Generative Language REST API."""
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}"
    payload = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {
            "responseMimeType": "application/json",
            "temperature": 0.2,
        }
    }
    async with httpx.AsyncClient(timeout=15.0) as client:
        response = await client.post(url, json=payload)
        if response.status_code != 200:
            logger.warning(f"Gemini API returned status {response.status_code}")
            return None
        data = response.json()
        text_content = data["candidates"][0]["content"]["parts"][0]["text"]
        return json.loads(text_content)


async def call_openai_api(
    api_key: str,
    model: str,
    prompt: str
) -> dict[str, Any] | None:
    """Call OpenAI Chat Completions REST API."""
    url = "https://api.openai.com/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }
    payload = {
        "model": model or "gpt-4o-mini",
        "messages": [
            {"role": "system", "content": "You are an expert ATS (Applicant Tracking System) career advisor and technical recruiter. Respond ONLY in valid JSON."},
            {"role": "user", "content": prompt}
        ],
        "response_format": {"type": "json_object"},
        "temperature": 0.2,
    }
    async with httpx.AsyncClient(timeout=15.0) as client:
        response = await client.post(url, headers=headers, json=payload)
        if response.status_code != 200:
            logger.warning(f"OpenAI API returned status {response.status_code}")
            return None
        data = response.json()
        text_content = data["choices"][0]["message"]["content"]
        return json.loads(text_content)


async def analyze_with_ai(
    name: str,
    skills: list[str],
    education: list[str],
    experience: list[str],
    projects: list[str],
    certifications: list[str],
    raw_text: str,
    jd_text: str,
    match_results: MatchResults,
    exp_classification: ExperienceClassification,
) -> AIAnalysisResult:
    """Analyze resume and job description with external LLM or deterministic fallback."""
    ai_config = get_ai_config()
    api_key = ai_config["api_key"]
    provider = ai_config["provider"]
    model = ai_config["model"]

    # Fallback baseline
    fallback = generate_fallback_analysis(
        name, skills, projects, education, certifications, match_results, exp_classification
    )

    if not api_key:
        return fallback

    if jd_text and jd_text.strip():
        prompt = f"""
Analyze this candidate resume against the provided Job Description.

Candidate Name: {name}
Candidate Type: {exp_classification['candidate_type']}
Parsed Skills: {json.dumps(skills)}
Parsed Projects: {json.dumps(projects)}
Parsed Experience: {json.dumps(experience)}
Matching Skills: {json.dumps(match_results['matching_skills'])}
Missing Skills: {json.dumps(match_results['missing_skills'])}

Job Description:
\"\"\"{jd_text}\"\"\"

Provide your analysis strictly in this JSON format:
{{
  "role_fit_summary": "1-2 sentence overview of candidate match",
  "resume_strengths": ["3-5 concrete positive strengths about skill alignment, projects, or background"],
  "recommendations": ["3-5 constructive, actionable recommendations. Do NOT give generic motivational text. Encourage adding skills only if the candidate genuinely possesses them."],
  "project_relevance_summary": "1 sentence on project relevance to this specific role"
}}
"""
    else:
        prompt = f"""
Analyze this candidate resume for general structural strength, technical depth, and presentation clarity (no job description provided).

Candidate Name: {name}
Candidate Type: {exp_classification['candidate_type']}
Parsed Skills: {json.dumps(skills)}
Parsed Projects: {json.dumps(projects)}
Parsed Experience: {json.dumps(experience)}
Education: {json.dumps(education)}

Provide your analysis strictly in this JSON format:
{{
  "role_fit_summary": "1-2 sentence overview of candidate profile strengths",
  "resume_strengths": ["3-5 concrete positive strengths about skills, projects, education, or background"],
  "recommendations": ["3-5 constructive, actionable recommendations for improving ATS compatibility and resume impact."],
  "project_relevance_summary": "1 sentence summarizing project scope and effectiveness"
}}
"""

    try:
        ai_data: dict[str, Any] | None = None
        if provider == "openai":
            ai_data = await call_openai_api(api_key, model, prompt)
        else:
            ai_data = await call_gemini_api(api_key, model, prompt)

        if ai_data and isinstance(ai_data, dict):
            return {
                "role_fit_summary": str(ai_data.get("role_fit_summary", fallback["role_fit_summary"])),
                "resume_strengths": list(ai_data.get("resume_strengths", fallback["resume_strengths"])),
                "recommendations": list(ai_data.get("recommendations", fallback["recommendations"])),
                "project_relevance_summary": str(ai_data.get("project_relevance_summary", fallback["project_relevance_summary"])),
                "is_ai_powered": True,
            }
    except Exception as exc:
        logger.warning(f"AI API invocation failed ({exc}), gracefully using deterministic fallback.")

    return fallback
