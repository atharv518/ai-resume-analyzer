import asyncio
from typing import Annotated, Any, Callable
from fastapi import APIRouter, File, Form, HTTPException, UploadFile, status
from pydantic import BaseModel, Field

from app.config import FeatureFlags, get_feature_flags
from app.services.ai_analyzer import analyze_with_ai
from app.services.ats_scorer import calculate_ats_score
from app.services.experience_detector import classify_experience_text
from app.services.extractor import extract_resume_text
from app.services.job_matcher import compare_resume_with_jd
from app.services.job_queue import job_queue
from app.services.parser import parse_resume
from app.services.resume_validator import validate_resume_content
from app.utils.file_validation import validate_resume_file

router = APIRouter()

MAX_JD_LENGTH = 10_000


class StructuredProjectModel(BaseModel):
    title: str = ""
    description: str = ""
    technologies: list[str] = Field(default_factory=list)
    is_ongoing: bool = False


class ParsedResume(BaseModel):
    name: str = ""
    email: str = ""
    phone: str = ""
    skills: list[str] = Field(default_factory=list)
    education: list[str] = Field(default_factory=list)
    experience: list[str] = Field(default_factory=list)
    projects: list[str] = Field(default_factory=list)
    parsed_projects: list[StructuredProjectModel] = Field(default_factory=list)
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
    synonym_matches: dict[str, str] = Field(default_factory=dict)
    categorized_skills: dict[str, list[str]] = Field(default_factory=dict)


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


class MatchExplanationModel(BaseModel):
    overview: str = ""
    strongest_match_areas: list[str] = Field(default_factory=list)
    biggest_gaps: list[str] = Field(default_factory=list)
    priority_improvements: list[str] = Field(default_factory=list)


class ProjectEvaluationModel(BaseModel):
    project_title: str = ""
    relevance_score: str = "Medium"
    technologies_detected: list[str] = Field(default_factory=list)
    skills_demonstrated: list[str] = Field(default_factory=list)
    relevance_explanation: str = ""
    improvement_suggestions: str = ""


class PrioritizedRecommendationsModel(BaseModel):
    high_priority: list[str] = Field(default_factory=list)
    medium_priority: list[str] = Field(default_factory=list)
    low_priority: list[str] = Field(default_factory=list)


class TechnicalSkillAssessmentModel(BaseModel):
    depth_rating: str = ""
    strengths: list[str] = Field(default_factory=list)
    gaps: list[str] = Field(default_factory=list)


class ExperienceAssessmentModel(BaseModel):
    quality_rating: str = ""
    feedback: str = ""


class JDAlignmentModel(BaseModel):
    experience_alignment: str = ""
    education_alignment: str = ""
    matching_responsibilities: list[str] = Field(default_factory=list)
    missing_responsibilities: list[str] = Field(default_factory=list)


class AIInsights(BaseModel):
    role_fit_summary: str
    resume_strengths: list[str] = Field(default_factory=list)
    recommendations: list[str] = Field(default_factory=list)
    project_relevance_summary: str
    is_ai_powered: bool = False
    provider_used: str = "deterministic"
    match_explanation: MatchExplanationModel | None = None
    resume_weaknesses: list[str] = Field(default_factory=list)
    technical_skill_assessment: TechnicalSkillAssessmentModel | None = None
    experience_assessment: ExperienceAssessmentModel | None = None
    project_evaluations: list[ProjectEvaluationModel] = Field(default_factory=list)
    prioritized_recommendations: PrioritizedRecommendationsModel | None = None
    ats_optimization_tips: list[str] = Field(default_factory=list)
    jd_alignment: JDAlignmentModel | None = None


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


class AsyncJobSubmitResponse(BaseModel):
    job_id: str
    status: str
    poll_url: str
    message: str


class AsyncJobStatusResponse(BaseModel):
    job_id: str
    status: str
    progress_percentage: int
    current_step: str
    created_at: float
    completed_at: float | None = None
    result: AnalyzeResponse | None = None
    error: str | None = None


