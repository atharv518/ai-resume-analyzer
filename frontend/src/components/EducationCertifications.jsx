import React from "react";

function parseEducationItem(edu) {
  if (!edu) return null;
  const raw = typeof edu === "string" ? edu : (edu.degree || edu.institution || edu.title || JSON.stringify(edu));
  
  // Clean leading bullet marks and whitespace
  const cleaned = raw.replace(/^[•\-\*\u2022\u25E6\u2043\s]+/, "").trim();
  const rawLines = cleaned
    .split(/\n+/)
    .map((l) => l.replace(/^[•\-\*\u2022\u25E6\u2043\s]+/, "").trim())
    .filter(Boolean);

  if (rawLines.length === 0) return null;

  let degree = "";
  let institution = "";
  let details = [];

  if (rawLines.length === 1) {
    const singleLine = rawLines[0];
    if (singleLine.includes(" | ")) {
      const parts = singleLine.split(" | ").map((p) => p.trim()).filter(Boolean);
      degree = parts[0];
      institution = parts[1] || "";
      details = parts.slice(2);
    } else if (singleLine.includes(" - ") && !singleLine.match(/\b\d{4}\s*-\s*\d{4}\b/)) {
      const parts = singleLine.split(" - ").map((p) => p.trim()).filter(Boolean);
      degree = parts[0];
      institution = parts[1] || "";
      details = parts.slice(2);
    } else {
      degree = singleLine;
    }
  } else {
    degree = rawLines[0];
    institution = rawLines[1] || "";
    details = rawLines.slice(2);
  }

  // Attempt to extract graduation year / dates from degree or institution strings
  const yearMatch = (degree + " " + institution).match(/\b(19|20)\d{2}(?:\s*[-–—]\s*(?:(19|20)\d{2}|Present|Current|Expected))?\b/i);

  return {
    degree,
    institution,
    details,
    year: yearMatch ? yearMatch[0] : null,
  };
}

function parseCertificationItem(cert) {
  if (!cert) return null;
  const raw = typeof cert === "string" ? cert : (cert.name || cert.title || JSON.stringify(cert));
  const cleaned = raw.replace(/^[•\-\*\u2022\u25E6\u2043\s]+/, "").trim();
  const rawLines = cleaned
    .split(/\n+/)
    .map((l) => l.replace(/^[•\-\*\u2022\u25E6\u2043\s]+/, "").trim())
    .filter(Boolean);

  if (rawLines.length === 0) return null;

  let title = rawLines[0];
  let issuer = "";
  let details = [];

  if (rawLines.length === 1) {
    if (title.includes(" | ")) {
      const parts = title.split(" | ").map((p) => p.trim()).filter(Boolean);
      title = parts[0];
      issuer = parts[1] || "";
      details = parts.slice(2);
    } else if (title.includes(" – ") || title.includes(" - ")) {
      const parts = title.split(/\s+[–\-]\s+/).map((p) => p.trim()).filter(Boolean);
      title = parts[0];
      issuer = parts[1] || "";
      details = parts.slice(2);
    }
  } else {
    issuer = rawLines[1] || "";
    details = rawLines.slice(2);
  }

  const dateMatch = (title + " " + issuer + " " + details.join(" ")).match(/\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{4}|\b(19|20)\d{2}\b/i);

  return {
    title,
    issuer,
    details,
    date: dateMatch ? dateMatch[0] : null,
  };
}

function EducationCertifications({ education = [], certifications = [] }) {
  const parsedEducation = (education || []).map(parseEducationItem).filter(Boolean);
  const parsedCertifications = (certifications || []).map(parseCertificationItem).filter(Boolean);

  return (
    <div className="glass-card rounded-xl p-4 sm:p-5 space-y-4">
      {/* Education Section */}
      <div>
        <h3 className="text-sm sm:text-base font-semibold text-white mb-2.5 flex items-center gap-2">
          <span className="material-symbols-outlined text-[18px] text-tertiary-fixed-dim">
            school
          </span>
          <span>Education ({parsedEducation.length})</span>
        </h3>
        {parsedEducation.length > 0 ? (
          <div className="space-y-2">
            {parsedEducation.map((edu, idx) => (
              <div
                key={idx}
                className="rounded-lg bg-surface-variant/5 border border-outline-variant/20 p-3 text-xs text-neutral-200 leading-relaxed"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="font-semibold text-white text-xs sm:text-sm">
                    {edu.degree}
                  </div>
                  {edu.year && (
                    <span className="px-2 py-0.5 rounded bg-surface-variant/20 text-[10px] font-mono text-tertiary-fixed-dim shrink-0">
                      {edu.year}
                    </span>
                  )}
                </div>
                {edu.institution && (
                  <div className="text-neutral-400 text-xs flex items-center gap-1 mt-0.5">
                    <span className="material-symbols-outlined text-[13px] text-outline-variant">
                      account_balance
                    </span>
                    <span>{edu.institution}</span>
                  </div>
                )}
                {edu.details.length > 0 && (
                  <div className="mt-1.5 space-y-0.5 border-t border-outline-variant/10 pt-1 text-[11px] text-neutral-400">
                    {edu.details.map((detail, dIdx) => (
                      <p key={dIdx}>• {detail}</p>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs italic text-neutral-500">No formal education entries detected.</p>
        )}
      </div>

      {/* Certifications Section */}
      {parsedCertifications.length > 0 && (
        <div className="pt-3 border-t border-outline-variant/15">
          <h3 className="text-sm sm:text-base font-semibold text-white mb-2.5 flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px] text-indigo-400">
              verified_user
            </span>
            <span>Certifications & Credentials ({parsedCertifications.length})</span>
          </h3>
          <div className="space-y-2">
            {parsedCertifications.map((cert, idx) => (
              <div
                key={idx}
                className="rounded-lg bg-surface-variant/5 border border-outline-variant/20 p-3 text-xs text-neutral-200 leading-relaxed"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="font-semibold text-white">{cert.title}</div>
                  {cert.date && (
                    <span className="px-2 py-0.5 rounded bg-surface-variant/20 text-[10px] font-mono text-indigo-300 shrink-0">
                      {cert.date}
                    </span>
                  )}
                </div>
                {cert.issuer && (
                  <div className="text-neutral-400 text-xs flex items-center gap-1 mt-0.5">
                    <span className="material-symbols-outlined text-[13px] text-indigo-400/80">
                      military_tech
                    </span>
                    <span>{cert.issuer}</span>
                  </div>
                )}
                {cert.details.length > 0 && (
                  <div className="mt-1.5 space-y-0.5 border-t border-outline-variant/10 pt-1 text-[11px] text-neutral-400">
                    {cert.details.map((detail, dIdx) => (
                      <p key={dIdx}>• {detail}</p>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default React.memo(EducationCertifications);
