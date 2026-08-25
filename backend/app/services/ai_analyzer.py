import json
import logging
import re
from typing import Any, TypedDict
import httpx

from app.config import get_ai_config
from app.services.experience_detector import ExperienceClassification
from app.services.job_matcher import MatchResults
from app.services.parser import extract_structured_projects

logger = logging.getLogger(__name__)


class MatchExplanation(TypedDict):
    overview: str
    strongest_match_areas: list[str]
    biggest_gaps: list[str]
    priority_improvements: list[str]


class ProjectEvaluation(TypedDict):
    project_title: str
    relevance_score: str  # "High" | "Medium" | "Low" | "Not Relevant"
    technologies_detected: list[str]
    skills_demonstrated: list[str]
    relevance_explanation: str
    improvement_suggestions: str


class PrioritizedRecommendations(TypedDict):
    high_priority: list[str]
    medium_priority: list[str]
    low_priority: list[str]


class TechnicalSkillAssessment(TypedDict):
    depth_rating: str
    strengths: list[str]
    gaps: list[str]


class ExperienceAssessment(TypedDict):
    quality_rating: str
    feedback: str


class JDAlignment(TypedDict):
    experience_alignment: str
    education_alignment: str
    matching_responsibilities: list[str]
    missing_responsibilities: list[str]


class AIAnalysisResult(TypedDict):
    # Phase 1-3 backward compatibility fields
    role_fit_summary: str
    resume_strengths: list[str]
    recommendations: list[str]
    project_relevance_summary: str
    is_ai_powered: bool

    # Phase 4 enhanced intelligence fields
    provider_used: str  # "gemini" | "openai" | "deterministic"
    match_explanation: MatchExplanation
    resume_weaknesses: list[str]
    technical_skill_assessment: TechnicalSkillAssessment
    experience_assessment: ExperienceAssessment
    project_evaluations: list[ProjectEvaluation]
    prioritized_recommendations: PrioritizedRecommendations
    ats_optimization_tips: list[str]
    jd_alignment: JDAlignment


def clean_json_string(raw: str) -> str:
    """Strip markdown code fence blocks (```json ... ```) from LLM output."""
    trimmed = raw.strip()
    if trimmed.startswith("```"):
        trimmed = re.sub(r"^```(?:json)?\s*", "", trimmed)
        trimmed = re.sub(r"\s*```$", "", trimmed)
    return trimmed.strip()


