import React, { useState } from "react";
import Header from "../components/Header";
import ScoreCard from "../components/ScoreCard";
import ExperienceAnalysis from "../components/ExperienceAnalysis";

function CheckCircleIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className="h-4 w-4 text-emerald-600" aria-hidden="true">
      <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function AlertCircleIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4 text-amber-600" aria-hidden="true">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" strokeLinecap="round" />
      <line x1="12" y1="16" x2="12.01" y2="16" strokeLinecap="round" />
    </svg>
  );
}

function ArrowLeftIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4" aria-hidden="true">
      <path d="M19 12H5m7 7l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function SparklesIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4 text-indigo-600" aria-hidden="true">
      <path d="M12 3v3m0 12v3M3 12h3m12 0h3m-3.5-6.5l-2 2m-7 7l-2 2m0-11l2 2m7 7l2 2" strokeLinecap="round" />
    </svg>
  );
}

function TargetIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4 text-slate-700" aria-hidden="true">
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" />
    </svg>
  );
}

function FolderGitIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5 text-indigo-600" aria-hidden="true">
      <path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z" />
      <circle cx="12" cy="13" r="2" />
    </svg>
  );
}

function getRelevanceBadge(score) {
  const normalized = (score || "").toLowerCase();
  if (normalized.includes("high")) {
    return {
      className: "bg-emerald-100 text-emerald-800 border-emerald-200",
      label: "High Relevance",
    };
  }
  if (normalized.includes("medium")) {
    return {
      className: "bg-amber-100 text-amber-800 border-amber-200",
      label: "Medium Relevance",
    };
  }
  if (normalized.includes("low")) {
    return {
      className: "bg-slate-100 text-slate-700 border-slate-200",
      label: "Low Relevance",
    };
  }
  return {
    className: "bg-rose-100 text-rose-800 border-rose-200",
    label: "Not Relevant",
  };
}

