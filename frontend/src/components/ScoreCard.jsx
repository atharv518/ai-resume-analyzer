import React from "react";

function getRatingConfig(score, rating) {
  if (score >= 85) {
    return {
      badgeClass: "bg-tertiary-container/30 text-tertiary-fixed-dim border border-tertiary-fixed-dim/30",
      gaugeColor: "#4edea3", // tertiary-fixed-dim / emerald
      label: rating || "Excellent Match",
    };
  }
  if (score >= 70) {
    return {
      badgeClass: "bg-primary-container/30 text-inverse-primary border border-inverse-primary/30",
      gaugeColor: "#c0c1ff", // inverse-primary / indigo
      label: rating || "Strong Match",
    };
  }
  if (score >= 50) {
    return {
      badgeClass: "bg-[#78350f]/30 text-[#fde68a] border border-[#fde68a]/30",
      gaugeColor: "#fbbf24", // amber
      label: rating || "Moderate Match",
    };
  }
  return {
    badgeClass: "bg-error-container/30 text-error-container border border-error/30",
    gaugeColor: "#ba1a1a", // error
    label: rating || "Needs Improvement",
  };
}

function CircularGauge({ score, color, label }) {
  const radius = 45;
  const circumference = 2 * Math.PI * radius; // ~282.74
  const strokeDashoffset = circumference - (Math.min(100, Math.max(0, score)) / 100) * circumference;

  return (
    <div className="relative w-36 h-36 flex items-center justify-center">
      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
        <circle
          cx="50"
          cy="50"
          fill="none"
          r={radius}
          stroke="#3f465c"
          strokeWidth="6"
        />
        <circle
          cx="50"
          cy="50"
          fill="none"
          r={radius}
          stroke={color}
          strokeWidth="8"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="font-display-lg text-display-lg text-white tracking-tighter leading-none">
          {score}<span className="text-base text-outline-variant font-normal">%</span>
        </span>
        <span className="font-label-md text-label-md text-tertiary-fixed-dim mt-1">
          {label}
        </span>
      </div>
    </div>
  );
}

function CategoryBar({ label, value, colorClass = "bg-tertiary-fixed-dim" }) {
  const displayVal = value !== null && value !== undefined ? value : 0;

  return (
    <div>
      <div className="flex justify-between font-label-md text-label-md text-outline-variant mb-xs">
        <span>{label}</span>
        <span className="text-inverse-on-surface font-semibold">{displayVal}%</span>
      </div>
      <div className="h-2 w-full bg-on-secondary-fixed-variant/40 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ease-out ${colorClass}`}
          style={{ width: `${Math.max(4, Math.min(100, displayVal))}%` }}
        />
      </div>
    </div>
  );
}

function ScoreCard({ atsScore, candidateType }) {
  if (!atsScore) return null;

  const { overall_score, rating, breakdown, summary_feedback } = atsScore;
  const config = getRatingConfig(overall_score, rating);

  return (
    <div className="glass-card rounded-xl p-lg">
      <div className="flex items-center justify-between mb-md">
        <h3 className="font-title-lg text-title-lg text-white flex items-center gap-2">
          <span className="material-symbols-outlined text-inverse-primary text-[20px]">
            analytics
          </span>
          <span>ATS Compatibility</span>
        </h3>
        <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${config.badgeClass}`}>
          {config.label}
        </span>
      </div>

      <div className="flex flex-col items-center justify-center my-md">
        <CircularGauge
          score={overall_score}
          color={config.gaugeColor}
          label={rating || "Score"}
        />
      </div>

      {summary_feedback && (
        <p className="font-body-md text-body-md text-outline-variant text-xs mb-md leading-relaxed text-center">
          {summary_feedback}
        </p>
      )}

      <div className="space-y-sm pt-sm border-t border-outline-variant/20">
        <CategoryBar
          label="Skills Match"
          value={breakdown?.skills_score}
          colorClass="bg-tertiary-fixed-dim"
        />
        <CategoryBar
          label="Keyword Density"
          value={breakdown?.keyword_score}
          colorClass="bg-primary-fixed-dim"
        />
        <CategoryBar
          label="Project Scope"
          value={breakdown?.projects_score}
          colorClass="bg-secondary-fixed"
        />
        {breakdown?.experience_score !== null && breakdown?.experience_score !== undefined ? (
          <CategoryBar
            label="Work Experience"
            value={breakdown.experience_score}
            colorClass="bg-tertiary-fixed"
          />
        ) : (
          <CategoryBar
            label="Formatting & Structure"
            value={breakdown?.structure_score}
            colorClass="bg-tertiary-fixed"
          />
        )}
      </div>
    </div>
  );
}

export default ScoreCard;
