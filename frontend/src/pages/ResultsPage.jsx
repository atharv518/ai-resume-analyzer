import React, { useState, useMemo } from "react";
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

function processProjects(parsedProjects = [], parsedStructuredProjects = [], projectEvals = []) {
  const allProjects = [];
  const evalMap = new Map();

  projectEvals.forEach((p) => {
    const title = (p.project_title || p.project_name || p.title || "").toLowerCase().trim();
    if (title) evalMap.set(title, p);
  });

  // Prefer structured projects from backend parser (supports up to 10)
  if (parsedStructuredProjects && parsedStructuredProjects.length > 0) {
    parsedStructuredProjects.slice(0, 10).forEach((item, idx) => {
      const title = item.title || `Project ${idx + 1}`;
      const desc = item.description || "";
      const technologies = item.technologies || [];
      const isOngoing = item.is_ongoing === true;
      const matchingEval = evalMap.get(title.toLowerCase());

      allProjects.push({
        title,
        description: desc,
        technologies,
        isOngoing,
        eval: matchingEval,
        rawText: `${title} ${desc}`,
      });
    });
  } else if (parsedProjects && parsedProjects.length > 0) {
    // Fallback: parse string array candidates up to 10
    const rawItems = [];
    parsedProjects.forEach((item) => {
      const isObj = typeof item === "object" && item !== null;
      const str = isObj ? `${item.title || ""} – ${item.description || ""}` : String(item);
      const segments = str.split(/(?<=[.!?])\s+(?=[A-Z][A-Za-z0-9\s/&+\-]{2,45}\s+(?:[–—\-|:]|\([A-Za-z0-9,\s+]+\))\s+)/);
      segments.forEach((seg) => {
        if (seg.trim().length > 2) rawItems.push(seg.trim());
      });
    });

    rawItems.slice(0, 10).forEach((rawText, idx) => {
      let title = `Project ${idx + 1}`;
      let desc = "";

      let separated = false;
      for (const sep of [" – ", " — ", " | ", ": ", " - "]) {
        if (rawText.includes(sep)) {
          const parts = rawText.split(sep);
          const potentialTitle = parts[0].trim();
          if (potentialTitle.length <= 60) {
            title = potentialTitle;
            desc = parts.slice(1).join(sep).trim();
            separated = true;
            break;
          }
        }
      }

      if (!separated) {
        const lines = rawText.split("\n");
        title = lines[0].trim();
        desc = lines.slice(1).join(" ").trim();
      }

      const isOngoing =
        /\b(?:ongoing|in\s*[-–—]?\s*progress|currently\s+working\s+on|under\s+development|continuing)\b/i.test(rawText) ||
        /\((?:ongoing|current|present|in\s*progress)\)/i.test(rawText) ||
        /\b(?:(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s*)?(?:19|20)\d{2}\s*[\-\–\—\to]\s*(?:present|current)\b/i.test(rawText);

      const matchingEval = evalMap.get(title.toLowerCase()) || projectEvals[idx];
      const technologies =
        matchingEval?.technologies_detected ||
        matchingEval?.technologies ||
        [];

      allProjects.push({
        title,
        description: desc || matchingEval?.relevance_explanation || "",
        technologies,
        isOngoing,
        eval: matchingEval,
        rawText,
      });
    });
  } else if (projectEvals && projectEvals.length > 0) {
    projectEvals.slice(0, 3).forEach((evalItem, idx) => {
      const title = evalItem.project_title || evalItem.project_name || evalItem.title || `Project ${idx + 1}`;
      const rawText = `${title} ${evalItem.relevance_explanation || ""} ${evalItem.improvement_suggestions || ""}`;
      const isOngoing =
        /\b(?:ongoing|in\s*[-–—]?\s*progress|currently\s+working\s+on|under\s+development|continuing)\b/i.test(rawText) ||
        /\((?:ongoing|current|present|in\s*progress)\)/i.test(rawText);

      allProjects.push({
        title,
        description: evalItem.relevance_explanation || "",
        technologies: evalItem.technologies_detected || evalItem.technologies || [],
        isOngoing,
        eval: evalItem,
        rawText,
      });
    });
  }

  const ongoingProjects = allProjects.filter((p) => p.isOngoing);
  const completedProjects = allProjects.filter((p) => !p.isOngoing);

  return {
    allProjects: allProjects.slice(0, 10),
    ongoingProjects: ongoingProjects.slice(0, 10),
    completedProjects: completedProjects.slice(0, 10),
    hasOngoing: ongoingProjects.length > 0,
  };
}

function ResultsPage({ result, onBack }) {
  const [showRawText, setShowRawText] = useState(false);
  const [recsTab, setRecsTab] = useState("all"); // "all" | "high" | "medium" | "low" | "ats"
  const [projectsTab, setProjectsTab] = useState("all"); // "all" | "completed" | "ongoing"
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
  const projectEvals = (aiInsights.project_evaluations || []).slice(0, 3); // Max 3 AI project relevance analyses
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
    <div className="bg-on-surface text-inverse-on-surface min-h-screen flex flex-col antialiased">
      <Header />

      <main className="flex-1 pt-16 sm:pt-20 pb-8 sm:pb-12 px-3 sm:px-6 lg:px-8 mx-auto w-full max-w-7xl">
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

        {/* Dashboard Responsive Masonry Container
            Mobile: Single column strictly in exact 1..12 DOM order
            Desktop / Tablet: Compact 2-column masonry grid packing without vertical row gaps
        */}
        <div className="columns-1 lg:columns-2 gap-4 sm:gap-6 [column-fill:_balance]">
          
          {/* SECTION 1: Candidate Profile Card (Mobile: 1) */}
          <div className="break-inside-avoid mb-4 sm:mb-6 w-full inline-block glass-card rounded-xl p-4 sm:p-5 relative overflow-hidden group hover:-translate-y-0.5 transition-transform duration-300">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary-fixed-dim/10 rounded-bl-full -z-10 transition-transform group-hover:scale-110 pointer-events-none"></div>
            <span className="text-[11px] font-semibold text-outline-variant uppercase tracking-wider block mb-1">
              Candidate Profile
            </span>
            <h2 className="text-lg sm:text-xl font-bold text-white mb-1 truncate" title={parsed.name || "Candidate Resume"}>
              {parsed.name || "Candidate Resume"}
            </h2>
            {aiInsights?.role_fit_summary && (
              <p className="text-xs text-secondary-fixed-dim mb-3 leading-relaxed">
                {aiInsights.role_fit_summary}
              </p>
            )}
            <div className="space-y-1 text-xs text-outline-variant pt-2 border-t border-outline-variant/15">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[15px] text-outline">mail</span>
                {parsed.email ? (
                  <a href={`mailto:${parsed.email}`} className="text-inverse-primary hover:underline truncate">
                    {parsed.email}
                  </a>
                ) : (
                  <span className="italic text-outline-variant/60">Not detected</span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[15px] text-outline">phone</span>
                <span>{parsed.phone || <span className="italic text-outline-variant/60">Not detected</span>}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[15px] text-outline">description</span>
                <span className="truncate">{result.filename || "Resume"}</span>
              </div>
            </div>
          </div>

          {/* SECTION 2: ATS Compatibility Gauge & Breakdown (Mobile: 2) */}
          {flags.SHOW_ATS_SCORE !== false && atsScore && (
            <div className="break-inside-avoid mb-4 sm:mb-6 w-full inline-block">
              <ScoreCard atsScore={atsScore} candidateType={candidateType} />
            </div>
          )}

          {/* SECTION 3: AI Job Match Explanation (Mobile: 3) */}
          {matchExplanation && (
            <div className="break-inside-avoid mb-4 sm:mb-6 w-full inline-block rounded-xl p-4 sm:p-6 bg-inverse-surface border border-outline-variant/30 text-white shadow-md relative overflow-hidden">
              <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary/20 rounded-full blur-3xl pointer-events-none"></div>
              <div className="flex items-center gap-2.5 mb-3 relative z-10">
                <span className="material-symbols-outlined text-inverse-primary text-[22px]">
                  auto_awesome
                </span>
                <div>
                  <span className="text-[11px] font-semibold text-inverse-primary uppercase tracking-wider block">
                    AI Job Match Explanation
                  </span>
                  <h3 className="text-sm sm:text-base font-bold text-white">
                    Why Your Resume {result.job_description_provided ? "Matches This Position" : "Matches Industry Benchmarks"}
                  </h3>
                </div>
              </div>

              <p className="text-xs sm:text-sm text-inverse-on-surface mb-3 relative z-10 leading-relaxed bg-on-surface/40 p-3 rounded-xl border border-outline-variant/20">
                {matchExplanation.overview}
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 relative z-10">
                {/* Strongest Matches */}
                <div className="rounded-lg bg-tertiary-container/10 border border-tertiary-fixed-dim/20 p-3">
                  <h4 className="text-xs font-semibold text-tertiary-fixed-dim uppercase tracking-wider mb-1.5 flex items-center gap-1">
                    <span className="material-symbols-outlined text-[15px]">check_circle</span>
                    <span>Strongest Match Areas</span>
                  </h4>
                  <ul className="space-y-1">
                    {matchExplanation.strongest_match_areas?.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-1.5 text-xs text-inverse-on-surface">
                        <span className="text-tertiary-fixed-dim font-bold">✓</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Missing Requirements */}
                <div className="rounded-lg bg-[#78350f]/20 border border-[#fde68a]/20 p-3">
                  <h4 className="text-xs font-semibold text-[#fde68a] uppercase tracking-wider mb-1.5 flex items-center gap-1">
                    <span className="material-symbols-outlined text-[15px]">flag</span>
                    <span>Missing Requirements</span>
                  </h4>
                  <ul className="space-y-1">
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
                <div className="mt-3 pt-2.5 border-t border-outline-variant/20 flex flex-wrap gap-2 relative z-10">
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

          {/* SECTION 4: Quick Analysis — Strengths & Gaps (Mobile: 4) */}
          {(flags.SHOW_RESUME_STRENGTHS !== false || resumeWeaknesses.length > 0) && (
            <div className="break-inside-avoid mb-4 sm:mb-6 w-full inline-block glass-card rounded-xl p-4 sm:p-5">
              <h3 className="text-sm sm:text-base font-semibold text-white mb-3 flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px] text-tertiary-fixed-dim">
                  checklist
                </span>
                <span>Quick Analysis</span>
              </h3>
              <div className="space-y-3">
                {/* Strengths */}
                <div>
                  <h4 className="text-xs font-semibold text-tertiary-fixed-dim mb-1.5 uppercase tracking-wider flex items-center gap-1">
                    <span className="material-symbols-outlined text-[15px]">thumb_up</span>
                    <span>Strengths ({resumeStrengths.length})</span>
                  </h4>
                  <ul className="space-y-1.5">
                    {resumeStrengths.map((strength, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-xs text-outline-variant leading-relaxed">
                        <span className="material-symbols-outlined text-[15px] text-tertiary-fixed-dim mt-[1px] shrink-0">
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
                  <h4 className="text-xs font-semibold text-error mb-1.5 uppercase tracking-wider flex items-center gap-1">
                    <span className="material-symbols-outlined text-[15px]">warning</span>
                    <span>Gaps & Vulnerabilities ({resumeWeaknesses.length})</span>
                  </h4>
                  <ul className="space-y-1.5">
                    {resumeWeaknesses.map((weakness, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-xs text-outline-variant leading-relaxed">
                        <span className="material-symbols-outlined text-[15px] text-error mt-[1px] shrink-0">
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

          {/* SECTION 5 & 6: Skills Comparison Cards (Mobile: 5 & 6) */}
          {(flags.SHOW_SKILL_MATCH !== false || flags.SHOW_KEYWORD_ANALYSIS !== false) && skillComparison && (
            <div className="break-inside-avoid mb-4 sm:mb-6 w-full inline-block">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                {/* SECTION 5: Matched / Identified Skills */}
                <div className="glass-card rounded-xl p-4 sm:p-5 border-l-4 border-tertiary-fixed-dim flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-semibold text-white flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[18px] text-tertiary-fixed-dim">verified</span>
                        <span>{result.job_description_provided ? "Matched Skills" : "Identified Skills"} ({skillComparison.matching_skills?.length || 0})</span>
                      </h4>
                      {result.job_description_provided && (
                        <span className="px-2 py-0.5 rounded-full bg-tertiary-container/30 text-tertiary-fixed-dim border border-tertiary-fixed-dim/30 text-xs font-semibold">
                          {skillComparison.skill_match_percentage}% match
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-outline-variant mb-3">
                      {result.job_description_provided
                        ? "Detected in resume matching target job."
                        : "Technical and domain skills detected."}
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {skillComparison.matching_skills?.map((skill, idx) => {
                        const synonymInfo = skillComparison.synonym_matches?.[skill];
                        return (
                          <span
                            key={idx}
                            title={synonymInfo ? `Recognized via alias: ${synonymInfo}` : ""}
                            className="px-2 py-1 bg-tertiary-container/30 text-tertiary-fixed-dim rounded-md text-xs font-medium border border-tertiary-fixed-dim/30 flex items-center gap-1"
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

                  {skillComparison.categorized_skills && Object.keys(skillComparison.categorized_skills).length > 0 && (
                    <div className="mt-3 pt-2.5 border-t border-outline-variant/15 space-y-1">
                      <h5 className="text-[11px] font-semibold text-outline-variant uppercase">Categories</h5>
                      <div className="space-y-0.5">
                        {Object.entries(skillComparison.categorized_skills).slice(0, 3).map(([cat, sks], cIdx) => (
                          <div key={cIdx} className="text-xs text-outline-variant">
                            <strong className="text-white">{cat}:</strong> {sks.join(", ")}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* SECTION 6: Identified Domain Keywords / Missing Skills */}
                {result.job_description_provided ? (
                  <div className="glass-card rounded-xl p-4 sm:p-5 border-l-4 border-[#fbbf24] flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm font-semibold text-white flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-[18px] text-[#fbbf24]">search</span>
                          <span>Missing Skills ({skillComparison.missing_skills?.length || 0})</span>
                        </h4>
                        <span className="px-2 py-0.5 rounded-full bg-[#78350f]/30 text-[#fde68a] border border-[#fde68a]/30 text-xs font-semibold">
                          Required
                        </span>
                      </div>
                      <p className="text-xs text-outline-variant mb-3">
                        Required in job description but missing.
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {skillComparison.missing_skills?.map((skill, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-1 bg-[#78350f]/30 text-[#fde68a] rounded-md text-xs font-medium border border-[#fde68a]/30"
                          >
                            {skill}
                          </span>
                        ))}
                        {(!skillComparison.missing_skills || skillComparison.missing_skills.length === 0) && (
                          <span className="text-xs text-tertiary-fixed-dim font-medium">All target job skills present!</span>
                        )}
                      </div>
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-outline-variant/15">
                      <p className="text-[11px] text-[#fde68a]/90 leading-tight">
                        <strong>ATS Tip:</strong> If experienced with these, add them into your bullet points naturally.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="glass-card rounded-xl p-4 sm:p-5 border-l-4 border-inverse-primary flex flex-col justify-between">
                    <div>
                      <h4 className="text-sm font-semibold text-white mb-2 flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[18px] text-inverse-primary">label</span>
                        <span>Identified Domain Keywords ({skillComparison.matching_keywords?.length || 0})</span>
                      </h4>
                      <p className="text-xs text-outline-variant mb-3">
                        Key industry terminologies and concepts.
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {skillComparison.matching_keywords?.map((kw, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-1 bg-inverse-primary/10 text-inverse-primary rounded-md text-xs font-medium border border-inverse-primary/20"
                          >
                            {kw}
                          </span>
                        ))}
                        {(!skillComparison.matching_keywords || skillComparison.matching_keywords.length === 0) && (
                          <span className="text-xs text-outline-variant/60 italic">No domain keywords detected.</span>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* SECTION 7: Professional & Internship Experience (Mobile: 7) */}
          {flags.SHOW_EXPERIENCE_ANALYSIS !== false && (
            <div className="break-inside-avoid mb-4 sm:mb-6 w-full inline-block">
              <ExperienceAnalysis experienceAnalysis={expAnalysis} />
            </div>
          )}

          {/* SECTION 8: Education & Certifications (Mobile: 8) */}
          <div className="break-inside-avoid mb-4 sm:mb-6 w-full inline-block glass-card rounded-xl p-4 sm:p-5 space-y-4">
            <div>
              <h3 className="text-sm sm:text-base font-semibold text-white mb-2 flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px] text-tertiary-fixed-dim">
                  school
                </span>
                <span>Education ({parsed.education?.length || 0})</span>
              </h3>
              {parsed.education && parsed.education.length > 0 ? (
                <ul className="space-y-2">
                  {parsed.education.map((edu, idx) => (
                    <li key={idx} className="rounded-lg bg-surface-variant/5 border border-outline-variant/20 p-2.5 text-xs text-inverse-on-surface leading-relaxed flex items-start gap-2">
                      <span className="material-symbols-outlined text-[15px] text-outline-variant mt-0.5 shrink-0">account_balance</span>
                      <span>{edu}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs italic text-outline-variant/60">No formal education detected.</p>
              )}
            </div>

            {parsed.certifications && parsed.certifications.length > 0 && (
              <div className="pt-3 border-t border-outline-variant/15">
                <h3 className="text-sm sm:text-base font-semibold text-white mb-2 flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px] text-inverse-primary">
                    verified_user
                  </span>
                  <span>Certifications ({parsed.certifications.length})</span>
                </h3>
                <ul className="space-y-2">
                  {parsed.certifications.map((cert, idx) => {
                    const certStr = typeof cert === "string" ? cert : (cert.title || "");
                    const parts = certStr.split("\n");
                    const title = parts[0].trim();
                    const desc = parts.slice(1).join(" ").trim();
                    return (
                      <li key={idx} className="rounded-lg bg-surface-variant/5 border border-outline-variant/20 p-2.5 text-xs text-inverse-on-surface leading-relaxed">
                        <div className="font-semibold text-white">{title}</div>
                        {desc && <p className="text-outline-variant text-[11px] mt-0.5">{desc}</p>}
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </div>

          {/* SECTION 9: Project Portfolio Overview (Mobile: 9) */}
          {allProjects.length > 0 && (
            <div className="break-inside-avoid mb-4 sm:mb-6 w-full inline-block glass-card rounded-xl p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-tertiary-container/30 border border-tertiary-fixed-dim/30 flex items-center justify-center text-tertiary-fixed-dim">
                    <span className="material-symbols-outlined text-[18px]">code_blocks</span>
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-semibold text-white">
                      Projects Portfolio Overview ({allProjects.length})
                    </h3>
                    <p className="text-xs text-outline-variant">
                      Extracted candidate projects and implementation focus.
                    </p>
                  </div>
                </div>

                {/* Filter tabs rendered ONLY IF explicit ongoing projects exist */}
                {hasOngoing && (
                  <div className="flex flex-wrap gap-1 bg-inverse-surface p-1 rounded-xl border border-outline-variant/20 self-start sm:self-auto">
                    <button
                      type="button"
                      onClick={() => setProjectsTab("all")}
                      className={`px-2 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                        projectsTab === "all"
                          ? "bg-inverse-primary text-on-primary-container shadow-sm"
                          : "text-secondary-fixed-dim hover:text-white"
                      }`}
                    >
                      All ({allProjects.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setProjectsTab("completed")}
                      className={`px-2 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                        projectsTab === "completed"
                          ? "bg-tertiary-fixed-dim text-on-tertiary-fixed shadow-sm"
                          : "text-secondary-fixed-dim hover:text-white"
                      }`}
                    >
                      Completed ({completedProjects.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setProjectsTab("ongoing")}
                      className={`px-2 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                        projectsTab === "ongoing"
                          ? "bg-primary-container text-white shadow-sm"
                          : "text-secondary-fixed-dim hover:text-white"
                      }`}
                    >
                      Ongoing ({ongoingProjects.length})
                    </button>
                  </div>
                )}
              </div>

              <div className="space-y-2.5">
                {displayedProjects.map((proj, pIdx) => (
                  <div
                    key={pIdx}
                    className="rounded-xl bg-surface-variant/5 border border-outline-variant/20 p-3 sm:p-3.5 space-y-2 hover:border-outline-variant/40 transition-colors"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="px-2 py-0.5 rounded-md bg-inverse-surface border border-outline-variant/30 text-inverse-primary font-mono text-xs font-bold shrink-0">
                          #{pIdx + 1}
                        </span>
                        <h4 className="text-sm font-bold text-white truncate" title={proj.title}>
                          {proj.title}
                        </h4>
                      </div>
                      {proj.isOngoing ? (
                        <span className="px-2 py-0.5 rounded-full bg-primary-container/30 text-inverse-primary border border-inverse-primary/30 text-[10px] font-semibold flex items-center gap-1 shrink-0 self-start sm:self-auto">
                          <span className="w-1.5 h-1.5 rounded-full bg-inverse-primary animate-pulse"></span>
                          Ongoing
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full bg-tertiary-container/30 text-tertiary-fixed-dim border border-tertiary-fixed-dim/30 text-[10px] font-semibold flex items-center gap-1 shrink-0 self-start sm:self-auto">
                          <span className="material-symbols-outlined text-[12px]">check_circle</span>
                          Completed
                        </span>
                      )}
                    </div>

                    {proj.technologies && proj.technologies.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {proj.technologies.map((t, tIdx) => (
                          <span
                            key={tIdx}
                            className="px-2 py-0.5 bg-inverse-surface rounded text-[11px] text-outline-variant border border-outline-variant/20 font-mono"
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    )}

                    {proj.description && (
                      <p className="text-xs text-outline-variant leading-relaxed line-clamp-2">
                        {proj.description}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SECTION 10: AI Project Relevance & Architecture Analysis (Mobile: 10, Max 3) */}
          {flags.SHOW_PROJECT_ANALYSIS !== false && projectEvals.length > 0 && (
            <div className="break-inside-avoid mb-4 sm:mb-6 w-full inline-block glass-card rounded-xl p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-inverse-primary/20 border border-inverse-primary/30 flex items-center justify-center text-inverse-primary">
                    <span className="material-symbols-outlined text-[18px]">folder_special</span>
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-semibold text-white">
                      AI Project Relevance Analysis ({projectEvals.length})
                    </h3>
                    <p className="text-xs text-outline-variant">
                      Evaluating top projects for alignment, tech stack depth, and business impact.
                    </p>
                  </div>
                </div>
                <span className="px-2.5 py-0.5 rounded-full bg-inverse-surface border border-outline-variant/30 text-secondary-fixed-dim text-xs font-medium self-start sm:self-auto">
                  {result.job_description_provided ? "Role-Specific Fit" : "Technical Merit"}
                </span>
              </div>

              <div className="space-y-3">
                {projectEvals.map((proj, idx) => {
                  const title = proj.project_title || proj.project_name || proj.title || `Project ${idx + 1}`;
                  const score = proj.relevance_score || "Medium";
                  const badge = getRelevanceBadge(score);
                  const techs = proj.technologies_detected || proj.technologies || [];
                  const explanation = proj.relevance_explanation || proj.why_relevant || "";
                  const tip = proj.improvement_suggestions || proj.optimization_tip || "";
                  const isOngoing =
                    /\b(?:ongoing|in\s*[-–—]?\s*progress|currently\s+working\s+on|under\s+development|continuing)\b/i.test(`${title} ${explanation} ${tip}`) ||
                    /\((?:ongoing|current|present|in\s*progress)\)/i.test(`${title} ${explanation} ${tip}`);

                  return (
                    <div
                      key={idx}
                      className="rounded-xl bg-surface-variant/5 border border-outline-variant/20 p-3.5 sm:p-4 space-y-2.5 hover:border-outline-variant/40 transition-colors"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="px-2 py-0.5 rounded-md bg-inverse-surface border border-outline-variant/30 text-inverse-primary font-mono text-xs font-bold shrink-0">
                            #{idx + 1}
                          </span>
                          <h4 className="text-sm sm:text-base font-bold text-white truncate" title={title}>
                            {title}
                          </h4>
                          {isOngoing && (
                            <span className="px-2 py-0.5 rounded-full bg-primary-container/30 text-inverse-primary border border-inverse-primary/30 text-[10px] font-semibold flex items-center gap-1 shrink-0">
                              <span className="w-1.5 h-1.5 rounded-full bg-inverse-primary animate-pulse"></span>
                              Ongoing
                            </span>
                          )}
                        </div>
                        <span
                          className={`px-2.5 py-0.5 rounded-full border text-xs font-medium flex items-center gap-1 self-start sm:self-auto ${badge.className}`}
                        >
                          <span className="material-symbols-outlined text-[13px]">{badge.icon}</span>
                          <span>{badge.label}</span>
                        </span>
                      </div>

                      {techs && techs.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {techs.map((t, tIdx) => (
                            <span
                              key={tIdx}
                              className="px-2 py-0.5 bg-inverse-surface rounded text-[11px] text-outline-variant border border-outline-variant/20 font-mono"
                            >
                              {t}
                            </span>
                          ))}
                        </div>
                      )}

                      {explanation && (
                        <p className="text-xs text-inverse-on-surface leading-relaxed">
                          <strong className="text-white">Why Relevant:</strong> {explanation}
                        </p>
                      )}

                      {tip && (
                        <div className="rounded-lg bg-inverse-primary/10 border border-inverse-primary/20 p-2.5 text-xs text-inverse-primary leading-relaxed">
                          <strong className="text-inverse-primary flex items-center gap-1 mb-0.5">
                            <span className="material-symbols-outlined text-[14px]">tips_and_updates</span>
                            Optimization Tip:
                          </strong>
                          <span>{tip}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* SECTION 11: Prioritized AI Recommendations (Mobile: 11) */}
          {flags.SHOW_AI_RECOMMENDATIONS !== false && (
            <div className="break-inside-avoid mb-4 sm:mb-6 w-full inline-block glass-card rounded-xl p-4 sm:p-5">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-inverse-primary/20 border border-inverse-primary/30 flex items-center justify-center text-inverse-primary">
                    <span className="material-symbols-outlined text-[18px]">target</span>
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-semibold text-white">
                      Prioritized AI Recommendations
                    </h3>
                    <p className="text-xs text-outline-variant">
                      Actionable steps ordered by impact on parse score.
                    </p>
                  </div>
                </div>

                {/* Tab Selector */}
                <div className="flex flex-wrap gap-1 bg-inverse-surface p-1 rounded-xl border border-outline-variant/20 self-start sm:self-auto">
                  <button
                    type="button"
                    onClick={() => setRecsTab("all")}
                    className={`px-2 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
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
                    className={`px-2 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
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
                    className={`px-2 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                      recsTab === "medium"
                        ? "bg-[#fde68a] text-[#78350f] shadow-sm"
                        : "text-secondary-fixed-dim hover:text-white"
                    }`}
                  >
                    Med ({prioritizedRecs.medium_priority?.length || 0})
                  </button>
                  <button
                    type="button"
                    onClick={() => setRecsTab("low")}
                    className={`px-2 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
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
                      className={`px-2 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                        recsTab === "ats"
                          ? "bg-primary-container text-white shadow-sm"
                          : "text-secondary-fixed-dim hover:text-white"
                      }`}
                    >
                      ATS ({atsTips.length})
                    </button>
                  )}
                </div>
              </div>

              <div className="space-y-2.5">
                {/* High Priority */}
                {(recsTab === "all" || recsTab === "high") && prioritizedRecs.high_priority?.length > 0 && (
                  <div className="space-y-1.5">
                    <h4 className="text-xs font-semibold text-error uppercase tracking-wider flex items-center gap-1">
                      <span className="material-symbols-outlined text-[13px]">error</span>
                      <span>High Priority (Immediate ATS Impact)</span>
                    </h4>
                    {prioritizedRecs.high_priority.map((rec, idx) => (
                      <div
                        key={idx}
                        className="flex items-start gap-2 rounded-lg bg-error-container/10 border border-error/20 p-2.5 text-xs text-inverse-on-surface leading-relaxed"
                      >
                        <span className="w-4 h-4 rounded-full bg-error/20 text-error flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                          {idx + 1}
                        </span>
                        <span>{rec}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Medium Priority */}
                {(recsTab === "all" || recsTab === "medium") && prioritizedRecs.medium_priority?.length > 0 && (
                  <div className="space-y-1.5">
                    <h4 className="text-xs font-semibold text-[#fde68a] uppercase tracking-wider flex items-center gap-1">
                      <span className="material-symbols-outlined text-[13px]">warning</span>
                      <span>Medium Priority (Content & Phrasing)</span>
                    </h4>
                    {prioritizedRecs.medium_priority.map((rec, idx) => (
                      <div
                        key={idx}
                        className="flex items-start gap-2 rounded-lg bg-[#78350f]/15 border border-[#fde68a]/20 p-2.5 text-xs text-inverse-on-surface leading-relaxed"
                      >
                        <span className="w-4 h-4 rounded-full bg-[#fde68a]/20 text-[#fde68a] flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                          {idx + 1}
                        </span>
                        <span>{rec}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Low Priority */}
                {(recsTab === "all" || recsTab === "low") && prioritizedRecs.low_priority?.length > 0 && (
                  <div className="space-y-1.5">
                    <h4 className="text-xs font-semibold text-tertiary-fixed-dim uppercase tracking-wider flex items-center gap-1">
                      <span className="material-symbols-outlined text-[13px]">check_circle</span>
                      <span>Low Priority (Polishing & Formatting)</span>
                    </h4>
                    {prioritizedRecs.low_priority.map((rec, idx) => (
                      <div
                        key={idx}
                        className="flex items-start gap-2 rounded-lg bg-tertiary-container/10 border border-tertiary-fixed-dim/20 p-2.5 text-xs text-inverse-on-surface leading-relaxed"
                      >
                        <span className="w-4 h-4 rounded-full bg-tertiary-fixed-dim/20 text-tertiary-fixed-dim flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                          {idx + 1}
                        </span>
                        <span>{rec}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* ATS Tips */}
                {(recsTab === "all" || recsTab === "ats") && atsTips.length > 0 && (
                  <div className="space-y-1.5">
                    <h4 className="text-xs font-semibold text-inverse-primary uppercase tracking-wider flex items-center gap-1">
                      <span className="material-symbols-outlined text-[13px]">lightbulb</span>
                      <span>ATS Optimization Best Practices</span>
                    </h4>
                    {atsTips.map((tip, idx) => (
                      <div
                        key={idx}
                        className="flex items-start gap-2 rounded-lg bg-inverse-primary/10 border border-inverse-primary/20 p-2.5 text-xs text-inverse-on-surface leading-relaxed"
                      >
                        <span className="material-symbols-outlined text-inverse-primary text-[16px] shrink-0 mt-0.5">
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

          {/* SECTION 12: Extracted Resume Text (Mobile: 12) */}
          <div className="break-inside-avoid mb-4 sm:mb-6 w-full inline-block glass-card rounded-xl p-4 sm:p-5">
            <div className="flex items-center justify-between gap-2 mb-2">
              <div>
                <h3 className="text-xs sm:text-sm font-semibold text-white flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px] text-outline">
                    raw_on
                  </span>
                  <span>Extracted Resume Text</span>
                </h3>
                <p className="text-[11px] text-outline-variant">
                  Inspect source text extracted from the uploaded document.
                </p>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                {showRawText && (
                  <button
                    type="button"
                    onClick={handleCopyRawText}
                    className="px-2.5 py-1 rounded-lg border border-outline-variant/30 bg-surface-variant/10 text-xs font-semibold text-inverse-primary hover:bg-surface-variant/20 transition-all flex items-center gap-1 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[13px]">
                      {copied ? "check" : "content_copy"}
                    </span>
                    <span>{copied ? "Copied" : "Copy"}</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setShowRawText(!showRawText)}
                  className="px-2.5 py-1 rounded-lg border border-outline-variant/30 bg-surface-variant/10 text-xs font-semibold text-inverse-on-surface hover:bg-surface-variant/20 transition-all cursor-pointer"
                >
                  {showRawText ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            {showRawText && (
              <div className="mt-3">
                <pre className="max-h-60 overflow-y-auto whitespace-pre-wrap rounded-xl bg-on-surface/90 border border-outline-variant/20 p-3 font-mono text-[11px] leading-relaxed text-inverse-on-surface/80">
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
