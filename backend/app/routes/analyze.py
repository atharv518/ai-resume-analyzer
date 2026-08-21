from typing import Annotated, Any
from fastapi import APIRouter, File, Form, HTTPException, UploadFile, status
from pydantic import BaseModel, Field

from app.config import FeatureFlags, get_feature_flags
from app.services.ai_analyzer import analyze_with_ai
from app.services.ats_scorer import calculate_ats_score
from app.services.experience_detector import classify_experience_text
from app.services.extractor import extract_resume_text
from app.services.job_matcher import compare_resume_with_jd
from app.services.parser import parse_resume
from app.utils.file_validation import validate_resume_file


router = APIRouter()


class ParsedResume(BaseModel):
    name: str = ""
    email: str = ""
    phone: str = ""
    skills: list[str] = Field(default_factory=list)
    education: list[str] = Field(default_factory=list)
    experience: list[str] = Field(default_factory=list)
    projects: list[str] = Field(default_factory=list)
    certifications: list[str] = Field(default_factory=list)


class ScoreBreakdown(BaseModel):
    skills_score: int
    keyword_score: int
    projects_score: int
    experience_score: int | None = None
    education_score: int
    structure_score: int


class ATSScore(BaseModel):
    overall_score: int
    rating: str
    breakdown: ScoreBreakdown
    summary_feedback: str


class SkillComparison(BaseModel):
    matching_skills: list[str] = Field(default_factory=list)
    missing_skills: list[str] = Field(default_factory=list)
    matching_keywords: list[str] = Field(default_factory=list)
    missing_keywords: list[str] = Field(default_factory=list)
    skill_match_percentage: float
    keyword_match_percentage: float


class ExperienceAnalysis(BaseModel):
    candidate_type: str
    has_professional_experience: bool
    has_internship_experience: bool
    has_virtual_experience: bool
    include_experience_section: bool
    professional_items: list[str] = Field(default_factory=list)
    internship_items: list[str] = Field(default_factory=list)
    virtual_simulation_items: list[str] = Field(default_factory=list)
    explanation: str


class AIInsights(BaseModel):
    role_fit_summary: str
    resume_strengths: list[str] = Field(default_factory=list)
    recommendations: list[str] = Field(default_factory=list)
    project_relevance_summary: str
    is_ai_powered: bool = False


class AnalyzeResponse(BaseModel):
    success: bool
    message: str
    filename: str
    job_description_provided: bool
    feature_flags: FeatureFlags
    parsed_resume: ParsedResume
    ats_score: ATSScore | None = None
    skill_comparison: SkillComparison | None = None
    experience_analysis: ExperienceAnalysis | None = None
    ai_insights: AIInsights | None = None
    extracted_text: str


