import React from "react";

function ExperienceAnalysis({ experienceAnalysis }) {
  if (!experienceAnalysis) return null;

  const {
    candidate_type,
    has_professional_experience,
    has_internship_experience,
    has_virtual_experience,
    include_experience_section,
    professional_items,
    internship_items,
    virtual_simulation_items,
    explanation,
  } = experienceAnalysis;

  if (!include_experience_section && !has_virtual_experience) {
    return null;
  }

  return (
    <div className="space-y-4">
      {/* Genuine Professional / Internship Experience Section */}
      {include_experience_section && (
        <div className="glass-card rounded-xl p-4 sm:p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-lg bg-accent-cyan/10 border border-accent-cyan/20 flex items-center justify-center text-accent-cyan">
              <span className="material-symbols-outlined text-[20px]">work</span>
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-semibold text-white">
                Professional & Internship Experience
              </h3>
              {explanation && (
                <p className="text-xs text-neutral-400 mt-0.5">{explanation}</p>
              )}
            </div>
          </div>

          <div className="space-y-3">
            {professional_items && professional_items.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-2 flex items-center gap-1">
                  <span className="material-symbols-outlined text-[15px]">business_center</span>
                  <span>Work History ({professional_items.length})</span>
                </h4>
                <ul className="space-y-2">
                  {professional_items.map((item, idx) => {
                    const parts = String(item).split("\n");
                    const title = parts[0].trim();
                    const desc = parts.slice(1).join(" ").trim();
                    return (
                      <li
                        key={idx}
                        className="rounded-lg bg-[#202024]/50 border border-outline-variant/30 p-3"
                      >
                        <div className="text-white text-xs sm:text-sm font-semibold">{title}</div>
                        {desc && (
                          <p className="text-neutral-300 text-xs mt-1 leading-relaxed">{desc}</p>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}

            {internship_items && internship_items.length > 0 && (
              <div className="mt-3 pt-2.5 border-t border-outline-variant/20">
                <h4 className="text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                  <span className="material-symbols-outlined text-[15px]">school</span>
                  <span>Internships ({internship_items.length})</span>
                </h4>
                <ul className="space-y-2">
                  {internship_items.map((item, idx) => {
                    const parts = String(item).split("\n");
                    const title = parts[0].trim();
                    const desc = parts.slice(1).join(" ").trim();
                    return (
                      <li
                        key={idx}
                        className="rounded-lg bg-emerald-500/10 border border-emerald-500/25 p-3"
                      >
                        <div className="text-emerald-300 text-xs sm:text-sm font-semibold">{title}</div>
                        {desc && (
                          <p className="text-neutral-300 text-xs mt-1 leading-relaxed">{desc}</p>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Separate Virtual Job Simulation Highlight */}
      {has_virtual_experience && virtual_simulation_items && virtual_simulation_items.length > 0 && (
        <div className="glass-card rounded-xl p-4 sm:p-5 border-l-4 border-accent-cyan">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 rounded-lg bg-accent-cyan/10 border border-accent-cyan/20 flex items-center justify-center text-accent-cyan">
              <span className="material-symbols-outlined text-[20px]">workspace_premium</span>
            </div>
            <div>
              <span className="px-2 py-0.5 rounded-full bg-accent-cyan/10 text-accent-cyan border border-accent-cyan/25 text-[11px] font-semibold">
                Virtual Experience / Job Simulation
              </span>
              <h3 className="text-sm sm:text-base font-semibold text-white mt-1">
                Experiential Simulation Programs
              </h3>
            </div>
          </div>
          <p className="text-xs text-neutral-400 mb-3 leading-relaxed">
            Recognized as practical virtual simulations (e.g. Forage). Demonstrates proactive self-directed learning and real-world task familiarity.
          </p>

          <ul className="space-y-2">
            {virtual_simulation_items.map((item, idx) => {
              const isObj = typeof item === "object" && item !== null;
              const rawStr = isObj ? item.title || "" : String(item);
              const parts = rawStr.split("\n");
              const title = parts[0].trim();
              const inlineDesc = parts.slice(1).join(" ").trim();
              const objDesc = isObj && Array.isArray(item.description) ? item.description.join(" ").trim() : (isObj ? item.description : "");
              const description = objDesc || inlineDesc;

              return (
                <li
                  key={idx}
                  className="rounded-lg bg-[#202024]/50 border border-outline-variant/30 p-3"
                >
                  <div className="text-white text-xs sm:text-sm font-semibold">
                    {title}
                  </div>
                  {description && (
                    <p className="text-neutral-300 text-xs mt-1 leading-relaxed">
                      {description}
                    </p>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}

export default React.memo(ExperienceAnalysis);
