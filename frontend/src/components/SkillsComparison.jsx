import React from "react";

function SkillsComparison({ skillComparison, jobDescriptionProvided }) {
  if (!skillComparison) return null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
      {/* Matched / Identified Skills */}
      <div className="glass-card rounded-xl p-4 sm:p-5 border-l-4 border-emerald-400 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-semibold text-white flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[18px] text-emerald-400">verified</span>
              <span>{jobDescriptionProvided ? "Matched Skills" : "Identified Skills"} ({skillComparison.matching_skills?.length || 0})</span>
            </h4>
            {jobDescriptionProvided && (
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 text-xs font-semibold">
                {skillComparison.skill_match_percentage}% match
              </span>
            )}
          </div>
          <p className="text-xs text-neutral-400 mb-3">
            {jobDescriptionProvided
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
                  className="px-2.5 py-1 bg-emerald-500/10 text-emerald-300 rounded-md text-xs font-medium border border-emerald-500/25 flex items-center gap-1"
                >
                  <span>{skill}</span>
                  {synonymInfo && (
                    <span className="text-[10px] text-emerald-200 px-1 rounded bg-emerald-500/20">
                      alias
                    </span>
                  )}
                </span>
              );
            })}
            {(!skillComparison.matching_skills || skillComparison.matching_skills.length === 0) && (
              <span className="text-xs text-neutral-500 italic">No skills detected.</span>
            )}
          </div>
        </div>

        {skillComparison.categorized_skills && Object.keys(skillComparison.categorized_skills).length > 0 && (
          <div className="mt-3 pt-2.5 border-t border-outline-variant/20 space-y-1">
            <h5 className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">Categories</h5>
            <div className="space-y-0.5">
              {Object.entries(skillComparison.categorized_skills).slice(0, 3).map(([cat, sks], cIdx) => (
                <div key={cIdx} className="text-xs text-neutral-300">
                  <strong className="text-white font-medium">{cat}:</strong> {sks.join(", ")}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Identified Domain Keywords / Missing Skills */}
      {jobDescriptionProvided ? (
        <div className="glass-card rounded-xl p-4 sm:p-5 border-l-4 border-amber-400 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-semibold text-white flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[18px] text-amber-400">search</span>
                <span>Missing Skills ({skillComparison.missing_skills?.length || 0})</span>
              </h4>
              <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/25 text-xs font-semibold">
                Required
              </span>
            </div>
            <p className="text-xs text-neutral-400 mb-3">
              Required in job description but missing.
            </p>
            <div className="flex flex-wrap gap-1.5">
              {skillComparison.missing_skills?.map((skill, idx) => (
                <span
                  key={idx}
                  className="px-2.5 py-1 bg-amber-500/10 text-amber-300 rounded-md text-xs font-medium border border-amber-500/25"
                >
                  {skill}
                </span>
              ))}
              {(!skillComparison.missing_skills || skillComparison.missing_skills.length === 0) && (
                <span className="text-xs text-emerald-400 font-medium">All target job skills present!</span>
              )}
            </div>
          </div>

          <div className="mt-3 pt-2.5 border-t border-outline-variant/20">
            <p className="text-[11px] text-amber-300/90 leading-tight">
              <strong>ATS Tip:</strong> If experienced with these, add them into your bullet points naturally.
            </p>
          </div>
        </div>
      ) : (
        <div className="glass-card rounded-xl p-4 sm:p-5 border-l-4 border-accent-cyan flex flex-col justify-between">
          <div>
            <h4 className="text-sm font-semibold text-white mb-2 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[18px] text-accent-cyan">label</span>
              <span>Identified Domain Keywords ({skillComparison.matching_keywords?.length || 0})</span>
            </h4>
            <p className="text-xs text-neutral-400 mb-3">
              Key industry terminologies and concepts.
            </p>
            <div className="flex flex-wrap gap-1.5">
              {skillComparison.matching_keywords?.map((kw, idx) => (
                <span
                  key={idx}
                  className="px-2.5 py-1 bg-accent-cyan/10 text-accent-cyan rounded-md text-xs font-medium border border-accent-cyan/25"
                >
                  {kw}
                </span>
              ))}
              {(!skillComparison.matching_keywords || skillComparison.matching_keywords.length === 0) && (
                <span className="text-xs text-neutral-500 italic">No domain keywords detected.</span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default React.memo(SkillsComparison);
