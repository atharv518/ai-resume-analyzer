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
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5 text-indigo-600" aria-hidden="true">
      <path d="M12 3v3m0 12v3M3 12h3m12 0h3m-3.5-6.5l-2 2m-7 7l-2 2m0-11l2 2m7 7l2 2" strokeLinecap="round" />
    </svg>
  );
}

function TargetIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5 text-slate-700" aria-hidden="true">
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" />
    </svg>
  );
}

function ResultsPage({ result, onBack }) {
  const [showRawText, setShowRawText] = useState(false);

  if (!result) return null;

  const parsed = result.parsed_resume || {};
  const atsScore = result.ats_score;
  const skillComparison = result.skill_comparison;
  const expAnalysis = result.experience_analysis;
  const aiInsights = result.ai_insights;
  const flags = result.feature_flags || {};

  const candidateType = expAnalysis?.candidate_type || "fresher";
  const isFresher = candidateType === "fresher";

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <Header />

      <main className="mx-auto max-w-6xl px-5 py-8 sm:px-6 lg:py-10">
        {/* Top Navigation Bar */}
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
            <span className="rounded-lg bg-slate-200/70 px-3 py-1 text-xs font-semibold text-slate-700">
              File: {result.filename}
            </span>
            <span
              className={`rounded-lg px-3 py-1 text-xs font-semibold ${
                isFresher
                  ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                  : "bg-blue-100 text-blue-800 border border-blue-200"
              }`}
            >
              Candidate Type: {isFresher ? "Fresher / Early Career" : "Experienced Professional"}
            </span>
            {!result.job_description_provided && (
              <span className="rounded-lg bg-amber-100 text-amber-800 border border-amber-200 px-3 py-1 text-xs font-semibold">
                General Audit (No JD)
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
                <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600">
                  {aiInsights.role_fit_summary}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-2 rounded-xl bg-slate-50 p-4 sm:min-w-[240px]">
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
            </div>
          </div>
        </div>

        <div className="space-y-8">
          {/* 1. Prominent ATS Score & Breakdown (Feature Flag Protected) */}
          {flags.SHOW_ATS_SCORE !== false && atsScore && (
            <ScoreCard atsScore={atsScore} candidateType={candidateType} />
          )}

          {/* 2. Skills Comparison & Keyword Gaps */}
          {(flags.SHOW_SKILL_MATCH !== false || flags.SHOW_KEYWORD_ANALYSIS !== false) && skillComparison && (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              {/* Matching Skills */}
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
                      ? "Skills detected in your resume that directly align with the job description."
                      : "Core technical skills identified in your resume profile."}
                  </p>

                  {skillComparison.matching_skills && skillComparison.matching_skills.length > 0 ? (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {skillComparison.matching_skills.map((skill, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50/80 px-3 py-1.5 text-xs font-medium text-emerald-900"
                        >
                          <CheckCircleIcon />
                          {skill}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-4 text-xs italic text-slate-400">
                      No technical skills detected in the parsed text.
                    </p>
                  )}
                </div>
              )}

              {/* Missing / Weak Skills */}
              {flags.SHOW_SKILL_MATCH !== false && (
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
                      {result.job_description_provided ? "Important Keywords" : "Target JD Required"}
                    </span>
                  </div>
                  <p className="mt-2 text-xs leading-relaxed text-slate-500">
                    {result.job_description_provided
                      ? "Required in the job posting but not found in your resume."
                      : "Add a target job description to discover exact skill and keyword gaps."}
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
                      {result.job_description_provided
                        ? "Great job! All target job skills are represented."
                        : "No skill gaps found for general audit. Paste a JD for targeted gap analysis."}
                    </p>
                  )}

                  <div className="mt-4 rounded-xl bg-slate-50 p-3 text-2xs leading-relaxed text-slate-500 border border-slate-200/60">
                    <strong>Tip:</strong> Only add skills if you genuinely possess practical experience or are currently learning them.
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 3. Strengths & AI Actionable Recommendations */}
          {(flags.SHOW_RESUME_STRENGTHS !== false || flags.SHOW_AI_RECOMMENDATIONS !== false) && aiInsights && (
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

              {/* Actionable Recommendations */}
              {flags.SHOW_AI_RECOMMENDATIONS !== false && (
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs sm:p-7">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-100 text-indigo-800">
                      <TargetIcon />
                    </div>
                    <h3 className="text-base font-bold text-slate-900">
                      AI Recommendations
                    </h3>
                  </div>
                  <ul className="mt-4 space-y-3">
                    {aiInsights.recommendations?.map((rec, idx) => (
                      <li key={idx} className="flex items-start gap-2.5 text-sm leading-relaxed text-slate-700">
                        <span className="mt-1 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-2xs font-bold text-indigo-800">
                          {idx + 1}
                        </span>
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* 4. Conditional Professional Experience Section */}
          {flags.SHOW_EXPERIENCE_ANALYSIS !== false && (
            <ExperienceAnalysis experienceAnalysis={expAnalysis} />
          )}

          {/* 5. Projects & Education */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Projects Section */}
            {flags.SHOW_PROJECT_ANALYSIS !== false && (
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs sm:p-7">
                <h3 className="text-base font-bold text-slate-900">
                  Projects ({parsed.projects?.length || 0})
                </h3>
                {parsed.projects && parsed.projects.length > 0 ? (
                  <ul className="mt-4 space-y-3">
                    {parsed.projects.map((proj, idx) => (
                      <li
                        key={idx}
                        className="rounded-xl border border-slate-100 bg-slate-50/70 p-3.5 text-sm leading-relaxed text-slate-800"
                      >
                        {proj}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-3 text-xs italic text-slate-400">
                    No dedicated projects section detected.
                  </p>
                )}
              </div>
            )}

            {/* Education & Certifications */}
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
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                    Certifications ({parsed.certifications.length})
                  </h4>
                  <ul className="space-y-1.5 text-sm text-slate-700">
                    {parsed.certifications.map((cert, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-emerald-500 font-bold">✓</span>
                        <span>{cert}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

          {/* 6. Expandable Raw Text Viewer */}
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
