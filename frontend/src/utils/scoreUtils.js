/**
 * Pure utility functions for ATS score ratings and badge configs.
 */

export function getRatingConfig(score, rating) {
  if (score >= 85) {
    return {
      badgeClass: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/25",
      gaugeColor: "#10b981", // emerald
      label: rating || "Excellent Match",
    };
  }
  if (score >= 70) {
    return {
      badgeClass: "bg-sky-500/10 text-sky-300 border border-sky-500/25",
      gaugeColor: "#38bdf8", // sky
      label: rating || "Strong Match",
    };
  }
  if (score >= 50) {
    return {
      badgeClass: "bg-amber-500/10 text-amber-300 border border-amber-500/25",
      gaugeColor: "#fbbf24", // amber
      label: rating || "Moderate Match",
    };
  }
  return {
    badgeClass: "bg-rose-500/10 text-rose-300 border border-rose-500/25",
    gaugeColor: "#f43f5e", // rose
    label: rating || "Needs Improvement",
  };
}
