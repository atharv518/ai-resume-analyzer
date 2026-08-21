import React from "react";

function JobDescription({ value, onChange, error }) {
  const charCount = value ? value.trim().length : 0;

  return (
    <section aria-labelledby="job-description-heading">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h2 id="job-description-heading" className="text-base font-semibold text-slate-900">
            Target Job Description <span className="text-xs font-normal text-slate-500 ml-1.5">(Optional)</span>
          </h2>
          <p className="mt-1 text-sm leading-6 text-slate-500">
            Paste a target job description for role-specific ATS keyword matching, or leave empty for a general resume audit.
          </p>
        </div>
        {charCount > 0 && (
          <span className="hidden sm:inline-flex text-xs font-medium text-slate-400">
            {charCount} characters
          </span>
        )}
      </div>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        rows={8}
        placeholder="Optional: Paste the target job description here (e.g. 'Looking for a Python Developer with experience in FastAPI, Docker, PostgreSQL, AWS, and REST APIs...')..."
        className={`w-full resize-y rounded-xl border bg-white px-4 py-3.5 text-sm leading-6 text-slate-800 outline-none transition placeholder:text-slate-400 focus:ring-2 ${
          error
            ? "border-red-300 focus:border-red-500 focus:ring-red-500/20"
            : "border-slate-300 focus:border-slate-900 focus:ring-slate-900/15"
        }`}
      />
      {error && (
        <p className="mt-2 text-xs font-medium text-red-600" role="alert">
          {error}
        </p>
      )}
    </section>
  );
}

export default JobDescription;

