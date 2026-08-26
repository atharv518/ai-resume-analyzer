import React from "react";
import { getRelevanceBadge } from "../utils/projectUtils";

function ProjectRelevance({ projectEvals = [], jobDescriptionProvided = false, isAiPowered = false }) {
  if (!projectEvals || projectEvals.length === 0) return null;

  return (
    <div className="glass-card rounded-xl p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-accent-cyan/10 border border-accent-cyan/20 flex items-center justify-center text-accent-cyan">
            <span className="material-symbols-outlined text-[18px]">
              {isAiPowered ? "folder_special" : "account_tree"}
            </span>
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-semibold text-white">
              {isAiPowered
                ? `AI Project Relevance Analysis (${projectEvals.length})`
                : `Project Architecture Analysis (${projectEvals.length})`}
            </h3>
            <p className="text-xs text-neutral-400">
              {jobDescriptionProvided
                ? "Evaluating top projects for target role alignment, tech stack depth, and business impact."
                : "Evaluating architectural scope, tech stack complexity, and engineering implementation focus."}
            </p>
          </div>
        </div>
        <span
          className="px-2.5 py-1 rounded-full bg-[#202024] border border-outline-variant/30 text-neutral-300 text-xs font-medium self-start sm:self-auto"
          title={
            jobDescriptionProvided
              ? "Evaluated against explicit target job description requirements"
              : "Evaluated for engineering complexity and architecture scope (general profile audit)"
          }
        >
          {jobDescriptionProvided ? "Role-Specific Fit" : "General Tech Scope"}
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
              className="rounded-xl bg-[#202024]/50 border border-outline-variant/30 p-3.5 sm:p-4 space-y-2.5 hover:border-outline-variant/50 transition-colors"
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="px-2 py-0.5 rounded-md bg-[#242428] border border-outline-variant/40 text-accent-cyan font-mono text-xs font-bold shrink-0">
                    #{idx + 1}
                  </span>
                  <h4 className="text-sm sm:text-base font-bold text-white truncate" title={title}>
                    {title}
                  </h4>
                  {isOngoing && (
                    <span className="px-2 py-0.5 rounded-full bg-accent-cyan/10 text-accent-cyan border border-accent-cyan/25 text-[10px] font-semibold flex items-center gap-1 shrink-0">
                      <span className="w-1.5 h-1.5 rounded-full bg-accent-cyan animate-pulse"></span>
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
                      className="px-2 py-0.5 bg-[#18181A] rounded text-[11px] text-neutral-300 border border-outline-variant/40 font-mono"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              )}

              {explanation && (
                <p className="text-xs text-neutral-300 leading-relaxed">
                  <strong className="text-white">Why Relevant:</strong> {explanation}
                </p>
              )}

              {tip && (
                <div className="rounded-lg bg-accent-cyan/10 border border-accent-cyan/25 p-2.5 text-xs text-neutral-200 leading-relaxed">
                  <strong className="text-accent-cyan flex items-center gap-1 mb-0.5">
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
  );
}

export default React.memo(ProjectRelevance);
