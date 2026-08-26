import React from "react";

function QuickAnalysis({ resumeStrengths = [], resumeWeaknesses = [] }) {
  return (
    <div className="glass-card rounded-xl p-4 sm:p-5">
      <h3 className="text-sm sm:text-base font-semibold text-white mb-3 flex items-center gap-2">
        <span className="material-symbols-outlined text-[18px] text-emerald-400">
          checklist
        </span>
        <span>Quick Analysis</span>
      </h3>
      <div className="space-y-3">
        {/* Strengths */}
        <div>
          <h4 className="text-xs font-semibold text-emerald-400 mb-1.5 uppercase tracking-wider flex items-center gap-1">
            <span className="material-symbols-outlined text-[15px]">thumb_up</span>
            <span>Strengths ({resumeStrengths.length})</span>
          </h4>
          <ul className="space-y-1.5">
            {resumeStrengths.map((strength, idx) => (
              <li key={idx} className="flex items-start gap-2 text-xs text-neutral-200 leading-relaxed">
                <span className="material-symbols-outlined text-[15px] text-emerald-400 mt-[1px] shrink-0">
                  check
                </span>
                <span>{strength}</span>
              </li>
            ))}
            {resumeStrengths.length === 0 && (
              <li className="text-xs italic text-neutral-500">No specific strengths highlighted.</li>
            )}
          </ul>
        </div>

        <div className="h-px bg-outline-variant/30 w-full"></div>

        {/* Gaps / Vulnerabilities */}
        <div>
          <h4 className="text-xs font-semibold text-rose-400 mb-1.5 uppercase tracking-wider flex items-center gap-1">
            <span className="material-symbols-outlined text-[15px]">warning</span>
            <span>Gaps & Vulnerabilities ({resumeWeaknesses.length})</span>
          </h4>
          <ul className="space-y-1.5">
            {resumeWeaknesses.map((weakness, idx) => (
              <li key={idx} className="flex items-start gap-2 text-xs text-neutral-200 leading-relaxed">
                <span className="material-symbols-outlined text-[15px] text-rose-400 mt-[1px] shrink-0">
                  priority_high
                </span>
                <span>{weakness}</span>
              </li>
            ))}
            {resumeWeaknesses.length === 0 && (
              <li className="text-xs italic text-neutral-500">No critical weaknesses detected.</li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}

export default React.memo(QuickAnalysis);
