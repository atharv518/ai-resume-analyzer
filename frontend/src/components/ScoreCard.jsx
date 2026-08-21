import React from "react";

function getRatingConfig(score, rating) {
  if (score >= 85) {
    return {
      badgeClass: "bg-emerald-100 text-emerald-800 border-emerald-300",
      gaugeColor: "#10b981", // emerald-500
      glowColor: "shadow-emerald-100",
      label: rating || "Excellent Match",
    };
  }
  if (score >= 70) {
    return {
      badgeClass: "bg-blue-100 text-blue-800 border-blue-300",
      gaugeColor: "#3b82f6", // blue-500
      glowColor: "shadow-blue-100",
      label: rating || "Strong Match",
    };
  }
  if (score >= 50) {
    return {
      badgeClass: "bg-amber-100 text-amber-800 border-amber-300",
      gaugeColor: "#f59e0b", // amber-500
      glowColor: "shadow-amber-100",
      label: rating || "Moderate Match",
    };
  }
  return {
    badgeClass: "bg-rose-100 text-rose-800 border-rose-300",
    gaugeColor: "#f43f5e", // rose-500
    glowColor: "shadow-rose-100",
    label: rating || "Needs Improvement",
  };
}

function CircularGauge({ score, color }) {
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div className="relative flex items-center justify-center">
      <svg className="h-36 w-36 -rotate-90 transform" viewBox="0 0 128 128">
        <circle
          cx="64"
          cy="64"
          r={radius}
          stroke="#e2e8f0"
          strokeWidth="10"
          fill="transparent"
        />
        <circle
          cx="64"
          cy="64"
          r={radius}
          stroke={color}
          strokeWidth="10"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          fill="transparent"
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute flex flex-col items-center justify-center text-center">
        <span className="text-3xl font-extrabold tracking-tight text-slate-900">{score}</span>
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">/ 100</span>
      </div>
    </div>
  );
}

function CategoryBar({ label, value, description }) {
  const displayVal = value !== null && value !== undefined ? value : 0;

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 transition hover:bg-slate-50">
      <div className="flex items-center justify-between text-sm">
        <span className="font-semibold text-slate-800">{label}</span>
        <span className="font-bold text-slate-900">{displayVal}%</span>
      </div>
      <div className="mt-2.5 h-2 w-full overflow-hidden rounded-full bg-slate-200">
        <div
          className="h-full rounded-full bg-slate-900 transition-all duration-700 ease-out"
          style={{ width: `${Math.max(4, Math.min(100, displayVal))}%` }}
        />
      </div>
      {description && (
        <p className="mt-2 text-xs text-slate-500">{description}</p>
      )}
    </div>
  );
}

function ScoreCard({ atsScore, candidateType }) {
  if (!atsScore) return null;

  const { overall_score, rating, breakdown, summary_feedback } = atsScore;
  const config = getRatingConfig(overall_score, rating);

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
      {/* Top Header & Gauge */}
      <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-center sm:text-left">
          <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              ATS Compatibility Analysis
            </span>
            <span
              className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${config.badgeClass}`}
            >
              {config.label}
            </span>
          </div>
          <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
            Overall ATS Score
          </h2>
          <p className="mt-2 max-w-lg text-sm leading-relaxed text-slate-600">
            {summary_feedback}
          </p>
        </div>

        <div className="shrink-0">
          <CircularGauge score={overall_score} color={config.gaugeColor} />
        </div>
      </div>

      <div className="my-6 border-t border-slate-200" />

      {/* Category Breakdown Grid */}
      <div>
        <h3 className="mb-4 text-xs font-bold uppercase tracking-wider text-slate-500">
          Scoring Category Breakdown
        </h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <CategoryBar
            label="Skills Match"
            value={breakdown.skills_score}
            description="Core technical & soft skills alignment with role requirements"
          />
          <CategoryBar
            label="Keyword Match"
            value={breakdown.keyword_score}
            description="Domain terminology and keyword density coverage"
          />
          <CategoryBar
            label="Project Relevance"
            value={breakdown.projects_score}
            description="Practical application scope, stack, and measurable metrics"
          />
          {breakdown.experience_score !== null && breakdown.experience_score !== undefined ? (
            <CategoryBar
              label="Work Experience"
              value={breakdown.experience_score}
              description="Role seniority and commercial experience match"
            />
          ) : (
            <CategoryBar
              label="Resume Structure"
              value={breakdown.structure_score}
              description="Format clarity, contact completeness, and readability"
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default ScoreCard;
