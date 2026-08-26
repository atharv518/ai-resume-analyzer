import React from "react";

function CandidateProfile({ parsed, aiInsights, filename }) {
  if (!parsed) return null;

  return (
    <div className="glass-card rounded-xl p-4 sm:p-5 relative overflow-hidden group hover:-translate-y-0.5 transition-transform duration-300">
      <div className="absolute top-0 right-0 w-32 h-32 bg-accent-cyan/5 rounded-bl-full -z-10 transition-transform group-hover:scale-110 pointer-events-none"></div>
      <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider block mb-1">
        Candidate Profile
      </span>
      <h2 className="text-lg sm:text-xl font-bold text-white mb-1 truncate" title={parsed.name || "Candidate Resume"}>
        {parsed.name || "Candidate Resume"}
      </h2>
      {aiInsights?.role_fit_summary && (
        <p className="text-xs text-neutral-300 mb-3 leading-relaxed">
          {aiInsights.role_fit_summary}
        </p>
      )}
      <div className="space-y-1.5 text-xs text-neutral-300 pt-2.5 border-t border-outline-variant/20">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[15px] text-neutral-400">mail</span>
          {parsed.email ? (
            <a href={`mailto:${parsed.email}`} className="text-accent-cyan hover:underline truncate">
              {parsed.email}
            </a>
          ) : (
            <span className="italic text-neutral-500">Not detected</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[15px] text-neutral-400">phone</span>
          <span>{parsed.phone || <span className="italic text-neutral-500">Not detected</span>}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[15px] text-neutral-400">description</span>
          <span className="truncate text-neutral-400">{filename || "Resume"}</span>
        </div>
      </div>
    </div>
  );
}

export default React.memo(CandidateProfile);
