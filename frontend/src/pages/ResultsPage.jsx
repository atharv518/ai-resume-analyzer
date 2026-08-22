import React, { useState } from "react";
import Header from "../components/Header";
import ScoreCard from "../components/ScoreCard";
import ExperienceAnalysis from "../components/ExperienceAnalysis";

function getRelevanceBadge(score) {
  const normalized = (score || "").toLowerCase();
  if (normalized.includes("high")) {
    return {
      className: "bg-tertiary-container/30 text-tertiary-fixed-dim border-tertiary-fixed-dim/30",
      label: "High Relevance",
      icon: "stars",
    };
  }
  if (normalized.includes("medium")) {
    return {
      className: "bg-primary-container/30 text-inverse-primary border-inverse-primary/30",
      label: "Medium Relevance",
      icon: "verified",
    };
  }
  if (normalized.includes("low")) {
    return {
      className: "bg-[#78350f]/30 text-[#fde68a] border-[#fde68a]/30",
      label: "Low Relevance",
      icon: "info",
    };
  }
  return {
    className: "bg-error-container/20 text-error border-error/30",
    label: "Not Relevant",
    icon: "warning",
  };
}

function ResultsPage({ result, onBack }) {
  const [showRawText, setShowRawText] = useState(false);
  const [recsTab, setRecsTab] = useState("all"); // "all" | "high" | "medium" | "low" | "ats"
  const [copied, setCopied] = useState(false);

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
  const resumeStrengths = aiInsights.resume_strengths || [];
  const resumeWeaknesses = aiInsights.resume_weaknesses || [];
  const jdAlignment = aiInsights.jd_alignment || {};

  const isAiPowered = aiInsights.is_ai_powered === true;
  const aiProvider = aiInsights.provider_used || "deterministic";

  const handleCopyRawText = () => {
    if (result.extracted_text) {
      navigator.clipboard.writeText(result.extracted_text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="bg-on-surface text-inverse-on-surface min-h-screen flex flex-col antialiased">
      <Header />

      <main className="flex-1 pt-[88px] pb-xl px-md md:px-lg lg:px-container-padding mx-auto w-full max-w-7xl">
        {/* Sub-header Navigation & Status Row */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-lg gap-md">
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-sm text-secondary-fixed-dim hover:text-inverse-primary transition-colors font-body-md text-body-md group cursor-pointer self-start md:self-auto"
          >
            <span className="material-symbols-outlined group-hover:-translate-x-1 transition-transform">
              arrow_back
            </span>
            <span>Upload Another Resume</span>
          </button>

          <div className="flex flex-wrap items-center gap-sm">
            {/* AI Status Badge */}
            <span className="px-sm py-xs rounded-full bg-inverse-surface border border-outline-variant/30 text-inverse-primary font-label-md text-label-md flex items-center gap-xs">
              <span className="material-symbols-outlined text-[16px]">
                {isAiPowered ? "auto_awesome" : "bolt"}
              </span>
              <span>{isAiPowered ? `AI-Powered (${aiProvider.toUpperCase()})` : "Deterministic Engine"}</span>
            </span>

            {/* Candidate Type Badge */}
            <span className={`px-sm py-xs rounded-full border font-label-md text-label-md flex items-center gap-xs ${
              isFresher
                ? "bg-tertiary-container/30 text-tertiary-fixed-dim border-tertiary-fixed-dim/30"
                : "bg-primary-container/30 text-inverse-primary border-inverse-primary/30"
            }`}>
              <span className="material-symbols-outlined text-[16px]">person</span>
              <span>{isFresher ? "Early Career / Fresher" : "Experienced Professional"}</span>
            </span>

            {/* Target JD Badge */}
            <span className={`px-sm py-xs rounded-full border font-label-md text-label-md flex items-center gap-xs ${
              result.job_description_provided
                ? "bg-tertiary-container/30 text-tertiary-fixed-dim border-tertiary-fixed-dim/30"
                : "bg-[#78350f]/30 text-[#fde68a] border-[#fde68a]/30"
            }`}>
              <span className="material-symbols-outlined text-[16px]">
                {result.job_description_provided ? "check_circle" : "tune"}
              </span>
              <span>{result.job_description_provided ? "Target JD Evaluated" : "General Profile Audit"}</span>
            </span>
          </div>
        </div>

        {/* Dashboard 2-Column Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-lg">
          {/* LEFT COLUMN: Profile, ATS Score Card, Strengths & Gaps (4 cols) */}
          <div className="lg:col-span-4 flex flex-col gap-lg">
            {/* Section 1: Candidate Profile Card */}
            <div className="glass-card rounded-xl p-lg relative overflow-hidden group hover:-translate-y-1 transition-transform duration-300">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary-fixed-dim/10 rounded-bl-full -z-10 transition-transform group-hover:scale-110 pointer-events-none"></div>
              <span className="font-label-md text-label-md text-outline-variant uppercase tracking-wider block mb-xs">
                Candidate Profile
              </span>
              <h2 className="font-headline-md text-headline-md text-white mb-xs truncate" title={parsed.name || "Candidate Resume"}>
                {parsed.name || "Candidate Resume"}
              </h2>
              {aiInsights?.role_fit_summary && (
                <p className="font-body-md text-body-md text-secondary-fixed-dim mb-md leading-relaxed text-xs">
                  {aiInsights.role_fit_summary}
                </p>
              )}
              <div className="space-y-xs font-body-md text-body-md text-outline-variant text-xs pt-xs border-t border-outline-variant/15">
                <div className="flex items-center gap-sm">
                  <span className="material-symbols-outlined text-[16px] text-outline">mail</span>
                  {parsed.email ? (
                    <a href={`mailto:${parsed.email}`} className="text-inverse-primary hover:underline truncate">
                      {parsed.email}
                    </a>
                  ) : (
                    <span className="italic text-outline-variant/60">Not detected</span>
                  )}
                </div>
                <div className="flex items-center gap-sm">
                  <span className="material-symbols-outlined text-[16px] text-outline">phone</span>
                  <span>{parsed.phone || <span className="italic text-outline-variant/60">Not detected</span>}</span>
                </div>
                <div className="flex items-center gap-sm">
                  <span className="material-symbols-outlined text-[16px] text-outline">description</span>
                  <span className="truncate">{result.filename || "Resume"}</span>
                </div>
              </div>
            </div>

            {/* Section 2: ATS Compatibility Gauge & Category Bars */}
            {flags.SHOW_ATS_SCORE !== false && atsScore && (
              <ScoreCard atsScore={atsScore} candidateType={candidateType} />
            )}

            {/* Section 3: Quick Analysis — Strengths & Gaps */}
            {(flags.SHOW_RESUME_STRENGTHS !== false || resumeWeaknesses.length > 0) && (
              <div className="glass-card rounded-xl p-lg">
                <h3 className="font-title-lg text-title-lg text-white mb-md flex items-center gap-2">
                  <span className="material-symbols-outlined text-[20px] text-tertiary-fixed-dim">
                    checklist
                  </span>
                  <span>Quick Analysis</span>
                </h3>
                <div className="space-y-md">
                  {/* Strengths */}
                  <div>
                    <h4 className="font-label-md text-label-md text-tertiary-fixed-dim mb-sm uppercase tracking-wider flex items-center gap-xs">
                      <span className="material-symbols-outlined text-[16px]">thumb_up</span>
                      <span>Strengths ({resumeStrengths.length})</span>
                    </h4>
                    <ul className="space-y-sm">
                      {resumeStrengths.map((strength, idx) => (
                        <li key={idx} className="flex items-start gap-sm font-body-md text-body-md text-outline-variant text-xs leading-relaxed">
                          <span className="material-symbols-outlined text-[16px] text-tertiary-fixed-dim mt-[1px] shrink-0">
                            check
                          </span>
                          <span>{strength}</span>
                        </li>
                      ))}
                      {resumeStrengths.length === 0 && (
                        <li className="text-xs italic text-outline-variant/60">No specific strengths highlighted.</li>
                      )}
                    </ul>
                  </div>

                  <div className="h-px bg-outline-variant/20 w-full"></div>

                  {/* Gaps */}
                  <div>
                    <h4 className="font-label-md text-label-md text-error mb-sm uppercase tracking-wider flex items-center gap-xs">
                      <span className="material-symbols-outlined text-[16px]">warning</span>
                      <span>Gaps & Vulnerabilities ({resumeWeaknesses.length})</span>
                    </h4>
                    <ul className="space-y-sm">
                      {resumeWeaknesses.map((weakness, idx) => (
                        <li key={idx} className="flex items-start gap-sm font-body-md text-body-md text-outline-variant text-xs leading-relaxed">
                          <span className="material-symbols-outlined text-[16px] text-error mt-[1px] shrink-0">
                            priority_high
                          </span>
                          <span>{weakness}</span>
                        </li>
                      ))}
                      {resumeWeaknesses.length === 0 && (
                        <li className="text-xs italic text-outline-variant/60">No critical weaknesses detected.</li>
                      )}
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* RIGHT COLUMN: Insights, Skills, Projects, Recommendations, Experience, Education (8 cols) */}
          <div className="lg:col-span-8 flex flex-col gap-lg">
            {/* Section 4: AI Job Match Explanation */}
            {matchExplanation && (
              <div className="rounded-xl p-lg bg-inverse-surface border border-outline-variant/30 text-white shadow-md relative overflow-hidden">
                <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary/20 rounded-full blur-3xl pointer-events-none"></div>
                <div className="flex items-center gap-sm mb-md relative z-10">
                  <span className="material-symbols-outlined text-inverse-primary text-[24px]">
                    auto_awesome
                  </span>
                  <div>
                    <span className="font-label-md text-label-md text-inverse-primary uppercase tracking-wider block text-xs">
                      AI Job Match Explanation
                    </span>
                    <h3 className="font-headline-sm text-headline-sm text-white">
                      Why Your Resume {result.job_description_provided ? "Matches This Position" : "Matches Industry Benchmarks"}
                    </h3>
                  </div>
                </div>

                <p className="font-body-lg text-body-lg text-inverse-on-surface mb-md relative z-10 leading-relaxed text-sm bg-on-surface/40 p-md rounded-xl border border-outline-variant/20">
                  {matchExplanation.overview}
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-md relative z-10">
                  {/* Strongest Matches */}
                  <div className="rounded-lg bg-tertiary-container/10 border border-tertiary-fixed-dim/20 p-md">
                    <h4 className="font-label-md text-label-md text-tertiary-fixed-dim uppercase tracking-wider mb-sm flex items-center gap-1">
                      <span className="material-symbols-outlined text-[16px]">check_circle</span>
                      <span>Strongest Match Areas</span>
                    </h4>
                    <ul className="space-y-1.5">
                      {matchExplanation.strongest_match_areas?.map((item, idx) => (
                        <li key={idx} className="flex items-start gap-1.5 text-xs text-inverse-on-surface">
                          <span className="text-tertiary-fixed-dim font-bold">✓</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Biggest Gaps */}
                  <div className="rounded-lg bg-[#78350f]/20 border border-[#fde68a]/20 p-md">
                    <h4 className="font-label-md text-label-md text-[#fde68a] uppercase tracking-wider mb-sm flex items-center gap-1">
                      <span className="material-symbols-outlined text-[16px]">flag</span>
                      <span>Missing Requirements</span>
                    </h4>
                    <ul className="space-y-1.5">
                      {matchExplanation.biggest_gaps?.map((item, idx) => (
                        <li key={idx} className="flex items-start gap-1.5 text-xs text-inverse-on-surface">
                          <span className="text-[#fde68a] font-bold">!</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Alignment Tags */}
                {result.job_description_provided && (jdAlignment.experience_alignment || jdAlignment.education_alignment) && (
                  <div className="mt-md pt-sm border-t border-outline-variant/20 flex flex-wrap gap-sm relative z-10">
                    {jdAlignment.experience_alignment && (
                      <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-md bg-surface-variant/10 border border-outline-variant/20 text-outline-variant">
                        <strong className="text-inverse-primary">Experience:</strong> {jdAlignment.experience_alignment}
                      </span>
                    )}
                    {jdAlignment.education_alignment && (
                      <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-md bg-surface-variant/10 border border-outline-variant/20 text-outline-variant">
                        <strong className="text-inverse-primary">Education:</strong> {jdAlignment.education_alignment}
                      </span>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Section 5: Skills Comparison Grid (Matched & Missing) */}
            {(flags.SHOW_SKILL_MATCH !== false || flags.SHOW_KEYWORD_ANALYSIS !== false) && skillComparison && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
                {/* Matched Skills */}
                <div className="glass-card rounded-xl p-lg border-l-4 border-tertiary-fixed-dim flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-sm">
                      <h4 className="font-title-lg text-title-lg text-white flex items-center gap-xs">
                        <span className="material-symbols-outlined text-tertiary-fixed-dim">verified</span>
                        <span>{result.job_description_provided ? "Matched Skills" : "Identified Skills"} ({skillComparison.matching_skills?.length || 0})</span>
                      </h4>
                      {result.job_description_provided && (
                        <span className="px-2 py-0.5 rounded-full bg-tertiary-container/30 text-tertiary-fixed-dim border border-tertiary-fixed-dim/30 font-label-md text-label-md text-xs">
                          {skillComparison.skill_match_percentage}% match
                        </span>
                      )}
                    </div>
                    <p className="font-body-md text-body-md text-outline-variant text-xs mb-md">
                      {result.job_description_provided
                        ? "Detected in your resume and matching the job requirements."
                        : "Technical and domain skills detected on your resume."}
                    </p>
                    <div className="flex flex-wrap gap-xs">
                      {skillComparison.matching_skills?.map((skill, idx) => {
                        const synonymInfo = skillComparison.synonym_matches?.[skill];
                        return (
                          <span
                            key={idx}
                            title={synonymInfo ? `Recognized via alias: ${synonymInfo}` : ""}
                            className="px-sm py-xs bg-tertiary-container/30 text-tertiary-fixed-dim rounded-md font-label-md text-label-md border border-tertiary-fixed-dim/30 flex items-center gap-1"
                          >
                            <span>{skill}</span>
                            {synonymInfo && (
                              <span className="text-[10px] text-tertiary-fixed px-1 rounded bg-tertiary-container/50">
                                alias
                              </span>
                            )}
                          </span>
                        );
                      })}
                      {(!skillComparison.matching_skills || skillComparison.matching_skills.length === 0) && (
                        <span className="text-xs text-outline-variant/60 italic">No skills detected.</span>
                      )}
                    </div>
                  </div>

                  {/* Categorized Skills Breakdown */}
                  {skillComparison.categorized_skills && Object.keys(skillComparison.categorized_skills).length > 0 && (
                    <div className="mt-md pt-sm border-t border-outline-variant/15 space-y-1.5">
                      <h5 className="font-label-md text-label-md text-outline-variant uppercase text-xs">Categories</h5>
                      <div className="space-y-1">
                        {Object.entries(skillComparison.categorized_skills).slice(0, 3).map(([cat, sks], cIdx) => (
                          <div key={cIdx} className="text-xs text-outline-variant">
                            <strong className="text-white">{cat}:</strong> {sks.join(", ")}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Missing Skills (or Domain Keywords in general audit) */}
                {result.job_description_provided ? (
                  <div className="glass-card rounded-xl p-lg border-l-4 border-[#fbbf24] flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-sm">
                        <h4 className="font-title-lg text-title-lg text-white flex items-center gap-xs">
                          <span className="material-symbols-outlined text-[#fbbf24]">search</span>
                          <span>Missing Skills ({skillComparison.missing_skills?.length || 0})</span>
                        </h4>
                        <span className="px-2 py-0.5 rounded-full bg-[#78350f]/30 text-[#fde68a] border border-[#fde68a]/30 font-label-md text-label-md text-xs">
                          Required
                        </span>
                      </div>
                      <p className="font-body-md text-body-md text-outline-variant text-xs mb-md">
                        Required in the job description but missing from your resume.
                      </p>
                      <div className="flex flex-wrap gap-xs">
                        {skillComparison.missing_skills?.map((skill, idx) => (
                          <span
                            key={idx}
                            className="px-sm py-xs bg-[#78350f]/30 text-[#fde68a] rounded-md font-label-md text-label-md border border-[#fde68a]/30"
                          >
                            {skill}
                          </span>
                        ))}
                        {(!skillComparison.missing_skills || skillComparison.missing_skills.length === 0) && (
                          <span className="text-xs text-tertiary-fixed-dim font-medium">All target job skills present!</span>
                        )}
                      </div>
                    </div>

                    <div className="mt-md pt-sm border-t border-outline-variant/15">
                      <p className="text-[11px] text-[#fde68a]/90 leading-tight">
                        <strong>Ethical ATS Tip:</strong> If you have hands-on experience with these skills, add them naturally into your bullet points.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="glass-card rounded-xl p-lg border-l-4 border-inverse-primary flex flex-col justify-between">
                    <div>
                      <h4 className="font-title-lg text-title-lg text-white mb-sm flex items-center gap-xs">
                        <span className="material-symbols-outlined text-inverse-primary">label</span>
                        <span>Identified Domain Keywords ({skillComparison.matching_keywords?.length || 0})</span>
                      </h4>
                      <p className="font-body-md text-body-md text-outline-variant text-xs mb-md">
                        Key industry terminologies and concepts found in your text.
                      </p>
                      <div className="flex flex-wrap gap-xs">
                        {skillComparison.matching_keywords?.map((kw, idx) => (
                          <span
                            key={idx}
                            className="px-sm py-xs bg-inverse-primary/10 text-inverse-primary rounded-md font-label-md text-label-md border border-inverse-primary/20"
                          >
                            {kw}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Section 6: AI Project Relevance Analysis (USER REQUESTED FEATURE) */}
            {flags.SHOW_PROJECT_ANALYSIS !== false && projectEvals.length > 0 && (
              <div className="glass-card rounded-xl p-lg">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-md">
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-lg bg-inverse-primary/20 border border-inverse-primary/30 flex items-center justify-center text-inverse-primary">
                      <span className="material-symbols-outlined text-[20px]">folder_special</span>
                    </div>
                    <div>
                      <h3 className="font-title-lg text-title-lg text-white">
                        AI Project Relevance Analysis ({projectEvals.length})
                      </h3>
                      <p className="font-body-md text-body-md text-outline-variant text-xs">
                        Evaluating practical alignment, tech stack depth, and business impact.
                      </p>
                    </div>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full bg-inverse-surface border border-outline-variant/30 text-secondary-fixed-dim font-label-md text-label-md text-xs self-start sm:self-auto">
                    {result.job_description_provided ? "Role-Specific Fit" : "Technical Merit"}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
                  {projectEvals.map((proj, pIdx) => {
                    const badge = getRelevanceBadge(proj.relevance_score);
                    return (
                      <div
                        key={pIdx}
                        className="rounded-xl bg-surface-variant/5 border border-outline-variant/20 p-md flex flex-col justify-between hover:border-inverse-primary/40 transition-colors"
                      >
                        <div>
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <h4 className="font-title-lg text-title-lg text-white text-sm font-semibold truncate" title={proj.project_title}>
                              {proj.project_title}
                            </h4>
                            <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold border flex items-center gap-1 shrink-0 ${badge.className}`}>
                              <span className="material-symbols-outlined text-[13px]">{badge.icon}</span>
                              <span>{badge.label}</span>
                            </span>
                          </div>

                          {/* Technologies */}
                          {proj.technologies_detected && proj.technologies_detected.length > 0 && (
                            <div className="flex flex-wrap gap-1 mb-2.5">
                              {proj.technologies_detected.map((t, tIdx) => (
                                <span
                                  key={tIdx}
                                  className="px-1.5 py-0.5 bg-inverse-surface/80 text-secondary-fixed-dim rounded text-[11px] border border-outline-variant/20"
                                >
                                  {t}
                                </span>
                              ))}
                            </div>
                          )}

                          {/* Why it's relevant */}
                          {proj.relevance_explanation && (
                            <p className="font-body-md text-body-md text-outline-variant text-xs leading-relaxed mb-3">
                              <strong className="text-white">Why Relevant:</strong> {proj.relevance_explanation}
                            </p>
                          )}
                        </div>

                        {/* Optimization Suggestion */}
                        {proj.improvement_suggestions && (
                          <div className="rounded-lg bg-inverse-primary/10 border border-inverse-primary/20 p-sm text-xs text-inverse-primary leading-relaxed">
                            <strong className="text-white flex items-center gap-1 mb-0.5">
                              <span className="material-symbols-outlined text-[14px]">lightbulb</span> Optimization Tip:
                            </strong>
                            <span>{proj.improvement_suggestions}</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Section 7: Prioritized Recommendations Hub with Interactive Tabs */}
            {flags.SHOW_AI_RECOMMENDATIONS !== false && (
              <div className="glass-card rounded-xl p-lg">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-md mb-md">
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-lg bg-inverse-primary/20 border border-inverse-primary/30 flex items-center justify-center text-inverse-primary">
                      <span className="material-symbols-outlined text-[20px]">target</span>
                    </div>
                    <div>
                      <h3 className="font-title-lg text-title-lg text-white">
                        Prioritized AI Recommendations
                      </h3>
                      <p className="font-body-md text-body-md text-outline-variant text-xs">
                        Actionable steps ordered by impact on your parse score and recruiter impression.
                      </p>
                    </div>
                  </div>

                  {/* Tab Selector */}
                  <div className="flex flex-wrap gap-1 bg-inverse-surface p-1 rounded-xl border border-outline-variant/20 self-start sm:self-auto">
                    <button
                      type="button"
                      onClick={() => setRecsTab("all")}
                      className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all ${
                        recsTab === "all"
                          ? "bg-inverse-primary text-on-primary-container shadow-sm"
                          : "text-secondary-fixed-dim hover:text-white"
                      }`}
                    >
                      All
                    </button>
                    <button
                      type="button"
                      onClick={() => setRecsTab("high")}
                      className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all ${
                        recsTab === "high"
                          ? "bg-error text-white shadow-sm"
                          : "text-secondary-fixed-dim hover:text-white"
                      }`}
                    >
                      High ({prioritizedRecs.high_priority?.length || 0})
                    </button>
                    <button
                      type="button"
                      onClick={() => setRecsTab("medium")}
                      className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all ${
                        recsTab === "medium"
                          ? "bg-[#fde68a] text-[#78350f] shadow-sm"
                          : "text-secondary-fixed-dim hover:text-white"
                      }`}
                    >
                      Medium ({prioritizedRecs.medium_priority?.length || 0})
                    </button>
                    <button
                      type="button"
                      onClick={() => setRecsTab("low")}
                      className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all ${
                        recsTab === "low"
                          ? "bg-tertiary-fixed-dim text-on-tertiary-fixed shadow-sm"
                          : "text-secondary-fixed-dim hover:text-white"
                      }`}
                    >
                      Low ({prioritizedRecs.low_priority?.length || 0})
                    </button>
                    {atsTips.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setRecsTab("ats")}
                        className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all ${
                          recsTab === "ats"
                            ? "bg-primary-container text-white shadow-sm"
                            : "text-secondary-fixed-dim hover:text-white"
                        }`}
                      >
                        ATS Tips ({atsTips.length})
                      </button>
                    )}
                  </div>
                </div>

                <div className="space-y-sm">
                  {/* High Priority */}
                  {(recsTab === "all" || recsTab === "high") && prioritizedRecs.high_priority?.length > 0 && (
                    <div className="space-y-1.5">
                      <h4 className="font-label-md text-label-md text-error uppercase tracking-wider text-xs flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px]">error</span>
                        <span>High Priority (Immediate ATS Impact)</span>
                      </h4>
                      {prioritizedRecs.high_priority.map((rec, idx) => (
                        <div
                          key={idx}
                          className="flex items-start gap-2.5 rounded-lg bg-error-container/10 border border-error/20 p-sm text-xs text-inverse-on-surface leading-relaxed"
                        >
                          <span className="w-5 h-5 rounded-full bg-error/20 text-error flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">
                            {idx + 1}
                          </span>
                          <span>{rec}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Medium Priority */}
                  {(recsTab === "all" || recsTab === "medium") && prioritizedRecs.medium_priority?.length > 0 && (
                    <div className="space-y-1.5 mt-sm">
                      <h4 className="font-label-md text-label-md text-[#fde68a] uppercase tracking-wider text-xs flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px]">warning</span>
                        <span>Medium Priority (Content & Phrasing)</span>
                      </h4>
                      {prioritizedRecs.medium_priority.map((rec, idx) => (
                        <div
                          key={idx}
                          className="flex items-start gap-2.5 rounded-lg bg-[#78350f]/15 border border-[#fde68a]/20 p-sm text-xs text-inverse-on-surface leading-relaxed"
                        >
                          <span className="w-5 h-5 rounded-full bg-[#fde68a]/20 text-[#fde68a] flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">
                            {idx + 1}
                          </span>
                          <span>{rec}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Low Priority */}
                  {(recsTab === "all" || recsTab === "low") && prioritizedRecs.low_priority?.length > 0 && (
                    <div className="space-y-1.5 mt-sm">
                      <h4 className="font-label-md text-label-md text-tertiary-fixed-dim uppercase tracking-wider text-xs flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px]">check_circle</span>
                        <span>Low Priority (Polishing & Formatting)</span>
                      </h4>
                      {prioritizedRecs.low_priority.map((rec, idx) => (
                        <div
                          key={idx}
                          className="flex items-start gap-2.5 rounded-lg bg-tertiary-container/10 border border-tertiary-fixed-dim/20 p-sm text-xs text-inverse-on-surface leading-relaxed"
                        >
                          <span className="w-5 h-5 rounded-full bg-tertiary-fixed-dim/20 text-tertiary-fixed-dim flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">
                            {idx + 1}
                          </span>
                          <span>{rec}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* ATS Tips */}
                  {(recsTab === "all" || recsTab === "ats") && atsTips.length > 0 && (
                    <div className="space-y-1.5 mt-sm">
                      <h4 className="font-label-md text-label-md text-inverse-primary uppercase tracking-wider text-xs flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px]">lightbulb</span>
                        <span>ATS Optimization Best Practices</span>
                      </h4>
                      {atsTips.map((tip, idx) => (
                        <div
                          key={idx}
                          className="flex items-start gap-2.5 rounded-lg bg-inverse-primary/10 border border-inverse-primary/20 p-sm text-xs text-inverse-on-surface leading-relaxed"
                        >
                          <span className="material-symbols-outlined text-inverse-primary text-[18px] shrink-0 mt-0.5">
                            tips_and_updates
                          </span>
                          <span>{tip}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Section 8: Professional Experience Analysis */}
            {flags.SHOW_EXPERIENCE_ANALYSIS !== false && (
              <ExperienceAnalysis experienceAnalysis={expAnalysis} />
            )}

            {/* Section 9: Education & Certifications */}
            <div className="glass-card rounded-xl p-lg space-y-md">
              <div>
                <h3 className="font-title-lg text-title-lg text-white mb-sm flex items-center gap-2">
                  <span className="material-symbols-outlined text-[20px] text-tertiary-fixed-dim">
                    school
                  </span>
                  <span>Education ({parsed.education?.length || 0})</span>
                </h3>
                {parsed.education && parsed.education.length > 0 ? (
                  <ul className="space-y-sm">
                    {parsed.education.map((edu, idx) => (
                      <li key={idx} className="rounded-lg bg-surface-variant/5 border border-outline-variant/20 p-sm text-xs text-inverse-on-surface leading-relaxed flex items-start gap-2">
                        <span className="material-symbols-outlined text-[16px] text-outline-variant mt-0.5">account_balance</span>
                        <span>{edu}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs italic text-outline-variant/60">No formal education detected.</p>
                )}
              </div>

              {parsed.certifications && parsed.certifications.length > 0 && (
                <div className="pt-md border-t border-outline-variant/15">
                  <h3 className="font-title-lg text-title-lg text-white mb-sm flex items-center gap-2">
                    <span className="material-symbols-outlined text-[20px] text-inverse-primary">
                      verified_user
                    </span>
                    <span>Certifications ({parsed.certifications.length})</span>
                  </h3>
                  <ul className="space-y-sm">
                    {parsed.certifications.map((cert, idx) => {
                      const certStr = typeof cert === "string" ? cert : (cert.title || "");
                      const parts = certStr.split("\n");
                      const title = parts[0].trim();
                      const desc = parts.slice(1).join(" ").trim();
                      return (
                        <li key={idx} className="rounded-lg bg-surface-variant/5 border border-outline-variant/20 p-sm text-xs text-inverse-on-surface leading-relaxed">
                          <div className="font-semibold text-white">{title}</div>
                          {desc && <p className="text-outline-variant text-[11px] mt-0.5">{desc}</p>}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
            </div>

            {/* Section 10: Extracted Plain Text Viewer */}
            <div className="glass-card rounded-xl p-lg">
              <div className="flex items-center justify-between mb-sm">
                <div>
                  <h3 className="font-title-lg text-title-lg text-white flex items-center gap-2">
                    <span className="material-symbols-outlined text-[20px] text-outline">
                      raw_on
                    </span>
                    <span>Extracted Resume Plaintext</span>
                  </h3>
                  <p className="font-body-md text-body-md text-outline-variant text-xs">
                    Inspect the OCR/parser plain text used for scoring.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {showRawText && (
                    <button
                      type="button"
                      onClick={handleCopyRawText}
                      className="px-3 py-1.5 rounded-lg border border-outline-variant/30 bg-surface-variant/10 text-xs font-semibold text-inverse-primary hover:bg-surface-variant/20 transition-all flex items-center gap-1"
                    >
                      <span className="material-symbols-outlined text-[14px]">
                        {copied ? "check" : "content_copy"}
                      </span>
                      <span>{copied ? "Copied!" : "Copy"}</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setShowRawText(!showRawText)}
                    className="px-3 py-1.5 rounded-lg border border-outline-variant/30 bg-surface-variant/10 text-xs font-semibold text-inverse-on-surface hover:bg-surface-variant/20 transition-all"
                  >
                    {showRawText ? "Hide Plaintext" : "Show Plaintext"}
                  </button>
                </div>
              </div>

              {showRawText && (
                <div className="mt-md">
                  <pre className="max-h-80 overflow-y-auto whitespace-pre-wrap rounded-xl bg-on-surface/90 border border-outline-variant/20 p-md font-mono text-xs leading-relaxed text-inverse-on-surface/80">
                    {result.extracted_text || "No text extracted."}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default ResultsPage;