def generate_fallback_analysis(
    name: str,
    skills: list[str],
    projects: list[str],
    education: list[str],
    certifications: list[str],
    raw_text: str,
    jd_text: str,
    match_results: MatchResults,
    exp_classification: ExperienceClassification,
) -> AIAnalysisResult:
    """Generate high-quality, actionable, role-specific observations and recommendations using deterministic intelligence."""
    matching_skills = match_results.get("matching_skills", [])
    missing_skills = match_results.get("missing_skills", [])
    matching_keywords = match_results.get("matching_keywords", [])
    missing_keywords = match_results.get("missing_keywords", [])
    has_jd = bool(jd_text and jd_text.strip())

    candidate_type = exp_classification["candidate_type"]
    is_fresher = candidate_type == "fresher"

    # 1. Strengths & Weaknesses
    strengths: list[str] = []
    weaknesses: list[str] = []

    if matching_skills:
        top_skills = ", ".join(matching_skills[:4])
        if has_jd:
            strengths.append(f"Strong technical alignment with key job requirements in {top_skills}.")
        else:
            strengths.append(f"Solid technical competencies demonstrated in {top_skills}.")

    if projects:
        strengths.append(f"Practical portfolio demonstrates hands-on implementation across {len(projects)} distinct project(s).")
    else:
        weaknesses.append("No dedicated Projects section found. Adding projects with measurable metrics significantly improves ATS score.")

    if exp_classification["has_virtual_experience"]:
        strengths.append("Demonstrated industry familiarity through virtual job simulation / experiential learning.")
    elif exp_classification["has_internship_experience"]:
        strengths.append("Practical engineering experience gained through professional internship positions.")
    elif exp_classification["has_professional_experience"]:
        strengths.append("Verified commercial track record in software engineering and system development.")

    if certifications:
        cert_names = [c.split("\n", 1)[0].split(" – ", 1)[0].split(" - ", 1)[0].strip() for c in certifications[:2]]
        strengths.append(f"Holds recognized certifications ({', '.join(cert_names)}) reinforcing domain authority.")
    elif is_fresher:
        weaknesses.append("Consider earning domain certifications (e.g. AWS Cloud Practitioner, Python Institute) to strengthen fresher credibility.")

    if education:
        edu_name = education[0].split("\n", 1)[0].strip()
        strengths.append(f"Academic foundation in {edu_name}.")

    if not strengths:
        strengths.append("Clear resume structure with accessible contact and background details.")

    if missing_skills:
        top_missing = ", ".join(missing_skills[:3])
        weaknesses.append(f"Important target role skills are absent from your resume: {top_missing}.")

    if missing_keywords:
        top_missing_kw = ", ".join(missing_keywords[:3])
        weaknesses.append(f"Missing core domain keywords commonly expected by ATS filters: {top_missing_kw}.")

    # Check for measurable metrics in resume text
    has_metrics = bool(re.search(r"\b(\d+%\b|\$\d+|\b\d+\+\s*users\b|\b\d+\s*ms\b|\blatency\b|\bthroughput\b)", raw_text.lower()))
    if not has_metrics:
        weaknesses.append("Project and experience descriptions lack quantifiable achievements (e.g. 'reduced latency by 20%', 'served 500+ requests').")

    # 2. Match Explanation
    if has_jd:
        pct = match_results.get("skill_match_percentage", 50.0)
        if pct >= 75:
            match_overview = (
                f"Your resume is a strong match for this role ({pct}% skill match). You clearly demonstrate "
                f"competencies in {', '.join(matching_skills[:3]) if matching_skills else 'core required areas'}."
                + (f" However, {', '.join(missing_skills[:2])} are specified in the job description and are currently missing." if missing_skills else "")
            )
        elif pct >= 50:
            match_overview = (
                f"Your resume shows moderate alignment with the position ({pct}% skill match). While you possess "
                f"skills in {', '.join(matching_skills[:3]) if matching_skills else 'some core areas'}, key requirements such as "
                f"{', '.join(missing_skills[:3]) if missing_skills else 'required tools'} are missing from your profile."
            )
        else:
            match_overview = (
                f"Significant skill gaps detected ({pct}% skill match). The role emphasizes technologies like "
                f"{', '.join(missing_skills[:4]) if missing_skills else 'required tech stack'} which are not currently highlighted on your resume."
            )
    else:
        match_overview = (
            f"General technical audit completed for {name or 'the candidate'} ({'Fresher / Early Career' if is_fresher else 'Experienced Professional'}). "
            f"Profile demonstrates solid foundation across {len(skills)} identified skills."
        )

    strongest_match_areas = matching_skills[:5] if matching_skills else ["Clean structural layout", "Document readability"]
    if has_jd:
        biggest_gaps = missing_skills[:5] if missing_skills else ["No critical skill gaps detected against this job description."]
        priority_improvements = [
            f"If you have hands-on experience with {s}, incorporate it into your skills and project bullets." for s in missing_skills[:2]
        ] if missing_skills else ["Quantify your project outcomes with measurable business metrics (%, ms, throughput)."]
    else:
        biggest_gaps = [
            "Quantify bullet points with measurable impact metrics (e.g., latency, throughput, scale).",
            "Include active links to public repositories, live demos, or portfolio items.",
        ]
        priority_improvements = [
            "Quantify your project outcomes with measurable engineering metrics (%, ms, users, throughput).",
            "Organize technical proficiencies into structured categories (Languages, Frameworks, Cloud/DevOps).",
        ]

    match_explanation: MatchExplanation = {
        "overview": match_overview,
        "strongest_match_areas": strongest_match_areas,
        "biggest_gaps": biggest_gaps,
        "priority_improvements": priority_improvements,
    }

    # 3. Project-by-Project Evaluation (Capped at top 3 projects)
    parsed_structured_projects = extract_structured_projects(projects, raw_text)
    project_evaluations: list[ProjectEvaluation] = []

    for proj in parsed_structured_projects[:3]:
        title = proj["title"]
        desc = proj["description"]
        techs = proj["technologies"]
        desc_lower = (title + " " + desc).lower()

        # Compute project relevance
        if has_jd:
            jd_skills = match_results.get("jd_skills", [])
            overlap = [s for s in jd_skills if s.lower() in desc_lower]
            if len(overlap) >= 2 or any(s in techs for s in matching_skills):
                relevance = "High"
                rel_explanation = f"Demonstrates direct practical application of target role technologies ({', '.join(overlap[:3]) or ', '.join(techs[:2])})."
            elif len(overlap) == 1 or len(techs) >= 2:
                relevance = "Medium"
                rel_explanation = f"Demonstrates relevant software development practices and tech stack ({', '.join(techs[:2]) if techs else 'programming skills'})."
            else:
                relevance = "Low"
                rel_explanation = "General technical project with limited direct overlap with the specific requirements of this job posting."
        else:
            if len(techs) >= 2 or len(desc) > 50:
                relevance = "High"
                rel_explanation = f"Comprehensive project showcasing full-stack or backend capabilities with {', '.join(techs[:3]) if techs else 'modern tools'}."
            else:
                relevance = "Medium"
                rel_explanation = "Practical coding exercise demonstrating foundational software concepts."

        # Improvement tips
        if not re.search(r"(\d+[%k+]|\bperformance\b|\boptimized\b|\bscaled\b|\btested\b)", desc_lower):
            imp_tip = "Add measurable outcome metrics and mention architectural details (e.g. database indexing, API response time)."
        else:
            imp_tip = "Highlight specific design patterns used and emphasize test coverage or deployment pipelines."

        project_evaluations.append({
            "project_title": title,
            "relevance_score": relevance,
            "technologies_detected": techs if techs else ["Software Development"],
            "skills_demonstrated": [s for s in matching_skills if s.lower() in desc_lower] or techs or ["Problem Solving"],
            "relevance_explanation": rel_explanation,
            "improvement_suggestions": imp_tip,
        })

    if not project_evaluations and projects:
        for p in projects[:3]:
            project_evaluations.append({
                "project_title": p.split("\n", 1)[0].split(" – ", 1)[0][:45],
                "relevance_score": "Medium",
                "technologies_detected": ["Software Development"],
                "skills_demonstrated": ["Practical Implementation"],
                "relevance_explanation": "Demonstrates hands-on engineering problem solving.",
                "improvement_suggestions": "Structure with clear project title, tech stack list, and measurable bullet points.",
            })

    project_evaluations = project_evaluations[:3]

    # 4. Prioritized Recommendations
    high_priority: list[str] = []
    medium_priority: list[str] = []
    low_priority: list[str] = []

    if missing_skills:
        high_priority.append(
            f"Review missing role-critical technologies ({', '.join(missing_skills[:3])}). If you possess practical experience with these, add them to your skills and project descriptions."
        )
    if missing_keywords:
        high_priority.append(
            f"Integrate key domain terminology ({', '.join(missing_keywords[:3])}) naturally into your experience bullet points."
        )
    if not has_metrics:
        high_priority.append(
            "Quantify bullet points with measurable impact (e.g., 'reduced query time by 30%', 'served 200+ concurrent requests')."
        )

    medium_priority.append("Begin every project bullet point with strong action verbs (e.g., Architected, Deployed, Engineered, Streamlined).")
    if len(skills) > 10:
        medium_priority.append("Organize your Skills section into categorized subheadings: Languages, Frameworks, Databases, and Cloud/DevOps.")
    else:
        medium_priority.append("Ensure all technologies mentioned in your projects are also listed in your primary Skills section.")

    low_priority.append("Keep resume formatting clean with standard fonts, standard 1-inch margins, and consistent date formats (MM/YYYY - MM/YYYY).")
    low_priority.append("Ensure your contact header includes active links to your GitHub profile and LinkedIn profile.")

    ats_optimization_tips = [
        "Use standard section headings (e.g. 'Skills', 'Experience', 'Projects', 'Education') so ATS parsers reliably categorize your information.",
        "Avoid multi-column tables, graphics, or text boxes that can confuse automated parsing algorithms.",
        "Save and submit in standard PDF or DOCX format with readable selectable text.",
    ]

    # 5. Technical Skill & Experience Assessment
    tech_assessment: TechnicalSkillAssessment = {
        "depth_rating": "Strong Technical Foundation" if len(skills) >= 6 else "Developing Technical Stack",
        "strengths": matching_skills[:5] if matching_skills else skills[:5],
        "gaps": (missing_skills[:4] if missing_skills else ["No major skill gaps identified for this role."]) if has_jd else [],
    }

    exp_assessment: ExperienceAssessment = {
        "quality_rating": "Experienced Professional" if not is_fresher else "Early Career / Fresher",
        "feedback": exp_classification["explanation"],
    }

    # 6. JD Alignment
    jd_alignment: JDAlignment = {
        "experience_alignment": match_results.get("jd_experience_requirement") or ("Entry level alignment" if is_fresher else "Experienced alignment"),
        "education_alignment": match_results.get("jd_education_requirement") or (education[0] if education else "Educational qualifications detected"),
        "matching_responsibilities": match_results.get("matching_responsibilities", []),
        "missing_responsibilities": match_results.get("missing_responsibilities", []),
    }

    # Combined backward compatible recommendation list
    all_recommendations = high_priority + medium_priority + low_priority

    return {
        "role_fit_summary": match_overview,
        "resume_strengths": strengths,
        "recommendations": all_recommendations,
        "project_relevance_summary": f"Evaluated {len(project_evaluations)} project(s). {'Projects strongly align with role requirements.' if any(p['relevance_score'] == 'High' for p in project_evaluations) else 'Projects demonstrate practical software capability.'}",
        "is_ai_powered": False,
        "provider_used": "deterministic",
        "match_explanation": match_explanation,
        "resume_weaknesses": weaknesses,
        "technical_skill_assessment": tech_assessment,
        "experience_assessment": exp_assessment,
        "project_evaluations": project_evaluations,
        "prioritized_recommendations": {
            "high_priority": high_priority,
            "medium_priority": medium_priority,
            "low_priority": low_priority,
        },
        "ats_optimization_tips": ats_optimization_tips,
        "jd_alignment": jd_alignment,
    }


