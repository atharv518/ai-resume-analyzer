import React from "react";

function JobDescription({ value, onChange, error }) {
  const charCount = value ? value.trim().length : 0;

  return (
    <div className="flex flex-col gap-2 h-full">
      <div className="flex justify-between items-baseline">
        <label
          htmlFor="job-description"
          className="text-sm sm:text-base font-semibold text-inverse-on-surface flex items-center gap-1.5"
        >
          <span className="material-symbols-outlined text-[18px] text-tertiary-fixed-dim">work</span>
          <span>Target Job Description</span>
          <span className="text-xs text-outline-variant font-normal">(Optional)</span>
        </label>
        <span className="text-xs text-outline-variant/80">
          {charCount} / 5000 chars
        </span>
      </div>

      <textarea
        id="job-description"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        rows={6}
        placeholder="Paste target job description to match skills, ATS keywords & role fit..."
        className={`w-full flex-1 min-h-[170px] sm:min-h-[195px] md:min-h-[210px] rounded-xl border bg-surface-variant/5 p-3.5 sm:p-4 text-xs sm:text-sm text-inverse-on-surface focus:border-inverse-primary focus:ring-2 focus:ring-inverse-primary/20 transition-all placeholder:text-outline-variant/50 resize-none outline-none leading-relaxed ${
          error
            ? "border-error/50 ring-2 ring-error/20"
            : "border-outline-variant/30 hover:border-outline-variant/50"
        }`}
      />

      {error ? (
        <p className="text-error text-xs flex items-center gap-1.5" role="alert">
          <span className="material-symbols-outlined text-[14px]">error</span>
          <span>{error}</span>
        </p>
      ) : (
        <p className="text-outline-variant text-xs flex items-center gap-1">
          <span className="material-symbols-outlined text-[14px] text-tertiary-fixed-dim shrink-0">tips_and_updates</span>
          <span className="truncate sm:whitespace-normal">Enables role-fit scoring & keyword gap analysis.</span>
        </p>
      )}
    </div>
  );
}

export default JobDescription;

