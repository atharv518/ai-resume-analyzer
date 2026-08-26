import React from "react";

const MAX_JD_CHARS = 10000;

function JobDescription({ value, onChange, error }) {
  const charCount = value ? value.length : 0;

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-baseline">
        <h2 className="text-lg font-semibold text-primary font-headline-md tracking-tight">
          Job Description
        </h2>
        <span className={`text-xs ${charCount > MAX_JD_CHARS ? "text-error font-semibold" : "text-on-surface-variant font-label-xs"}`}>
          {charCount.toLocaleString()} / {MAX_JD_CHARS.toLocaleString()} CHARS
        </span>
      </div>

      <textarea
        id="job-description"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        maxLength={MAX_JD_CHARS}
        placeholder="Paste the job description here (optional)..."
        className={`w-full h-[140px] bg-[#1C1C1E] border rounded-xl p-4 text-on-surface focus:outline-none focus:border-secondary/50 resize-none placeholder:text-outline-variant text-sm font-body-md transition-colors ${
          error
            ? "border-error/50 ring-1 ring-error/30"
            : "border-[#3A3A3C]"
        }`}
      />

      {error ? (
        <p className="text-error text-xs flex items-center gap-1.5" role="alert">
          <span className="material-symbols-outlined text-[14px]">error</span>
          <span>{error}</span>
        </p>
      ) : null}
    </div>
  );
}

export default React.memo(JobDescription);
