import React, { useState, useMemo } from "react";
import Header from "../components/Header";
import ScoreCard from "../components/ScoreCard";
import ExperienceAnalysis from "../components/ExperienceAnalysis";
import CandidateProfile from "../components/CandidateProfile";
import MatchExplanation from "../components/MatchExplanation";
import QuickAnalysis from "../components/QuickAnalysis";
import SkillsComparison from "../components/SkillsComparison";
import EducationCertifications from "../components/EducationCertifications";
import ProjectPortfolio from "../components/ProjectPortfolio";
import ProjectRelevance from "../components/ProjectRelevance";
import Recommendations from "../components/Recommendations";
import ExtractedText from "../components/ExtractedText";
import { processProjects } from "../utils/projectUtils";

import GridCanvas from "../components/GridCanvas";

function ResultsPage({ result, onBack }) {
  const [recsTab, setRecsTab] = useState("all");
  const [projectsTab, setProjectsTab] = useState("all");

  if (!result) return null;

  const parsed = result.parsed_resume || {};
  const atsScore = result.ats_score;
  const skillComparison = result.skill_comparison;
  const expAnalysis = result.experience_analysis;
  const aiInsights = result.ai_insights || {};
  const flags = result.feature_flags || {};

  const candidateType = expAnalysis?.candidate_type || "fresher";
  const isFresher = candidateType === "fresher";

  const matchExplanation = aiInsights.match_explanation;
  const rawProjectEvals = aiInsights.project_evaluations || [];
  const prioritizedRecs = aiInsights.prioritized_recommendations || {
    high_priority: [],
    medium_priority: [],
    low_priority: [],
  };
  const atsTips = aiInsights.ats_optimization_tips || [];
  const resumeStrengths = aiInsights.resume_strengths || [];
  const resumeWeaknesses = aiInsights.resume_weaknesses || [];
  const jdAlignment = aiInsights.jd_alignment || {};

  const isAiPowered = aiInsights.is_ai_powered === true;
  const aiProvider = aiInsights.provider_used || "deterministic";

  // Memoize project evaluation list capped at 3
  const projectEvals = useMemo(() => rawProjectEvals.slice(0, 3), [rawProjectEvals]);

  // Memoize full project extraction
  const { allProjects, ongoingProjects, completedProjects, hasOngoing } = useMemo(() => {
    return processProjects(parsed.projects, parsed.parsed_projects, projectEvals);
  }, [parsed.projects, parsed.parsed_projects, projectEvals]);

  const displayedProjects =
    hasOngoing && projectsTab === "ongoing"
      ? ongoingProjects
      : hasOngoing && projectsTab === "completed"
      ? completedProjects
      : allProjects;

  return (
    <div className="bg-background text-on-surface min-h-screen flex flex-col relative overflow-x-hidden antialiased selection:bg-secondary selection:text-on-secondary">
      {/* Interactive Grid Shader Background */}
      <GridCanvas />

      <Header />

      <main id="main-content" className="relative z-10 flex-1 pt-16 sm:pt-20 pb-8 sm:pb-12 px-3 sm:px-6 lg:px-8 mx-auto w-full max-w-7xl">
        {/* Sub-header Navigation & Status Row */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-3 animate-fade-in-up stagger-1">
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-2 text-on-surface-variant hover:text-primary transition-colors font-body-md text-sm group cursor-pointer self-start md:self-auto"
          >
            <span className="material-symbols-outlined text-[18px] group-hover:-translate-x-1 transition-transform">
              arrow_back
            </span>
            <span>Upload Another Resume</span>
          </button>

          <div className="flex flex-wrap items-center gap-2">
            {/* AI Status Badge */}
            <span className="px-2.5 py-1 rounded-full bg-[#1C1C1E] border border-[#2C2C2E] text-on-surface text-xs font-mono flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-accent-cyan animate-pulse"></span>
              <span>{isAiPowered ? `AI-Powered (${aiProvider.toUpperCase()})` : "Deterministic Engine"}</span>
            </span>

            {/* Candidate Type Badge */}
            <span className="px-2.5 py-1 rounded-full bg-[#1C1C1E] border border-[#2C2C2E] text-on-surface text-xs font-mono flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[14px]">person</span>
              <span>{isFresher ? "Early Career / Fresher" : "Experienced Professional"}</span>
            </span>

            {/* Target JD Badge */}
            <span className="px-2.5 py-1 rounded-full bg-[#1C1C1E] border border-[#2C2C2E] text-on-surface text-xs font-mono flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[14px]">
                {result.job_description_provided ? "check_circle" : "tune"}
              </span>
              <span>{result.job_description_provided ? "Target JD Evaluated" : "General Profile Audit"}</span>
            </span>
          </div>
        </div>

        {/* Dashboard Responsive Masonry Container with Staggered Fade-in */}
        <div className="columns-1 lg:columns-2 gap-4 sm:gap-6 [column-fill:_balance]">
          
          {/* SECTION 1: Candidate Profile Card */}
          <div className="break-inside-avoid mb-4 sm:mb-6 w-full inline-block animate-fade-in-up stagger-1">
            <CandidateProfile
              parsed={parsed}
              aiInsights={aiInsights}
              filename={result.filename}
            />
          </div>

          {/* SECTION 2: ATS Compatibility Gauge & Breakdown */}
          {flags.SHOW_ATS_SCORE !== false && atsScore && (
            <div className="break-inside-avoid mb-4 sm:mb-6 w-full inline-block animate-fade-in-up stagger-2">
              <ScoreCard atsScore={atsScore} candidateType={candidateType} />
            </div>
          )}

          {/* SECTION 3: AI Job Match Explanation */}
          {matchExplanation && (
            <div className="break-inside-avoid mb-4 sm:mb-6 w-full inline-block animate-fade-in-up stagger-3">
              <MatchExplanation
                matchExplanation={matchExplanation}
                jdAlignment={jdAlignment}
                jobDescriptionProvided={result.job_description_provided}
                isAiPowered={isAiPowered}
              />
            </div>
          )}

          {/* SECTION 4: Quick Analysis — Strengths & Gaps */}
          {(flags.SHOW_RESUME_STRENGTHS !== false || resumeWeaknesses.length > 0) && (
            <div className="break-inside-avoid mb-4 sm:mb-6 w-full inline-block animate-fade-in-up stagger-4">
              <QuickAnalysis
                resumeStrengths={resumeStrengths}
                resumeWeaknesses={resumeWeaknesses}
              />
            </div>
          )}

          {/* SECTION 5 & 6: Skills Comparison Cards */}
          {(flags.SHOW_SKILL_MATCH !== false || flags.SHOW_KEYWORD_ANALYSIS !== false) && skillComparison && (
            <div className="break-inside-avoid mb-4 sm:mb-6 w-full inline-block animate-fade-in-up stagger-5">
              <SkillsComparison
                skillComparison={skillComparison}
                jobDescriptionProvided={result.job_description_provided}
              />
            </div>
          )}

          {/* SECTION 7: Professional & Internship Experience */}
          {flags.SHOW_EXPERIENCE_ANALYSIS !== false && (
            <div className="break-inside-avoid mb-4 sm:mb-6 w-full inline-block animate-fade-in-up stagger-6">
              <ExperienceAnalysis experienceAnalysis={expAnalysis} />
            </div>
          )}

          {/* SECTION 8: Education & Certifications */}
          <div className="break-inside-avoid mb-4 sm:mb-6 w-full inline-block animate-fade-in-up stagger-7">
            <EducationCertifications
              education={parsed.education}
              certifications={parsed.certifications}
            />
          </div>

          {/* SECTION 9: Project Portfolio Overview */}
          {allProjects.length > 0 && (
            <div className="break-inside-avoid mb-4 sm:mb-6 w-full inline-block animate-fade-in-up stagger-8">
              <ProjectPortfolio
                allProjects={allProjects}
                displayedProjects={displayedProjects}
                ongoingProjects={ongoingProjects}
                completedProjects={completedProjects}
                hasOngoing={hasOngoing}
                projectsTab={projectsTab}
                setProjectsTab={setProjectsTab}
              />
            </div>
          )}

          {/* SECTION 10: AI Project Relevance & Architecture Analysis */}
          {flags.SHOW_PROJECT_ANALYSIS !== false && projectEvals.length > 0 && (
            <div className="break-inside-avoid mb-4 sm:mb-6 w-full inline-block animate-fade-in-up stagger-9">
              <ProjectRelevance
                projectEvals={projectEvals}
                jobDescriptionProvided={result.job_description_provided}
                isAiPowered={isAiPowered}
              />
            </div>
          )}

          {/* SECTION 11: Prioritized AI Recommendations */}
          {flags.SHOW_AI_RECOMMENDATIONS !== false && (
            <div className="break-inside-avoid mb-4 sm:mb-6 w-full inline-block animate-fade-in-up stagger-10">
              <Recommendations
                prioritizedRecs={prioritizedRecs}
                atsTips={atsTips}
                recsTab={recsTab}
                setRecsTab={setRecsTab}
                isAiPowered={isAiPowered}
              />
            </div>
          )}

          {/* SECTION 12: Extracted Resume Text */}
          <div className="break-inside-avoid mb-4 sm:mb-6 w-full inline-block animate-fade-in-up stagger-11">
            <ExtractedText extractedText={result.extracted_text} />
          </div>

        </div>
      </main>
    </div>
  );
}

export default ResultsPage;
