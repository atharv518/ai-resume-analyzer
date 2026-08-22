import React from "react";

function JobDescription({ value, onChange, error }) {
  const charCount = value ? value.trim().length : 0;

  return (
    <div className="flex flex-col gap-sm">
      <div className="flex justify-between items-end mb-1">
        <label
          htmlFor="job-description"
          className="font-label-md text-label-md text-outline-variant flex items-center gap-1.5"
        >
          <span>Target Job Description (Optional)</span>
        </label>
        <span className="font-label-md text-label-md text-outline-variant/70 text-xs">
          {charCount} / 5000 chars
        </span>
      </div>

      <textarea
        id="job-description"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        rows={6}
        placeholder="Paste the target job description here to calibrate ATS keyword matching, experience requirements, and skill gap detection..."
        className={`w-full rounded-xl border bg-surface-variant/5 p-md font-body-md text-body-md text-inverse-on-surface focus:border-inverse-primary focus:ring-2 focus:ring-inverse-primary/20 transition-all placeholder:text-outline-variant/50 resize-y outline-none ${
          error
            ? "border-error/50 ring-2 ring-error/20"
            : "border-outline-variant/30 hover:border-outline-variant/50"
        }`}
      />

      {error ? (
        <p className="font-body-md text-body-md text-error text-xs flex items-center gap-1.5" role="alert">
          <span className="material-symbols-outlined text-[14px]">error</span>
          <span>{error}</span>
        </p>
      ) : (
        <p className="font-body-md text-body-md text-outline-variant text-xs flex items-center gap-1">
          <span className="material-symbols-outlined text-[14px] text-tertiary-fixed-dim">tips_and_updates</span>
          <span>Providing a JD calibrates keyword density, hard skills matching, and role-fit analysis.</span>
        </p>
      )}
    </div>
  );
}

export default JobDescription;

