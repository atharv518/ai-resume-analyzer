import React from "react";

function BriefcaseIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5" aria-hidden="true">
      <rect width="20" height="14" x="2" y="7" rx="2" ry="2" />
      <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
    </svg>
  );
}

function VirtualBadgeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5" aria-hidden="true">
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  );
}

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

  // STRICT REQUIREMENT: If no professional/internship experience is detected, completely hide the section.
  if (!include_experience_section && !has_virtual_experience) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Genuine Professional / Internship Experience Section */}
      {include_experience_section && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-800">
              <BriefcaseIcon />
            </span>
            <div>
              <h3 className="text-lg font-bold text-slate-900">
                Professional & Internship Experience
              </h3>
              <p className="text-xs text-slate-500">{explanation}</p>
            </div>
          </div>

          <div className="mt-6 space-y-4">
            {professional_items && professional_items.length > 0 && (
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                  Work History ({professional_items.length})
                </h4>
                <ul className="space-y-2.5">
                  {professional_items.map((item, idx) => {
                    const parts = String(item).split("\n");
                    const title = parts[0].trim();
                    const desc = parts.slice(1).join(" ").trim();
                    return (
                      <li
                        key={idx}
                        className="flex items-start gap-3 rounded-xl border border-slate-100 bg-slate-50/70 p-3.5 text-sm leading-relaxed text-slate-800"
                      >
                        <span className="mt-1.5 flex h-2 w-2 shrink-0 rounded-full bg-slate-900" />
                        <div>
                          <div className="font-semibold text-slate-900">{title}</div>
                          {desc && (
                            <p className="mt-1 text-xs text-slate-600 leading-relaxed">{desc}</p>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}

            {internship_items && internship_items.length > 0 && (
              <div className="mt-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                  Internships ({internship_items.length})
                </h4>
                <ul className="space-y-2.5">
                  {internship_items.map((item, idx) => {
                    const parts = String(item).split("\n");
                    const title = parts[0].trim();
                    const desc = parts.slice(1).join(" ").trim();
                    return (
                      <li
                        key={idx}
                        className="flex items-start gap-3 rounded-xl border border-blue-100 bg-blue-50/50 p-3.5 text-sm leading-relaxed text-slate-800"
                      >
                        <span className="mt-1.5 flex h-2 w-2 shrink-0 rounded-full bg-blue-600" />
                        <div>
                          <div className="font-semibold text-slate-900">{title}</div>
                          {desc && (
                            <p className="mt-1 text-xs text-slate-600 leading-relaxed">{desc}</p>
                          )}
                        </div>
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
        <div className="rounded-2xl border border-indigo-200 bg-indigo-50/40 p-6 shadow-sm sm:p-8">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700">
                <VirtualBadgeIcon />
              </span>
              <div>
                <span className="inline-flex items-center rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-semibold text-indigo-800">
                  Virtual Experience / Job Simulation
                </span>
                <h3 className="mt-1 text-base font-bold text-slate-900">
                  Experiential Program
                </h3>
              </div>
            </div>
          </div>
          <p className="mt-3 text-xs leading-relaxed text-slate-600">
            Recognized as a practical virtual simulation (e.g. Forage). This demonstrates self-directed skill learning and industry familiarity.
          </p>
          <ul className="mt-4 space-y-3">
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
                  className="rounded-xl border border-indigo-100 bg-white p-4 shadow-2xs text-slate-800"
                >
                  <div className="font-semibold text-slate-900 text-sm">
                    {title}
                  </div>
                  {description && (
                    <p className="mt-1.5 text-xs leading-relaxed text-slate-600">
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