function ResultsPage({ result, onBack }) {
  const [showRawText, setShowRawText] = useState(false);
  const [recsTab, setRecsTab] = useState("all"); // "all" | "high" | "medium" | "low" | "ats"

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
  const projectEvals = aiInsights.project_evaluations || [];
  const prioritizedRecs = aiInsights.prioritized_recommendations || {
    high_priority: [],
    medium_priority: [],
    low_priority: [],
  };
  const atsTips = aiInsights.ats_optimization_tips || [];
  const resumeWeaknesses = aiInsights.resume_weaknesses || [];
  const jdAlignment = aiInsights.jd_alignment || {};

  const isAiPowered = aiInsights.is_ai_powered === true;
  const aiProvider = aiInsights.provider_used || "deterministic";

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <Header />

      <main className="mx-auto max-w-6xl px-5 py-8 sm:px-6 lg:py-10">
        {/* Top Navigation & Status Bar */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-2 self-start rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-2xs transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2"
          >
            <ArrowLeftIcon />
            <span>Upload Another Resume</span>
          </button>

          <div className="flex flex-wrap items-center gap-2">
            {/* AI Status Badge */}
            <span
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1 text-xs font-semibold border ${isAiPowered
                ? "bg-indigo-50 text-indigo-700 border-indigo-200"
                : "bg-slate-100 text-slate-700 border-slate-200"
                }`}
            >
              {isAiPowered ? (
                <>
                  <SparklesIcon />
                  <span>AI-Powered ({aiProvider.toUpperCase()})</span>
                </>
              ) : (
                <span>⚡ Deterministic ATS Engine</span>
              )}
            </span>

            {/* Candidate Type Badge */}
            <span
              className={`rounded-lg px-3 py-1 text-xs font-semibold border ${isFresher
                ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                : "bg-blue-100 text-blue-800 border-blue-200"
                }`}
            >
              {isFresher ? "Fresher / Early Career" : "Experienced Professional"}
            </span>

            {/* Job Description Provided / General Badge */}
            {!result.job_description_provided ? (
              <span className="rounded-lg bg-amber-100 text-amber-800 border border-amber-200 px-3 py-1 text-xs font-semibold">
                General Profile Audit
              </span>
            ) : (
              <span className="rounded-lg bg-emerald-100 text-emerald-800 border border-emerald-200 px-3 py-1 text-xs font-semibold">
                Target JD Evaluated
              </span>
            )}
          </div>
        </div>

        {/* Candidate Profile Header Card */}
        <div className="mb-8 overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs sm:p-7">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Candidate Profile
              </span>
              <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                {parsed.name || "Candidate Resume"}
              </h1>
              {aiInsights?.role_fit_summary && (
                <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-600">
                  {aiInsights.role_fit_summary}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-2 rounded-xl bg-slate-50 p-4 sm:min-w-[240px] border border-slate-200/60">
              <div className="text-xs">
                <span className="font-semibold text-slate-600">Email: </span>
                {parsed.email ? (
                  <a href={`mailto:${parsed.email}`} className="text-blue-600 hover:underline">
                    {parsed.email}
                  </a>
                ) : (
                  <span className="text-slate-400 italic">Not detected</span>
                )}
              </div>
              <div className="text-xs">
                <span className="font-semibold text-slate-600">Phone: </span>
                {parsed.phone ? (
                  <span className="text-slate-700">{parsed.phone}</span>
                ) : (
                  <span className="text-slate-400 italic">Not detected</span>
                )}
              </div>
              <div className="text-xs">
                <span className="font-semibold text-slate-600">Document: </span>
                <span className="text-slate-700">{result.filename}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-8">
          {/* 1. AI Job Match Explanation Card (Why Your Resume Matches) */}
          {matchExplanation && (
            <div className="rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50/70 via-white to-white p-6 shadow-2xs sm:p-7">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-100 text-indigo-700">
                  <SparklesIcon />
                </div>
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-indigo-700">
                    AI Job Match Explanation
                  </span>
                  <h2 className="text-lg font-bold text-slate-900">
                    Why Your Resume {result.job_description_provided ? "Matches This Position" : "Matches Industry Standards"}
                  </h2>
                </div>
              </div>

              <p className="mt-4 text-sm leading-relaxed text-slate-700 font-medium bg-white/80 rounded-xl p-4 border border-indigo-100/80">
                {matchExplanation.overview}
              </p>

              <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2">
                {/* Strongest Matching Areas */}
                <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-900 flex items-center gap-1.5">
                    <CheckCircleIcon /> {result.job_description_provided ? "Strongest Match Areas" : "Key Highlighted Strengths"}
                  </h3>
                  <ul className="mt-3 space-y-2">
                    {matchExplanation.strongest_match_areas?.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-xs text-emerald-950 font-medium">
                        <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-emerald-200 text-2xs font-bold text-emerald-800">
                          ✓
                        </span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Gaps / Profile Enhancements */}
                <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-amber-900 flex items-center gap-1.5">
                    <AlertCircleIcon /> {result.job_description_provided ? "Key Gaps & Missing Requirements" : "Recommended Profile Enhancements"}
                  </h3>
                  <ul className="mt-3 space-y-2">
                    {matchExplanation.biggest_gaps?.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-xs text-amber-950 font-medium">
                        <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-amber-200 text-2xs font-bold text-amber-800">
                          !
                        </span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Experience & Education Alignment Tags (Only when Target JD is provided) */}
              {result.job_description_provided && (jdAlignment.experience_alignment || jdAlignment.education_alignment) && (
                <div className="mt-4 flex flex-wrap gap-2 pt-2 border-t border-slate-200/60">
                  {jdAlignment.experience_alignment && (
                    <span className="inline-flex items-center rounded-lg bg-white px-3 py-1 text-xs font-medium text-slate-700 border border-slate-200">
                      <strong>Experience Alignment:</strong>&nbsp;{jdAlignment.experience_alignment}
                    </span>
                  )}
                  {jdAlignment.education_alignment && (
                    <span className="inline-flex items-center rounded-lg bg-white px-3 py-1 text-xs font-medium text-slate-700 border border-slate-200">
                      <strong>Education Alignment:</strong>&nbsp;{jdAlignment.education_alignment}
                    </span>
                  )}
                </div>
              )}
            </div>
          )}

          {/* 2. Deterministic ATS Score & Breakdown (Feature Flag Protected) */}
          {flags.SHOW_ATS_SCORE !== false && atsScore && (
            <ScoreCard atsScore={atsScore} candidateType={candidateType} />
          )}

          {/* 3. Intelligent Skills Comparison & Keyword Gaps */}
          {(flags.SHOW_SKILL_MATCH !== false || flags.SHOW_KEYWORD_ANALYSIS !== false) && skillComparison && (
            <div className={`grid grid-cols-1 gap-6 ${result.job_description_provided ? "lg:grid-cols-2" : "lg:grid-cols-1"}`}>
              {/* Matching / Identified Skills */}
              {flags.SHOW_SKILL_MATCH !== false && (
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs sm:p-7">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100">
                        <CheckCircleIcon />
                      </div>
                      <h3 className="text-base font-bold text-slate-900">
                        {result.job_description_provided ? "Matching Skills" : "Identified Skills"} ({skillComparison.matching_skills?.length || 0})
                      </h3>
                    </div>
                    <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                      {result.job_description_provided ? `${skillComparison.skill_match_percentage}% match` : "Verified in Resume"}
                    </span>
                  </div>
                  <p className="mt-2 text-xs leading-relaxed text-slate-500">
                    {result.job_description_provided
                      ? "Skills detected in your resume that directly align with the job description (with synonym recognition)."
                      : "Core technical skills identified in your resume profile."}
                  </p>

                  {skillComparison.matching_skills && skillComparison.matching_skills.length > 0 ? (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {skillComparison.matching_skills.map((skill, idx) => {
                        const synonymInfo = skillComparison.synonym_matches?.[skill];
                        return (
                          <span
                            key={idx}
                            title={synonymInfo ? `Recognized via: ${synonymInfo}` : ""}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50/80 px-3 py-1.5 text-xs font-medium text-emerald-900"
                          >
                            <CheckCircleIcon />
                            <span>{skill}</span>
                            {synonymInfo && (
                              <span className="text-2xs text-emerald-700 bg-emerald-100/70 px-1 py-0.2 rounded font-normal">
                                alias
                              </span>
                            )}
                          </span>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="mt-4 text-xs italic text-slate-400">
                      No technical skills detected in the parsed text.
                    </p>
                  )}

                  {/* Categorized Skills Breakdown */}
                  {skillComparison.categorized_skills && Object.keys(skillComparison.categorized_skills).length > 0 && (
                    <div className="mt-6 border-t border-slate-100 pt-4 space-y-3">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                        Categorized Skill Breakdown
                      </h4>
                      <div className={`grid grid-cols-1 gap-2 ${result.job_description_provided ? "" : "sm:grid-cols-2"}`}>
                        {Object.entries(skillComparison.categorized_skills).map(([catName, catSkills], cIdx) => (
                          <div key={cIdx} className="text-xs bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                            <span className="font-semibold text-slate-700 block mb-0.5">{catName}: </span>
                            <span className="text-slate-600 leading-relaxed">{catSkills.join(", ")}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Identified Domain Keywords (Shown during General Audit) */}
                  {!result.job_description_provided && flags.SHOW_KEYWORD_ANALYSIS !== false && skillComparison.matching_keywords && skillComparison.matching_keywords.length > 0 && (
                    <div className="mt-6 border-t border-slate-100 pt-4 space-y-3">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                        Identified Domain Keywords ({skillComparison.matching_keywords.length})
                      </h4>
                      <div className="flex flex-wrap gap-1.5">
                        {skillComparison.matching_keywords.map((kw, kIdx) => (
                          <span key={kIdx} className="rounded bg-slate-100 px-2 py-0.5 text-2xs font-medium text-slate-700">
                            {kw}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Missing / Gap Skills (ONLY rendered when a Job Description is provided) */}
              {result.job_description_provided && flags.SHOW_SKILL_MATCH !== false && (
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs sm:p-7">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100">
                        <AlertCircleIcon />
                      </div>
                      <h3 className="text-base font-bold text-slate-900">
                        Missing / Gap Skills ({skillComparison.missing_skills?.length || 0})
                      </h3>
                    </div>
                    <span className="text-xs font-semibold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
                      Important Keywords
                    </span>
                  </div>
                  <p className="mt-2 text-xs leading-relaxed text-slate-500">
                    Required in the job posting but not detected on your resume.
                  </p>

                  {skillComparison.missing_skills && skillComparison.missing_skills.length > 0 ? (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {skillComparison.missing_skills.map((skill, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-amber-200 bg-amber-50/80 px-3 py-1.5 text-xs font-medium text-amber-900"
                        >
                          <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                          {skill}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-4 text-xs font-medium text-emerald-600">
                      Great job! All target job skills are represented.
                    </p>
                  )}

                  {/* Ethical Guidance Tip */}
                  <div className="mt-5 rounded-xl bg-amber-50/80 p-3.5 text-xs leading-relaxed text-amber-900 border border-amber-200/60">
                    <strong>Ethical ATS Guidance:</strong> If you possess practical experience with any of these missing skills, incorporate them naturally into your skills section and project bullet points. Never falsely claim technologies you have not used.
                  </div>

                  {/* Matching & Missing Domain Keywords */}
                  {flags.SHOW_KEYWORD_ANALYSIS !== false && (
                    <div className="mt-6 border-t border-slate-100 pt-4 space-y-3">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                        Domain Keyword Coverage ({skillComparison.matching_keywords?.length || 0} matched)
                      </h4>
                      {skillComparison.matching_keywords && skillComparison.matching_keywords.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {skillComparison.matching_keywords.map((kw, kIdx) => (
                            <span key={kIdx} className="rounded bg-slate-100 px-2 py-0.5 text-2xs font-medium text-slate-700">
                              {kw}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* 4. Strengths & Weaknesses Comparison Grid */}
          {(flags.SHOW_RESUME_STRENGTHS !== false || resumeWeaknesses.length > 0) && (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              {/* Strengths */}
              {flags.SHOW_RESUME_STRENGTHS !== false && (
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs sm:p-7">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-800">
                      <SparklesIcon />
                    </div>
                    <h3 className="text-base font-bold text-slate-900">
                      Resume Strengths
                    </h3>
                  </div>
                  <ul className="mt-4 space-y-3">
                    {aiInsights.resume_strengths?.map((strength, idx) => (
                      <li key={idx} className="flex items-start gap-2.5 text-sm leading-relaxed text-slate-700">
                        <span className="mt-1 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-2xs font-bold text-emerald-800">
                          ✓
                        </span>
                        <span>{strength}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Weaknesses & Detected Vulnerabilities */}
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs sm:p-7">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 text-amber-800">
                    <AlertCircleIcon />
                  </div>
                  <h3 className="text-base font-bold text-slate-900">
                    Areas for Improvement & Gaps
                  </h3>
                </div>
                <ul className="mt-4 space-y-3">
                  {resumeWeaknesses.map((weakness, idx) => (
                    <li key={idx} className="flex items-start gap-2.5 text-sm leading-relaxed text-slate-700">
                      <span className="mt-1 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-amber-100 text-2xs font-bold text-amber-800">
                        !
                      </span>
                      <span>{weakness}</span>
                    </li>
                  ))}
                  {resumeWeaknesses.length === 0 && (
                    <li className="text-xs italic text-slate-400">
                      No critical structural weaknesses detected.
                    </li>
                  )}
                </ul>
              </div>
            </div>
          )}

          {/* 5. AI Project Relevance Analysis Section */}
          {flags.SHOW_PROJECT_ANALYSIS !== false && projectEvals.length > 0 && (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs sm:p-7">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-100 text-indigo-700">
                    <FolderGitIcon />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">
                      AI Project Relevance Analysis ({projectEvals.length})
                    </h3>
                    <p className="text-xs text-slate-500">
                      Evaluating each project's practical alignment, tech stack, and impact.
                    </p>
                  </div>
                </div>
                <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-3 py-1 rounded-full self-start">
                  {result.job_description_provided ? "Evaluated Against Target Role" : "General Technical Merit"}
                </span>
              </div>

              <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2">
                {projectEvals.map((proj, pIdx) => {
                  const badge = getRelevanceBadge(proj.relevance_score);
                  return (
                    <div
                      key={pIdx}
                      className="rounded-xl border border-slate-200 bg-slate-50/50 p-5 transition hover:bg-slate-50/80 flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-3">
                          <h4 className="text-sm font-bold text-slate-900">
                            {proj.project_title}
                          </h4>
                          <span
                            className={`inline-flex shrink-0 items-center rounded-full border px-2.5 py-0.5 text-2xs font-semibold ${badge.className}`}
                          >
                            {badge.label}
                          </span>
                        </div>

                        {/* Technologies & Skills Demonstrated */}
                        {proj.technologies_detected && proj.technologies_detected.length > 0 && (
                          <div className="mt-3 flex flex-wrap gap-1.5">
                            {proj.technologies_detected.map((t, tIdx) => (
                              <span
                                key={tIdx}
                                className="rounded bg-white px-2 py-0.5 text-2xs font-medium text-slate-700 border border-slate-200/80"
                              >
                                {t}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Why it's relevant */}
                        {proj.relevance_explanation && (
                          <p className="mt-3 text-xs leading-relaxed text-slate-600">
                            <strong>Why Relevant:</strong> {proj.relevance_explanation}
                          </p>
                        )}
                      </div>

                      {/* What could be emphasized */}
                      {proj.improvement_suggestions && (
                        <div className="mt-4 rounded-lg bg-white p-3 text-2xs leading-relaxed text-indigo-900 border border-indigo-100">
                          <strong>Optimization Tip:</strong> {proj.improvement_suggestions}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 6. AI Prioritized Recommendations Hub */}
          {flags.SHOW_AI_RECOMMENDATIONS !== false && (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs sm:p-7">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-100 text-indigo-800">
                    <TargetIcon />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">
                      Prioritized AI Recommendations
                    </h3>
                    <p className="text-xs text-slate-500">
                      Actionable steps ordered by impact on your ATS score and recruiter impression.
                    </p>
                  </div>
                </div>

                {/* Tab Switcher */}
                <div className="flex flex-wrap gap-1 rounded-xl bg-slate-100 p-1 self-start">
                  <button
                    type="button"
                    onClick={() => setRecsTab("all")}
                    className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${recsTab === "all" ? "bg-white text-slate-900 shadow-2xs" : "text-slate-600 hover:text-slate-900"
                      }`}
                  >
                    All
                  </button>
                  <button
                    type="button"
                    onClick={() => setRecsTab("high")}
                    className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${recsTab === "high" ? "bg-rose-100 text-rose-900 shadow-2xs" : "text-slate-600 hover:text-slate-900"
                      }`}
                  >
                    🔴 High ({prioritizedRecs.high_priority?.length || 0})
                  </button>
                  <button
                    type="button"
                    onClick={() => setRecsTab("medium")}
                    className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${recsTab === "medium" ? "bg-amber-100 text-amber-900 shadow-2xs" : "text-slate-600 hover:text-slate-900"
                      }`}
                  >
                    🟡 Medium ({prioritizedRecs.medium_priority?.length || 0})
                  </button>
                  <button
                    type="button"
                    onClick={() => setRecsTab("low")}
                    className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${recsTab === "low" ? "bg-emerald-100 text-emerald-900 shadow-2xs" : "text-slate-600 hover:text-slate-900"
                      }`}
                  >
                    🟢 Low ({prioritizedRecs.low_priority?.length || 0})
                  </button>
                  <button
                    type="button"
                    onClick={() => setRecsTab("ats")}
                    className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${recsTab === "ats" ? "bg-indigo-100 text-indigo-900 shadow-2xs" : "text-slate-600 hover:text-slate-900"
                      }`}
                  >
                    💡 ATS Tips ({atsTips.length})
                  </button>
                </div>
              </div>

              <div className="mt-6 space-y-4">
                {/* High Priority Items */}
                {(recsTab === "all" || recsTab === "high") && prioritizedRecs.high_priority?.length > 0 && (
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-rose-800 mb-2 flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-rose-500" /> High Priority (Immediate ATS Impact)
                    </h4>
                    <ul className="space-y-2.5">
                      {prioritizedRecs.high_priority.map((rec, idx) => (
                        <li
                          key={idx}
                          className="flex items-start gap-3 rounded-xl border border-rose-100 bg-rose-50/40 p-3.5 text-sm leading-relaxed text-slate-800"
                        >
                          <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-rose-100 text-xs font-bold text-rose-800">
                            {idx + 1}
                          </span>
                          <span>{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Medium Priority Items */}
                {(recsTab === "all" || recsTab === "medium") && prioritizedRecs.medium_priority?.length > 0 && (
                  <div className="mt-4">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-amber-800 mb-2 flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-amber-500" /> Medium Priority (Content & Phrasing)
                    </h4>
                    <ul className="space-y-2.5">
                      {prioritizedRecs.medium_priority.map((rec, idx) => (
                        <li
                          key={idx}
                          className="flex items-start gap-3 rounded-xl border border-amber-100 bg-amber-50/40 p-3.5 text-sm leading-relaxed text-slate-800"
                        >
                          <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-100 text-xs font-bold text-amber-800">
                            {idx + 1}
                          </span>
                          <span>{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Low Priority Items */}
                {(recsTab === "all" || recsTab === "low") && prioritizedRecs.low_priority?.length > 0 && (
                  <div className="mt-4">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-800 mb-2 flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-emerald-500" /> Low Priority (Styling & Polish)
                    </h4>
                    <ul className="space-y-2.5">
                      {prioritizedRecs.low_priority.map((rec, idx) => (
                        <li
                          key={idx}
                          className="flex items-start gap-3 rounded-xl border border-emerald-100 bg-emerald-50/40 p-3.5 text-sm leading-relaxed text-slate-800"
                        >
                          <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-800">
                            {idx + 1}
                          </span>
                          <span>{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* ATS Optimization Tips */}
                {(recsTab === "all" || recsTab === "ats") && atsTips.length > 0 && (
                  <div className="mt-4">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-800 mb-2 flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-indigo-500" /> ATS Optimization Best Practices
                    </h4>
                    <ul className="space-y-2.5">
                      {atsTips.map((tip, idx) => (
                        <li
                          key={idx}
                          className="flex items-start gap-3 rounded-xl border border-indigo-100 bg-indigo-50/40 p-3.5 text-sm leading-relaxed text-slate-800"
                        >
                          <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-800">
                            💡
                          </span>
                          <span>{tip}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 7. Conditional Professional Experience Section */}
          {flags.SHOW_EXPERIENCE_ANALYSIS !== false && (
            <ExperienceAnalysis experienceAnalysis={expAnalysis} />
          )}

          {/* 8. Education & Certifications */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs sm:p-7 space-y-6">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Education ({parsed.education?.length || 0})
              </h3>
              {parsed.education && parsed.education.length > 0 ? (
                <ul className="mt-3 space-y-2 text-sm text-slate-700">
                  {parsed.education.map((edu, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-slate-400">•</span>
                      <span>{edu}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2 text-xs italic text-slate-400">No education section detected.</p>
              )}
            </div>

            {parsed.certifications && parsed.certifications.length > 0 && (
              <div className="border-t border-slate-200 pt-4">
                <h3 className="text-base font-bold text-slate-900 mb-3">
                  Certifications ({parsed.certifications.length})
                </h3>
                <ul className="space-y-2.5">
                  {parsed.certifications.map((cert, idx) => {
                    const certStr = typeof cert === "string" ? cert : (cert.title || "");
                    const parts = certStr.split("\n");
                    const title = parts[0].trim();
                    const desc = parts.slice(1).join(" ").trim();
                    return (
                      <li key={idx} className="flex items-start gap-3 rounded-xl border border-slate-100 bg-slate-50/70 p-3.5 text-sm text-slate-800">
                        <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-2xs font-bold text-emerald-800">
                          ✓
                        </span>
                        <div>
                          <div className="font-semibold text-slate-900">{title}</div>
                          {desc && (
                            <p className="mt-1 text-xs text-slate-600 leading-relaxed">{desc}</p>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </div>

          {/* 9. Expandable Raw Text Viewer */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-600">
                  Extracted Document Text
                </h3>
                <p className="mt-0.5 text-xs text-slate-500">
                  Inspect the plain text extracted from your document for verification.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowRawText(!showRawText)}
                className="rounded-lg border border-slate-300 bg-slate-50 px-3.5 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
              >
                {showRawText ? "Hide Raw Text" : "Show Raw Text"}
              </button>
            </div>

            {showRawText && (
              <div className="mt-4">
                <pre className="max-h-96 overflow-y-auto whitespace-pre-wrap rounded-xl bg-slate-900 p-4 font-mono text-xs leading-relaxed text-slate-100">
                  {result.extracted_text || "No text extracted."}
                </pre>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default ResultsPage;
