import React from "react";

function Recommendations({
  prioritizedRecs = { high_priority: [], medium_priority: [], low_priority: [] },
  atsTips = [],
  recsTab = "all",
  setRecsTab,
  isAiPowered = false,
}) {
  return (
    <div className="glass-card rounded-xl p-4 sm:p-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-accent-cyan/10 border border-accent-cyan/20 flex items-center justify-center text-accent-cyan">
            <span className="material-symbols-outlined text-[18px]">
              {isAiPowered ? "auto_awesome" : "rule"}
            </span>
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-semibold text-white">
              {isAiPowered ? "Prioritized AI Recommendations" : "Prioritized Recommendations"}
            </h3>
            <p className="text-xs text-neutral-400">
              Actionable steps ordered by impact on parse score.
            </p>
          </div>
        </div>

        {/* Tab Selector */}
        <div
          role="tablist"
          aria-label="Filter recommendations by priority"
          className="flex flex-wrap gap-1 bg-[#202024] p-1 rounded-xl border border-outline-variant/30 self-start sm:self-auto"
        >
          <button
            type="button"
            role="tab"
            aria-selected={recsTab === "all"}
            onClick={() => setRecsTab("all")}
            className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              recsTab === "all"
                ? "bg-white text-black shadow-sm"
                : "text-neutral-400 hover:text-white"
            }`}
          >
            All
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={recsTab === "high"}
            onClick={() => setRecsTab("high")}
            className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              recsTab === "high"
                ? "bg-rose-500 text-white shadow-sm"
                : "text-neutral-400 hover:text-white"
            }`}
          >
            High ({prioritizedRecs.high_priority?.length || 0})
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={recsTab === "medium"}
            onClick={() => setRecsTab("medium")}
            className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              recsTab === "medium"
                ? "bg-amber-400 text-black shadow-sm"
                : "text-neutral-400 hover:text-white"
            }`}
          >
            Med ({prioritizedRecs.medium_priority?.length || 0})
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={recsTab === "low"}
            onClick={() => setRecsTab("low")}
            className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              recsTab === "low"
                ? "bg-neutral-200 text-black shadow-sm"
                : "text-neutral-400 hover:text-white"
            }`}
          >
            Low ({prioritizedRecs.low_priority?.length || 0})
          </button>
          {atsTips.length > 0 && (
            <button
              type="button"
              role="tab"
              aria-selected={recsTab === "ats"}
              onClick={() => setRecsTab("ats")}
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                recsTab === "ats"
                  ? "bg-accent-cyan text-black shadow-sm"
                  : "text-neutral-400 hover:text-white"
              }`}
            >
              ATS ({atsTips.length})
            </button>
          )}
        </div>
      </div>

      <div className="space-y-3">
        {/* High Priority */}
        {(recsTab === "all" || recsTab === "high") && prioritizedRecs.high_priority?.length > 0 && (
          <div className="space-y-1.5">
            <h4 className="text-xs font-semibold text-rose-400 uppercase tracking-wider flex items-center gap-1">
              <span className="material-symbols-outlined text-[13px]">error</span>
              <span>High Priority (Immediate ATS Impact)</span>
            </h4>
            {prioritizedRecs.high_priority.map((rec, idx) => (
              <div
                key={idx}
                className="flex items-start gap-2.5 rounded-lg bg-rose-500/10 border border-rose-500/25 p-3 text-xs text-neutral-200 leading-relaxed"
              >
                <span className="w-5 h-5 rounded-full bg-rose-500/20 text-rose-300 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5 border border-rose-500/30">
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
            <h4 className="text-xs font-semibold text-amber-300 uppercase tracking-wider flex items-center gap-1">
              <span className="material-symbols-outlined text-[13px]">warning</span>
              <span>Medium Priority (Content & Phrasing)</span>
            </h4>
            {prioritizedRecs.medium_priority.map((rec, idx) => (
              <div
                key={idx}
                className="flex items-start gap-2.5 rounded-lg bg-amber-500/10 border border-amber-500/25 p-3 text-xs text-neutral-200 leading-relaxed"
              >
                <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-300 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5 border border-amber-500/30">
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
            <h4 className="text-xs font-semibold text-neutral-300 uppercase tracking-wider flex items-center gap-1">
              <span className="material-symbols-outlined text-[13px]">check_circle</span>
              <span>Low Priority (Polishing & Formatting)</span>
            </h4>
            {prioritizedRecs.low_priority.map((rec, idx) => (
              <div
                key={idx}
                className="flex items-start gap-2.5 rounded-lg bg-neutral-800/50 border border-neutral-700/50 p-3 text-xs text-neutral-200 leading-relaxed"
              >
                <span className="w-5 h-5 rounded-full bg-neutral-700/50 text-neutral-300 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5 border border-neutral-600">
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
            <h4 className="text-xs font-semibold text-accent-cyan uppercase tracking-wider flex items-center gap-1">
              <span className="material-symbols-outlined text-[13px]">lightbulb</span>
              <span>ATS Optimization Best Practices</span>
            </h4>
            {atsTips.map((tip, idx) => (
              <div
                key={idx}
                className="flex items-start gap-2.5 rounded-lg bg-accent-cyan/10 border border-accent-cyan/25 p-3 text-xs text-neutral-200 leading-relaxed"
              >
                <span className="material-symbols-outlined text-accent-cyan text-[16px] shrink-0 mt-0.5">
                  tips_and_updates
                </span>
                <span>{tip}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default React.memo(Recommendations);