@router.post("/analyze", response_model=AnalyzeResponse)
async def analyze_resume(
    resume: Annotated[UploadFile | None, File()] = None,
    job_description: Annotated[str | None, Form()] = None,
) -> AnalyzeResponse:
    """Receive, extract, parse, compare against Job Description, detect experience, and score resume."""
    # 1. Validation: Resume File
    if resume is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Please select a resume file.",
        )

    # 2. Job Description (Optional for general resume analysis)
    clean_jd = (job_description or "").strip()
    has_jd = bool(clean_jd and len(clean_jd) >= 10)

    try:
        filename, extension, file_bytes = await validate_resume_file(resume)
    finally:
        await resume.close()

    # 3. Extract text from PDF or DOCX
    extracted_text = extract_resume_text(extension, file_bytes)

    # 4. Parse basic fields and sections
    parsed_data = parse_resume(extracted_text)

    # 5. Compare resume with Job Description (Skills & Keywords)
    match_results = compare_resume_with_jd(
        resume_text=extracted_text,
        resume_skills=parsed_data["skills"],
        jd_text=clean_jd,
    )

    # 6. Classify Experience & Candidate Type
    exp_classification = classify_experience_text(
        experience_lines=parsed_data["experience"],
        projects_lines=parsed_data["projects"],
        full_text=extracted_text,
    )

    # 7. Compute deterministic ATS Score
    ats_score_result = calculate_ats_score(
        name=parsed_data["name"],
        email=parsed_data["email"],
        phone=parsed_data["phone"],
        skills=parsed_data["skills"],
        education=parsed_data["education"],
        projects=parsed_data["projects"],
        experience=parsed_data["experience"],
        certifications=parsed_data["certifications"],
        raw_text=extracted_text,
        jd_text=clean_jd,
        match_results=match_results,
        exp_classification=exp_classification,
    )

    # 8. AI Insights & Actionable Recommendations
    ai_insights_result = await analyze_with_ai(
        name=parsed_data["name"],
        skills=parsed_data["skills"],
        education=parsed_data["education"],
        experience=parsed_data["experience"],
        projects=parsed_data["projects"],
        certifications=parsed_data["certifications"],
        raw_text=extracted_text,
        jd_text=clean_jd,
        match_results=match_results,
        exp_classification=exp_classification,
    )

    # 9. Apply Centralized Feature Flags
    flags = get_feature_flags()

    # ATS Score component
    ats_score_payload = None
    if flags.get("SHOW_ATS_SCORE", True):
        ats_score_payload = ATSScore(
            overall_score=ats_score_result["overall_score"],
            rating=ats_score_result["rating"],
            breakdown=ScoreBreakdown(**ats_score_result["breakdown"]),
            summary_feedback=ats_score_result["summary_feedback"],
        )

    # Skill Comparison component
    skill_comparison_payload = None
    if flags.get("SHOW_SKILL_MATCH", True) or flags.get("SHOW_KEYWORD_ANALYSIS", True):
        matching_skills = match_results["matching_skills"] if flags.get("SHOW_SKILL_MATCH", True) else []
        missing_skills = match_results["missing_skills"] if flags.get("SHOW_SKILL_MATCH", True) else []
        matching_kw = match_results["matching_keywords"] if flags.get("SHOW_KEYWORD_ANALYSIS", True) else []
        missing_kw = match_results["missing_keywords"] if flags.get("SHOW_KEYWORD_ANALYSIS", True) else []

        skill_comparison_payload = SkillComparison(
            matching_skills=matching_skills,
            missing_skills=missing_skills,
            matching_keywords=matching_kw,
            missing_keywords=missing_kw,
            skill_match_percentage=match_results["skill_match_percentage"],
            keyword_match_percentage=match_results["keyword_match_percentage"],
        )

    # Experience Analysis component (Omitted completely if candidate has no professional/internship experience or flag disabled)
    exp_payload = None
    if flags.get("SHOW_EXPERIENCE_ANALYSIS", True):
        # We always include classification metadata, but include_experience_section determines section rendering
        exp_payload = ExperienceAnalysis(
            candidate_type=exp_classification["candidate_type"],
            has_professional_experience=exp_classification["has_professional_experience"],
            has_internship_experience=exp_classification["has_internship_experience"],
            has_virtual_experience=exp_classification["has_virtual_experience"],
            include_experience_section=exp_classification["include_experience_section"],
            professional_items=exp_classification["professional_items"],
            internship_items=exp_classification["internship_items"],
            virtual_simulation_items=exp_classification["virtual_simulation_items"],
            explanation=exp_classification["explanation"],
        )

    # AI Insights component
    ai_payload = None
    if flags.get("SHOW_AI_RECOMMENDATIONS", True) or flags.get("SHOW_RESUME_STRENGTHS", True):
        strengths = ai_insights_result["resume_strengths"] if flags.get("SHOW_RESUME_STRENGTHS", True) else []
        recs = ai_insights_result["recommendations"] if flags.get("SHOW_AI_RECOMMENDATIONS", True) else []
        ai_payload = AIInsights(
            role_fit_summary=ai_insights_result["role_fit_summary"],
            resume_strengths=strengths,
            recommendations=recs,
            project_relevance_summary=ai_insights_result["project_relevance_summary"],
            is_ai_powered=ai_insights_result["is_ai_powered"],
        )

    return AnalyzeResponse(
        success=True,
        message="Resume analyzed successfully against job description." if has_jd else "Resume analyzed successfully (general resume evaluation).",
        filename=filename,
        job_description_provided=has_jd,
        feature_flags=flags,
        parsed_resume=ParsedResume(**parsed_data),
        ats_score=ats_score_payload,
        skill_comparison=skill_comparison_payload,
        experience_analysis=exp_payload,
        ai_insights=ai_payload,
        extracted_text=extracted_text,
    )
