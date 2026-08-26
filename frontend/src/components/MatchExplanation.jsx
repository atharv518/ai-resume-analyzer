import React from "react";

function MatchExplanation({ matchExplanation, jdAlignment, jobDescriptionProvided, isAiPowered = false }) {
  if (!matchExplanation) return null;

  return (
    <div className="glass-card rounded-xl p-4 sm:p-6 relative overflow-hidden">
      <div className="absolute -top-24 -right-24 w-64 h-64 bg-accent-cyan/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="flex items-center gap-2.5 mb-3 relative z-10">
        <div className="w-8 h-8 rounded-lg bg-accent-cyan/10 border border-accent-cyan/20 flex items-center justify-center text-accent-cyan">
          <span className="material-symbols-outlined text-[18px]">
            {isAiPowered ? "auto_awesome" : "fact_check"}
          </span>
        </div>
        <div>
          <span className="text-[11px] font-semibold text-accent-cyan uppercase tracking-wider block">
            {isAiPowered ? "AI Job Match Explanation" : "Job Match & Benchmark Analysis"}
          </span>
          <h3 className="text-sm sm:text-base font-bold text-white">
            Why Your Resume {jobDescriptionProvided ? "Matches This Position" : "Matches Industry Benchmarks"}
          </h3>
        </div>
      </div>

      <p className="text-xs sm:text-sm text-neutral-200 mb-3 relative z-10 leading-relaxed bg-[#202024]/80 p-3 rounded-xl border border-outline-variant/30">
        {matchExplanation.overview}
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 relative z-10">
        {/* Strongest Matches */}
        <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/25 p-3">
          <h4 className="text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
            <span className="material-symbols-outlined text-[15px]">check_circle</span>
            <span>Strongest Match Areas</span>
          </h4>
          <ul className="space-y-1">
            {matchExplanation.strongest_match_areas?.map((item, idx) => (
              <li key={idx} className="flex items-start gap-1.5 text-xs text-neutral-300">
                <span className="text-emerald-400 font-bold">✓</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Missing Requirements */}
        <div className="rounded-lg bg-amber-500/10 border border-amber-500/25 p-3">
          <h4 className="text-xs font-semibold text-amber-300 uppercase tracking-wider mb-1.5 flex items-center gap-1">
            <span className="material-symbols-outlined text-[15px]">flag</span>
            <span>Missing Requirements</span>
          </h4>
          <ul className="space-y-1">
            {matchExplanation.biggest_gaps?.map((item, idx) => (
              <li key={idx} className="flex items-start gap-1.5 text-xs text-neutral-300">
                <span className="text-amber-400 font-bold">!</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Alignment Tags */}
      {jobDescriptionProvided && (jdAlignment?.experience_alignment || jdAlignment?.education_alignment) && (
        <div className="mt-3 pt-2.5 border-t border-outline-variant/20 flex flex-wrap gap-2 relative z-10">
          {jdAlignment.experience_alignment && (
            <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-md bg-[#202024] border border-outline-variant/30 text-neutral-300">
              <strong className="text-white font-medium">Experience:</strong> {jdAlignment.experience_alignment}
            </span>
          )}
          {jdAlignment.education_alignment && (
            <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-md bg-[#202024] border border-outline-variant/30 text-neutral-300">
              <strong className="text-white font-medium">Education:</strong> {jdAlignment.education_alignment}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

export default React.memo(MatchExplanation);