async def process_resume_pipeline(
    extension: str,
    file_bytes: bytes,
    filename: str,
    clean_jd: str,
    progress_callback: Callable[[int, str], Any] | None = None,
) -> dict[str, Any]:
    """Execute the end-to-end resume extraction, parsing, scoring, and AI analysis pipeline with progress reporting."""
    has_jd = bool(clean_jd and len(clean_jd) >= 10)

    # Step 1: Text extraction
    if progress_callback:
        await progress_callback(20, "Extracting text from resume")
    extracted_text = extract_resume_text(extension, file_bytes)

    # Step 2: Content validation
    if progress_callback:
        await progress_callback(35, "Validating resume structure")
    validate_resume_content(extracted_text)

    # Step 3: Parsing fields & sections
    if progress_callback:
        await progress_callback(50, "Parsing sections, skills, and projects")
    parsed_data = parse_resume(extracted_text)

    # Step 4: Job Description Matching & Experience Classification
    if progress_callback:
        await progress_callback(65, "Matching skills and classifying candidate experience")
    match_results = compare_resume_with_jd(
        resume_text=extracted_text,
        resume_skills=parsed_data["skills"],
        jd_text=clean_jd,
    )
    exp_classification = classify_experience_text(
        experience_lines=parsed_data["experience"],
        projects_lines=parsed_data["projects"],
        full_text=extracted_text,
        certifications_lines=parsed_data["certifications"],
    )

    # Step 5: Deterministic ATS Scoring
    if progress_callback:
        await progress_callback(75, "Calculating ATS compatibility score")
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

    # Step 6: AI Insights & Actionable Recommendations
    if progress_callback:
        await progress_callback(85, "Generating AI insights and recommendations")
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

    # Step 7: Construct response payload
    if progress_callback:
        await progress_callback(95, "Finalizing analysis results")
    flags = get_feature_flags()

    ats_score_payload = None
    if flags.get("SHOW_ATS_SCORE", True):
        ats_score_payload = ATSScore(
            overall_score=ats_score_result["overall_score"],
            rating=ats_score_result["rating"],
            breakdown=ScoreBreakdown(**ats_score_result["breakdown"]),
            summary_feedback=ats_score_result["summary_feedback"],
        )

    skill_comparison_payload = None
    if flags.get("SHOW_SKILL_MATCH", True) or flags.get("SHOW_KEYWORD_ANALYSIS", True):
        matching_skills = match_results["matching_skills"] if flags.get("SHOW_SKILL_MATCH", True) else []
        missing_skills = (match_results["missing_skills"] if has_jd else []) if flags.get("SHOW_SKILL_MATCH", True) else []
        matching_kw = match_results["matching_keywords"] if flags.get("SHOW_KEYWORD_ANALYSIS", True) else []
        missing_kw = (match_results["missing_keywords"] if has_jd else []) if flags.get("SHOW_KEYWORD_ANALYSIS", True) else []

        skill_comparison_payload = SkillComparison(
            matching_skills=matching_skills,
            missing_skills=missing_skills,
            matching_keywords=matching_kw,
            missing_keywords=missing_kw,
            skill_match_percentage=match_results["skill_match_percentage"],
            keyword_match_percentage=match_results["keyword_match_percentage"],
            synonym_matches=match_results.get("synonym_matches", {}) if has_jd else {},
            categorized_skills=match_results.get("categorized_skills", {}),
        )

    exp_payload = None
    if flags.get("SHOW_EXPERIENCE_ANALYSIS", True):
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

    ai_payload = None
    if flags.get("SHOW_AI_RECOMMENDATIONS", True) or flags.get("SHOW_RESUME_STRENGTHS", True):
        strengths = ai_insights_result["resume_strengths"] if flags.get("SHOW_RESUME_STRENGTHS", True) else []
        recs = ai_insights_result["recommendations"] if flags.get("SHOW_AI_RECOMMENDATIONS", True) else []

        match_exp = (
            MatchExplanationModel(**ai_insights_result["match_explanation"])
            if "match_explanation" in ai_insights_result
            else None
        )
        tech_assessment = (
            TechnicalSkillAssessmentModel(**ai_insights_result["technical_skill_assessment"])
            if "technical_skill_assessment" in ai_insights_result
            else None
        )
        exp_assessment = (
            ExperienceAssessmentModel(**ai_insights_result["experience_assessment"])
            if "experience_assessment" in ai_insights_result
            else None
        )
        project_evals = [
            ProjectEvaluationModel(**p) for p in ai_insights_result.get("project_evaluations", [])
        ]
        prioritized_recs = (
            PrioritizedRecommendationsModel(**ai_insights_result["prioritized_recommendations"])
            if "prioritized_recommendations" in ai_insights_result
            else None
        )
        jd_align = (
            JDAlignmentModel(**ai_insights_result["jd_alignment"])
            if "jd_alignment" in ai_insights_result
            else None
        )

        ai_payload = AIInsights(
            role_fit_summary=ai_insights_result["role_fit_summary"],
            resume_strengths=strengths,
            recommendations=recs,
            project_relevance_summary=ai_insights_result["project_relevance_summary"],
            is_ai_powered=ai_insights_result["is_ai_powered"],
            provider_used=ai_insights_result.get("provider_used", "deterministic"),
            match_explanation=match_exp,
            resume_weaknesses=ai_insights_result.get("resume_weaknesses", []),
            technical_skill_assessment=tech_assessment,
            experience_assessment=exp_assessment,
            project_evaluations=project_evals,
            prioritized_recommendations=prioritized_recs,
            ats_optimization_tips=ai_insights_result.get("ats_optimization_tips", []),
            jd_alignment=jd_align,
        )

    response = AnalyzeResponse(
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
    return response.model_dump()


@router.post("/analyze", response_model=AnalyzeResponse)
async def analyze_resume(
    resume: Annotated[UploadFile | None, File()] = None,
    job_description: Annotated[str | None, Form()] = None,
) -> AnalyzeResponse:
    """Synchronous resume analysis endpoint for direct execution."""
    if resume is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Please select a resume file.",
        )

    clean_jd = (job_description or "").strip()
    if len(clean_jd) > MAX_JD_LENGTH:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"The job description must be {MAX_JD_LENGTH:,} characters or fewer.",
        )

    try:
        filename, extension, file_bytes = await validate_resume_file(resume)
    finally:
        await resume.close()

    result_dict = await process_resume_pipeline(
        extension=extension,
        file_bytes=file_bytes,
        filename=filename,
        clean_jd=clean_jd,
    )
    return AnalyzeResponse(**result_dict)


