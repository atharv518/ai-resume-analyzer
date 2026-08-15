import React, { useState } from "react";

function ResumeResults({ result, onReset }) {
  const [showRawText, setShowRawText] = useState(false);
  const parsed = result?.parsed_resume || {};

  return (
    <div className="mt-8 space-y-6">
      {/* Overview Banner */}
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <span className="inline-flex items-center rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800">
              Extraction & Parsing Complete
            </span>
            <h2 className="mt-2 text-xl font-bold text-slate-900">
              {parsed.name || "Candidate Resume"}
            </h2>
            <p className="mt-1 text-xs text-slate-500">File: {result.filename}</p>
          </div>
          {onReset && (
            <button
              type="button"
              onClick={onReset}
              className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2"
            >
              Analyze Another Resume
            </button>
          )}
        </div>

        {/* Contact info */}
        <div className="mt-4 grid grid-cols-1 gap-3 border-t border-emerald-200/70 pt-4 sm:grid-cols-2">
          <div className="flex items-center text-sm text-slate-700">
            <span className="font-medium text-slate-900 mr-2">Email:</span>
            {parsed.email ? (
              <a href={`mailto:${parsed.email}`} className="text-blue-600 hover:underline">
                {parsed.email}
              </a>
            ) : (
              <span className="text-slate-400 italic">Not detected</span>
            )}
          </div>
          <div className="flex items-center text-sm text-slate-700">
            <span className="font-medium text-slate-900 mr-2">Phone:</span>
            {parsed.phone ? (
              <span>{parsed.phone}</span>
            ) : (
              <span className="text-slate-400 italic">Not detected</span>
            )}
          </div>
        </div>
      </div>

      {/* Main Extracted Sections */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
        {/* Skills */}
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-600">
            Skills ({parsed.skills?.length || 0})
          </h3>
          {parsed.skills && parsed.skills.length > 0 ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {parsed.skills.map((skill, index) => (
                <span
                  key={index}
                  className="rounded-lg bg-slate-100 px-3 py-1 text-xs font-medium text-slate-800 border border-slate-200"
                >
                  {skill}
                </span>
              ))}
            </div>
          ) : (
            <p className="mt-2 text-sm italic text-slate-400">No skills detected.</p>
          )}
        </div>

        <div className="border-t border-slate-200" />

        {/* Experience */}
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-600">
            Experience ({parsed.experience?.length || 0})
          </h3>
          {parsed.experience && parsed.experience.length > 0 ? (
            <ul className="mt-3 space-y-2 text-sm text-slate-700">
              {parsed.experience.map((item, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="text-slate-400 mt-0.5">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-sm italic text-slate-400">No experience section detected.</p>
          )}
        </div>

        <div className="border-t border-slate-200" />

        {/* Education */}
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-600">
            Education ({parsed.education?.length || 0})
          </h3>
          {parsed.education && parsed.education.length > 0 ? (
            <ul className="mt-3 space-y-2 text-sm text-slate-700">
              {parsed.education.map((item, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="text-slate-400 mt-0.5">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-sm italic text-slate-400">No education section detected.</p>
          )}
        </div>

        <div className="border-t border-slate-200" />

        {/* Projects */}
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-600">
            Projects ({parsed.projects?.length || 0})
          </h3>
          {parsed.projects && parsed.projects.length > 0 ? (
            <ul className="mt-3 space-y-2 text-sm text-slate-700">
              {parsed.projects.map((item, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="text-slate-400 mt-0.5">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-sm italic text-slate-400">No projects section detected.</p>
          )}
        </div>

        <div className="border-t border-slate-200" />

        {/* Certifications */}
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-600">
            Certifications ({parsed.certifications?.length || 0})
          </h3>
          {parsed.certifications && parsed.certifications.length > 0 ? (
            <ul className="mt-3 space-y-2 text-sm text-slate-700">
              {parsed.certifications.map((item, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="text-slate-400 mt-0.5">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-sm italic text-slate-400">No certifications detected.</p>
          )}
        </div>
      </div>

      {/* Expandable Raw Text Viewer */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-600">
              Extracted Resume Text
            </h3>
            <p className="mt-0.5 text-xs text-slate-500">
              View the raw text extracted from your document.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowRawText(!showRawText)}
            className="rounded-lg border border-slate-300 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
          >
            {showRawText ? "Hide Raw Text" : "Show Raw Text"}
          </button>
        </div>

        {showRawText && (
          <div className="mt-4">
            <pre className="max-h-96 overflow-y-auto whitespace-pre-wrap rounded-xl bg-slate-900 p-4 font-mono text-xs leading-relaxed text-slate-100">
              {result.extracted_text || "No text extracted."}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}

export default ResumeResults;
