import React from "react";

function JobDescription({ value, onChange }) {
  return (
    <section aria-labelledby="job-description-heading">
      <div className="mb-3">
        <h2 id="job-description-heading" className="text-base font-semibold text-slate-900">
          Job Description <span className="font-normal text-slate-500">(Optional)</span>
        </h2>
        <p className="mt-1 text-sm leading-6 text-slate-500">
          Paste the job description to receive role-specific ATS matching and personalized suggestions.
        </p>
      </div>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        rows={8}
        placeholder="Paste the job description here..."
        className="w-full resize-y rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm leading-6 text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-slate-900 focus:ring-2 focus:ring-slate-900/15"
      />
    </section>
  );
}

export default JobDescription;
