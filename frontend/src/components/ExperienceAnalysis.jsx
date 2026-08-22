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
    <div className="space-y-md">
      {/* Genuine Professional / Internship Experience Section */}
      {include_experience_section && (
        <div className="glass-card rounded-xl p-lg">
          <div className="flex items-center gap-md mb-md">
            <div className="w-10 h-10 rounded-lg bg-inverse-primary/20 border border-inverse-primary/30 flex items-center justify-center text-inverse-primary">
              <span className="material-symbols-outlined text-[22px]">work</span>
            </div>
            <div>
              <h3 className="font-title-lg text-title-lg text-white">
                Professional & Internship Experience
              </h3>
              {explanation && (
                <p className="font-body-md text-body-md text-outline-variant text-xs">{explanation}</p>
              )}
            </div>
          </div>

          <div className="space-y-md">
            {professional_items && professional_items.length > 0 && (
              <div>
                <h4 className="font-label-md text-label-md text-secondary-fixed-dim uppercase tracking-wider mb-sm flex items-center gap-xs">
                  <span className="material-symbols-outlined text-[16px]">business_center</span>
                  <span>Work History ({professional_items.length})</span>
                </h4>
                <ul className="space-y-sm">
                  {professional_items.map((item, idx) => {
                    const parts = String(item).split("\n");
                    const title = parts[0].trim();
                    const desc = parts.slice(1).join(" ").trim();
                    return (
                      <li
                        key={idx}
                        className="rounded-lg bg-surface-variant/5 border border-outline-variant/20 p-md"
                      >
                        <div className="font-title-lg text-title-lg text-white text-sm font-semibold">{title}</div>
                        {desc && (
                          <p className="font-body-md text-body-md text-outline-variant text-xs mt-1 leading-relaxed">{desc}</p>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}

            {internship_items && internship_items.length > 0 && (
              <div className="mt-md pt-sm border-t border-outline-variant/10">
                <h4 className="font-label-md text-label-md text-tertiary-fixed-dim uppercase tracking-wider mb-sm flex items-center gap-xs">
                  <span className="material-symbols-outlined text-[16px]">school</span>
                  <span>Internships ({internship_items.length})</span>
                </h4>
                <ul className="space-y-sm">
                  {internship_items.map((item, idx) => {
                    const parts = String(item).split("\n");
                    const title = parts[0].trim();
                    const desc = parts.slice(1).join(" ").trim();
                    return (
                      <li
                        key={idx}
                        className="rounded-lg bg-tertiary-container/10 border border-tertiary-fixed-dim/20 p-md"
                      >
                        <div className="font-title-lg text-title-lg text-tertiary-fixed-dim text-sm font-semibold">{title}</div>
                        {desc && (
                          <p className="font-body-md text-body-md text-outline-variant text-xs mt-1 leading-relaxed">{desc}</p>
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
        <div className="glass-card rounded-xl p-lg border-l-4 border-inverse-primary">
          <div className="flex items-center gap-md mb-sm">
            <div className="w-10 h-10 rounded-lg bg-inverse-primary/20 border border-inverse-primary/30 flex items-center justify-center text-inverse-primary">
              <span className="material-symbols-outlined text-[22px]">workspace_premium</span>
            </div>
            <div>
              <span className="px-2 py-0.5 rounded-full bg-inverse-primary/20 text-inverse-primary border border-inverse-primary/30 font-label-md text-label-md text-xs">
                Virtual Experience / Job Simulation
              </span>
              <h3 className="font-title-lg text-title-lg text-white mt-1">
                Experiential Simulation Programs
              </h3>
            </div>
          </div>
          <p className="font-body-md text-body-md text-outline-variant text-xs mb-md leading-relaxed">
            Recognized as practical virtual simulations (e.g. Forage). Demonstrates proactive self-directed learning and real-world task familiarity.
          </p>

          <ul className="space-y-sm">
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
                  className="rounded-lg bg-surface-variant/5 border border-outline-variant/20 p-md"
                >
                  <div className="font-title-lg text-title-lg text-white text-sm font-semibold">
                    {title}
                  </div>
                  {description && (
                    <p className="font-body-md text-body-md text-outline-variant text-xs mt-1 leading-relaxed">
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

export default ExperienceAnalysis;