async def call_gemini_api(api_key: str, model: str, prompt: str) -> dict[str, Any] | None:
    """Call Google Gemini Generative Language REST API."""
    model_name = model or "gemini-3.5-flash"
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent?key={api_key}"
    payload = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {
            "responseMimeType": "application/json",
            "temperature": 0.2,
        },
    }
    async with httpx.AsyncClient(timeout=20.0) as client:
        response = await client.post(url, json=payload)
        if response.status_code != 200:
            logger.warning(f"Gemini API returned status {response.status_code}: {response.text}")
            return None
        data = response.json()
        candidates = data.get("candidates", [])
        if not candidates:
            return None
        text_content = candidates[0]["content"]["parts"][0]["text"]
        clean_text = clean_json_string(text_content)
        return json.loads(clean_text)


async def call_openai_api(api_key: str, model: str, prompt: str) -> dict[str, Any] | None:
    """Call OpenAI Chat Completions REST API."""
    url = "https://api.openai.com/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
    }
    payload = {
        "model": model or "gpt-4o-mini",
        "messages": [
            {
                "role": "system",
                "content": (
                    "You are an expert technical ATS resume advisor and senior engineering hiring manager. "
                    "Analyze candidate resumes against job descriptions rigorously, accurately, and ethically. "
                    "Never hallucinate skills or advise candidates to claim skills they do not have. Respond ONLY in valid JSON."
                ),
            },
            {"role": "user", "content": prompt},
        ],
        "response_format": {"type": "json_object"},
        "temperature": 0.2,
    }
    async with httpx.AsyncClient(timeout=20.0) as client:
        response = await client.post(url, headers=headers, json=payload)
        if response.status_code != 200:
            logger.warning(f"OpenAI API returned status {response.status_code}: {response.text}")
            return None
        data = response.json()
        text_content = data["choices"][0]["message"]["content"]
        clean_text = clean_json_string(text_content)
        return json.loads(clean_text)


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
    """Analyze resume and job description with external LLM (Gemini / OpenAI) or graceful deterministic fallback."""
    ai_config = get_ai_config()
    api_key = ai_config.get("api_key", "").strip()
    provider = ai_config.get("provider", "gemini").lower()
    model = ai_config.get("model", "gemini-3.5-flash").strip()

    # Pre-generate complete fallback baseline
    fallback = generate_fallback_analysis(
        name=name,
        skills=skills,
        projects=projects,
        education=education,
        certifications=certifications,
        raw_text=raw_text,
        jd_text=jd_text,
        match_results=match_results,
        exp_classification=exp_classification,
    )

    if not api_key:
        return fallback

    has_jd = bool(jd_text and jd_text.strip())

    if has_jd:
        prompt = f"""
You are a senior ATS Technical Recruiter. Perform an in-depth, structured evaluation of this candidate's resume against the Target Job Description.

Candidate Name: {name or 'Candidate'}
Candidate Level: {exp_classification['candidate_type']}
Parsed Skills: {json.dumps(skills)}
Parsed Projects: {json.dumps(projects)}
Parsed Experience: {json.dumps(experience)}
Education: {json.dumps(education)}
Certifications: {json.dumps(certifications)}
Matching Skills: {json.dumps(match_results.get('matching_skills', []))}
Missing Skills: {json.dumps(match_results.get('missing_skills', []))}

Target Job Description:
\"\"\"{jd_text}\"\"\"

Provide your response strictly in the following JSON schema:
{{
  "match_explanation": {{
    "overview": "Detailed 2-3 sentence explanation of WHY the resume matches or does not match this specific role.",
    "strongest_match_areas": ["3-5 concrete matching competencies"],
    "biggest_gaps": ["2-4 critical missing skills or requirements"],
    "priority_improvements": ["2-3 top priority actions for the candidate"]
  }},
  "resume_strengths": ["3-5 concrete, non-generic strengths based directly on the resume"],
  "resume_weaknesses": ["2-4 specific weaknesses, missing technologies, or lack of quantifiable achievements"],
  "technical_skill_assessment": {{
    "depth_rating": "Rating phrase like 'Strong Full-Stack Stack with Modern Web Ecosystem'",
    "strengths": ["list of technical areas candidate is strong in"],
    "gaps": ["list of technical skills missing for this role"]
  }},
  "experience_assessment": {{
    "quality_rating": "Assessment of candidate work/internship/project history",
    "feedback": "1-2 sentences of career alignment feedback"
  }},
  "project_evaluations": [
    {{
      "project_title": "Project name (evaluate at most top 3 projects from Parsed Projects)",
      "relevance_score": "High" or "Medium" or "Low" or "Not Relevant",
      "technologies_detected": ["Tech 1", "Tech 2"],
      "skills_demonstrated": ["Skill 1", "Skill 2"],
      "relevance_explanation": "Why this project is or is not relevant to the JD",
      "improvement_suggestions": "How the candidate can improve this project's bullet points and metrics"
    }}
  ],
  "prioritized_recommendations": {{
    "high_priority": ["2-4 critical improvements (e.g. missing required JD tech, missing metrics)"],
    "medium_priority": ["2-3 wording, bullet phrasing, or tech ordering improvements"],
    "low_priority": ["1-2 formatting or styling polish recommendations"]
  }},
  "ats_optimization_tips": ["2-3 actionable formatting or ATS structure tips"],
  "jd_alignment": {{
    "experience_alignment": "Explanation of how candidate experience compares to JD requirements",
    "education_alignment": "Explanation of education alignment",
    "matching_responsibilities": ["1-3 responsibilities in JD matched by resume"],
    "missing_responsibilities": ["1-3 responsibilities in JD not demonstrated by resume"]
  }}
}}
"""
    else:
        prompt = f"""
You are a senior ATS Technical Recruiter. Perform an in-depth, structured evaluation of this candidate's resume for general technical strength and ATS presentation (no specific Job Description provided).

Candidate Name: {name or 'Candidate'}
Candidate Level: {exp_classification['candidate_type']}
Parsed Skills: {json.dumps(skills)}
Parsed Projects: {json.dumps(projects)}
Parsed Experience: {json.dumps(experience)}
Education: {json.dumps(education)}
Certifications: {json.dumps(certifications)}

Provide your response strictly in the following JSON schema:
{{
  "match_explanation": {{
    "overview": "2-3 sentence overview of candidate profile strengths, technical breadth, and career readiness.",
    "strongest_match_areas": ["3-5 prominent technical strengths"],
    "biggest_gaps": ["2-3 general profile areas to enhance"],
    "priority_improvements": ["2-3 top priority actions to boost resume impact"]
  }},
  "resume_strengths": ["3-5 concrete strengths based on the resume"],
  "resume_weaknesses": ["2-4 specific areas to improve"],
  "technical_skill_assessment": {{
    "depth_rating": "Technical breadth rating",
    "strengths": ["strongest skills"],
    "gaps": ["recommended technologies to learn"]
  }},
  "experience_assessment": {{
    "quality_rating": "Assessment of experience/project depth",
    "feedback": "1-2 sentences of feedback"
  }},
  "project_evaluations": [
    {{
      "project_title": "Project name (evaluate at most top 3 projects from Parsed Projects)",
      "relevance_score": "High" or "Medium" or "Low",
      "technologies_detected": ["Tech 1", "Tech 2"],
      "skills_demonstrated": ["Skill 1", "Skill 2"],
      "relevance_explanation": "Evaluation of project scope",
      "improvement_suggestions": "Suggestions to quantify impact"
    }}
  ],
  "prioritized_recommendations": {{
    "high_priority": ["2-3 critical improvements for ATS impact"],
    "medium_priority": ["2-3 phrasing and structure improvements"],
    "low_priority": ["1-2 formatting tips"]
  }},
  "ats_optimization_tips": ["2-3 actionable ATS structure tips"],
  "jd_alignment": {{
    "experience_alignment": "Candidate level evaluation",
    "education_alignment": "Education credentials evaluation",
    "matching_responsibilities": [],
    "missing_responsibilities": []
  }}
}}
"""

    try:
        ai_data: dict[str, Any] | None = None
        if provider == "openai":
            ai_data = await call_openai_api(api_key, model, prompt)
        else:
            ai_data = await call_gemini_api(api_key, model, prompt)

        if ai_data and isinstance(ai_data, dict):
            match_exp_raw = ai_data.get("match_explanation", {})
            match_explanation: MatchExplanation = {
                "overview": str(match_exp_raw.get("overview", fallback["match_explanation"]["overview"])),
                "strongest_match_areas": list(match_exp_raw.get("strongest_match_areas", fallback["match_explanation"]["strongest_match_areas"])),
                "biggest_gaps": list(match_exp_raw.get("biggest_gaps", fallback["match_explanation"]["biggest_gaps"])),
                "priority_improvements": list(match_exp_raw.get("priority_improvements", fallback["match_explanation"]["priority_improvements"])),
            }

            p_evals_raw = ai_data.get("project_evaluations", [])
            project_evaluations: list[ProjectEvaluation] = []
            if isinstance(p_evals_raw, list) and len(p_evals_raw) > 0:
                for p in p_evals_raw[:3]:
                    if isinstance(p, dict):
                        project_evaluations.append({
                            "project_title": str(p.get("project_title", "Project")),
                            "relevance_score": str(p.get("relevance_score", "Medium")),
                            "technologies_detected": list(p.get("technologies_detected", [])),
                            "skills_demonstrated": list(p.get("skills_demonstrated", [])),
                            "relevance_explanation": str(p.get("relevance_explanation", "")),
                            "improvement_suggestions": str(p.get("improvement_suggestions", "")),
                        })
            if not project_evaluations:
                project_evaluations = fallback["project_evaluations"][:3]
            else:
                project_evaluations = project_evaluations[:3]


            recs_raw = ai_data.get("prioritized_recommendations", {})
            prioritized_recs: PrioritizedRecommendations = {
                "high_priority": list(recs_raw.get("high_priority", fallback["prioritized_recommendations"]["high_priority"])),
                "medium_priority": list(recs_raw.get("medium_priority", fallback["prioritized_recommendations"]["medium_priority"])),
                "low_priority": list(recs_raw.get("low_priority", fallback["prioritized_recommendations"]["low_priority"])),
            }

            tech_raw = ai_data.get("technical_skill_assessment", {})
            tech_assessment: TechnicalSkillAssessment = {
                "depth_rating": str(tech_raw.get("depth_rating", fallback["technical_skill_assessment"]["depth_rating"])),
                "strengths": list(tech_raw.get("strengths", fallback["technical_skill_assessment"]["strengths"])),
                "gaps": list(tech_raw.get("gaps", fallback["technical_skill_assessment"]["gaps"])),
            }

            exp_raw = ai_data.get("experience_assessment", {})
            exp_assessment: ExperienceAssessment = {
                "quality_rating": str(exp_raw.get("quality_rating", fallback["experience_assessment"]["quality_rating"])),
                "feedback": str(exp_raw.get("feedback", fallback["experience_assessment"]["feedback"])),
            }

            jd_align_raw = ai_data.get("jd_alignment", {})
            jd_alignment: JDAlignment = {
                "experience_alignment": str(jd_align_raw.get("experience_alignment", fallback["jd_alignment"]["experience_alignment"])),
                "education_alignment": str(jd_align_raw.get("education_alignment", fallback["jd_alignment"]["education_alignment"])),
                "matching_responsibilities": list(jd_align_raw.get("matching_responsibilities", fallback["jd_alignment"]["matching_responsibilities"])),
                "missing_responsibilities": list(jd_align_raw.get("missing_responsibilities", fallback["jd_alignment"]["missing_responsibilities"])),
            }

            strengths_list = list(ai_data.get("resume_strengths", fallback["resume_strengths"]))
            weaknesses_list = list(ai_data.get("resume_weaknesses", fallback["resume_weaknesses"]))
            ats_tips_list = list(ai_data.get("ats_optimization_tips", fallback["ats_optimization_tips"]))

            flat_recs = prioritized_recs["high_priority"] + prioritized_recs["medium_priority"] + prioritized_recs["low_priority"]

            return {
                "role_fit_summary": match_explanation["overview"],
                "resume_strengths": strengths_list,
                "recommendations": flat_recs if flat_recs else fallback["recommendations"],
                "project_relevance_summary": f"Evaluated {len(project_evaluations)} project(s).",
                "is_ai_powered": True,
                "provider_used": provider,
                "match_explanation": match_explanation,
                "resume_weaknesses": weaknesses_list,
                "technical_skill_assessment": tech_assessment,
                "experience_assessment": exp_assessment,
                "project_evaluations": project_evaluations,
                "prioritized_recommendations": prioritized_recs,
                "ats_optimization_tips": ats_tips_list,
                "jd_alignment": jd_alignment,
            }
    except Exception as exc:
        logger.warning(f"AI API invocation failed ({exc}), gracefully using deterministic fallback.")

    return fallback