@router.post("/analyze/async", response_model=AsyncJobSubmitResponse, status_code=status.HTTP_202_ACCEPTED)
async def submit_async_analysis(
    resume: Annotated[UploadFile | None, File()] = None,
    job_description: Annotated[str | None, Form()] = None,
) -> AsyncJobSubmitResponse:
    """Asynchronous resume analysis endpoint — submits job to queue and returns job ID for polling."""
    if resume is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Please select a resume file.",
        )

    clean_jd = (job_description or "").strip()
    if len(clean_jd) > MAX_JD_LENGTH:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"The job description must be {MAX_JD_LENGTH:,} characters or fewer.",
        )

    try:
        filename, extension, file_bytes = await validate_resume_file(resume)
    finally:
        await resume.close()

    job_id = job_queue.create_job()

    # Dispatch to background task worker
    asyncio.create_task(
        job_queue.execute_job(
            job_id,
            process_resume_pipeline,
            extension=extension,
            file_bytes=file_bytes,
            filename=filename,
            clean_jd=clean_jd,
        )
    )

    return AsyncJobSubmitResponse(
        job_id=job_id,
        status="queued",
        poll_url=f"/api/jobs/{job_id}",
        message="Resume analysis job queued successfully.",
    )


@router.get("/jobs/{job_id}", response_model=AsyncJobStatusResponse)
async def get_job_status(job_id: str) -> AsyncJobStatusResponse:
    """Poll the status and retrieve results of an asynchronous analysis job."""
    job = job_queue.get_job(job_id)
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Analysis job not found or has expired.",
        )

    result_payload = None
    if job.result:
        result_payload = AnalyzeResponse(**job.result)

    return AsyncJobStatusResponse(
        job_id=job.job_id,
        status=job.status.value,
        progress_percentage=job.progress_percentage,
        current_step=job.current_step,
        created_at=job.created_at,
        completed_at=job.completed_at,
        result=result_payload,
        error=job.error,
    )
