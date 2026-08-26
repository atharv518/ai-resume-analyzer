import React from "react";

function ProjectPortfolio({
  allProjects = [],
  displayedProjects = [],
  ongoingProjects = [],
  completedProjects = [],
  hasOngoing = false,
  projectsTab = "all",
  setProjectsTab,
}) {
  if (!allProjects || allProjects.length === 0) return null;

  return (
    <div className="glass-card rounded-xl p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-emerald-400">
            <span className="material-symbols-outlined text-[18px]">code_blocks</span>
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-semibold text-white">
              Projects Portfolio Overview ({allProjects.length})
            </h3>
            <p className="text-xs text-neutral-400">
              Extracted candidate projects and implementation focus.
            </p>
          </div>
        </div>

        {/* Filter tabs rendered ONLY IF explicit ongoing projects exist */}
        {hasOngoing && (
          <div
            role="tablist"
            aria-label="Filter projects by completion status"
            className="flex flex-wrap gap-1 bg-[#202024] p-1 rounded-xl border border-outline-variant/30 self-start sm:self-auto"
          >
            <button
              type="button"
              role="tab"
              aria-selected={projectsTab === "all"}
              onClick={() => setProjectsTab("all")}
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                projectsTab === "all"
                  ? "bg-white text-black shadow-sm"
                  : "text-neutral-400 hover:text-white"
              }`}
            >
              All ({allProjects.length})
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={projectsTab === "completed"}
              onClick={() => setProjectsTab("completed")}
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                projectsTab === "completed"
                  ? "bg-emerald-400 text-black shadow-sm"
                  : "text-neutral-400 hover:text-white"
              }`}
            >
              Completed ({completedProjects.length})
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={projectsTab === "ongoing"}
              onClick={() => setProjectsTab("ongoing")}
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                projectsTab === "ongoing"
                  ? "bg-accent-cyan text-black shadow-sm"
                  : "text-neutral-400 hover:text-white"
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
            className="rounded-xl bg-[#202024]/50 border border-outline-variant/30 p-3 sm:p-3.5 space-y-2 hover:border-outline-variant/50 transition-colors"
          >
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5">
              <div className="flex items-center gap-2 min-w-0">
                <span className="px-2 py-0.5 rounded-md bg-[#242428] border border-outline-variant/40 text-accent-cyan font-mono text-xs font-bold shrink-0">
                  #{pIdx + 1}
                </span>
                <h4 className="text-sm font-bold text-white truncate" title={proj.title}>
                  {proj.title}
                </h4>
              </div>
              {proj.isOngoing ? (
                <span className="px-2 py-0.5 rounded-full bg-accent-cyan/10 text-accent-cyan border border-accent-cyan/25 text-[10px] font-semibold flex items-center gap-1 shrink-0 self-start sm:self-auto">
                  <span className="w-1.5 h-1.5 rounded-full bg-accent-cyan animate-pulse"></span>
                  Ongoing
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 text-[10px] font-semibold flex items-center gap-1 shrink-0 self-start sm:self-auto">
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
                    className="px-2 py-0.5 bg-[#18181A] rounded text-[11px] text-neutral-300 border border-outline-variant/40 font-mono"
                  >
                    {t}
                  </span>
                ))}
              </div>
            )}

            {proj.description && (
              <p className="text-xs text-neutral-300 leading-relaxed line-clamp-2">
                {proj.description}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default React.memo(ProjectPortfolio);
