import React, { useState } from "react";
import { getRatingConfig } from "../utils/scoreUtils";

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
          stroke="#2C2C2E"
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
        <span className="text-3xl sm:text-4xl font-bold text-white tracking-tighter leading-none">
          {score}<span className="text-sm font-normal text-neutral-400">%</span>
        </span>
        <span className="text-[11px] font-semibold text-accent-cyan mt-1 tracking-wide uppercase">
          {label}
        </span>
      </div>
    </div>
  );
}

function MetricTooltip({ explanation, calculation }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative inline-flex items-center">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        onMouseEnter={() => setIsOpen(true)}
        onMouseLeave={() => setIsOpen(false)}
        className="text-neutral-400 hover:text-white transition-colors cursor-pointer p-0.5 focus:outline-none"
        aria-label="View metric explanation"
      >
        <span className="material-symbols-outlined text-[14px]">info</span>
      </button>

      {isOpen && (
        <div
          role="tooltip"
          className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-64 p-2.5 rounded-lg bg-[#202024] border border-[#3A3A3C] shadow-2xl text-[11px] text-neutral-200 z-50 pointer-events-none animate-fade-in-up"
        >
          <div className="font-semibold text-white mb-1 flex items-center gap-1">
            <span className="material-symbols-outlined text-[13px] text-accent-cyan">help</span>
            <span>How this is scored</span>
          </div>
          <p className="leading-snug text-neutral-300 mb-1.5">{explanation}</p>
          {calculation && (
            <div className="pt-1 border-t border-neutral-700 text-[10px] text-neutral-400 font-mono">
              Calculation: {calculation}
            </div>
          )}
          {/* Tooltip arrow */}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-[#202024]" />
        </div>
      )}
    </div>
  );
}

function CategoryBar({ label, value, weight, explanation, calculation, colorClass = "bg-primary" }) {
  const displayVal = value !== null && value !== undefined ? Math.round(value) : 0;

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-1.5 text-neutral-300 font-medium">
          <span>{label}</span>
          <MetricTooltip explanation={explanation} calculation={calculation} />
          {weight !== undefined && (
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-neutral-800 text-neutral-400 font-mono">
              {Math.round(weight * 100)}% wt
            </span>
          )}
        </div>
        <span className="text-white font-semibold font-mono">{displayVal}%</span>
      </div>
      <div className="h-2 w-full bg-[#242426] rounded-full overflow-hidden">
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

  const { overall_score, rating, breakdown, weights_used, summary_feedback } = atsScore;
  const config = getRatingConfig(overall_score, rating);

  const isExperienced = candidateType === "experienced" && breakdown?.experience_score !== null && breakdown?.experience_score !== undefined;

  // Derive weights if not explicitly passed
  const weights = weights_used || (isExperienced ? {
    skills: 0.25,
    experience: 0.30,
    structure: 0.15,
    projects: 0.10,
    education: 0.10,
    keywords: 0.10,
  } : {
    skills: 0.30,
    projects: 0.25,
    structure: 0.15,
    education: 0.15,
    keywords: 0.15,
  });

  return (
    <div className="glass-card rounded-xl p-4 sm:p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm sm:text-base font-semibold text-white flex items-center gap-2">
          <span className="material-symbols-outlined text-accent-cyan text-[20px]">
            analytics
          </span>
          <span>ATS Compatibility</span>
        </h3>
        <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${config.badgeClass}`}>
          {config.label}
        </span>
      </div>

      <div className="flex flex-col items-center justify-center my-3">
        <CircularGauge
          score={overall_score}
          color={config.gaugeColor}
          label={rating || "Score"}
        />
      </div>

      {summary_feedback && (
        <p className="text-xs text-neutral-300 mb-4 leading-relaxed text-center bg-[#202024]/50 border border-outline-variant/30 rounded-lg p-2.5">
          {summary_feedback}
        </p>
      )}

      <div className="space-y-3 pt-3 border-t border-outline-variant/20">
        {/* Skills Match */}
        <CategoryBar
          label="Skills Match"
          value={breakdown?.skills_score}
          weight={weights.skills}
          explanation="Measures exact and semantic match of required technical skills against candidate skills identified in the resume."
          calculation="Exact & canonical skill matches / Required skills"
          colorClass="bg-emerald-400"
        />

        {/* Work Experience (if experienced candidate) */}
        {isExperienced && (
          <CategoryBar
            label="Work Experience"
            value={breakdown.experience_score}
            weight={weights.experience}
            explanation="Evaluates seniority, years of professional experience, and alignment of previous roles with job requirements."
            calculation="Calculated from career duration, role titles, and responsibilities"
            colorClass="bg-indigo-400"
          />
        )}

        {/* Project Scope */}
        <CategoryBar
          label="Project Scope"
          value={breakdown?.projects_score}
          weight={weights.projects}
          explanation="Assesses technical depth, production complexity, impact metrics, and project relevance to target roles."
          calculation="Project count, tech stack alignment, and measurable outcomes"
          colorClass="bg-purple-400"
        />

        {/* Keyword Density */}
        <CategoryBar
          label="Keyword Density"
          value={breakdown?.keyword_score}
          weight={weights.keywords}
          explanation="Quantifies contextual coverage of core industry keywords, frameworks, and domain concepts."
          calculation="Density of JD keywords found across resume sections"
          colorClass="bg-sky-400"
        />

        {/* Formatting & Structure (Always visible!) */}
        <CategoryBar
          label="Formatting & Structure"
          value={breakdown?.structure_score}
          weight={weights.structure}
          explanation="Verifies essential contact info (email, phone, name), standard ATS header naming, section segmentation, and bullet structure."
          calculation="Presence of contact info, standard headers, and parsable bullets"
          colorClass="bg-teal-400"
        />

        {/* Education & Credentials */}
        {breakdown?.education_score !== null && breakdown?.education_score !== undefined && (
          <CategoryBar
            label="Education & Credentials"
            value={breakdown.education_score}
            weight={weights.education}
            explanation="Verifies degree relevance, academic background, and industry-recognized certifications."
            calculation="Degree level, field of study, and verified certifications"
            colorClass="bg-amber-400"
          />
        )}
      </div>
    </div>
  );
}

export default ScoreCard;
