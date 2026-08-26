/**
 * Pure utility functions for processing candidate project data.
 */

export function getRelevanceBadge(score) {
  const normalized = (score || "").toLowerCase();
  if (normalized.includes("high")) {
    return {
      className: "bg-emerald-500/10 text-emerald-400 border-emerald-500/25",
      label: "High Relevance",
      icon: "stars",
    };
  }
  if (normalized.includes("medium")) {
    return {
      className: "bg-sky-500/10 text-sky-300 border-sky-500/25",
      label: "Medium Relevance",
      icon: "verified",
    };
  }
  if (normalized.includes("low")) {
    return {
      className: "bg-amber-500/10 text-amber-300 border-amber-500/25",
      label: "Low Relevance",
      icon: "info",
    };
  }
  return {
    className: "bg-rose-500/10 text-rose-300 border-rose-500/25",
    label: "Not Relevant",
    icon: "warning",
  };
}

export function processProjects(parsedProjects = [], parsedStructuredProjects = [], projectEvals = []) {
  const allProjects = [];
  const evalMap = new Map();

  (projectEvals || []).forEach((p) => {
    const title = (p.project_title || p.project_name || p.title || "").toLowerCase().trim();
    if (title) evalMap.set(title, p);
  });

  // 1. Prefer structured projects from backend parser (up to 10)
  if (parsedStructuredProjects && parsedStructuredProjects.length > 0) {
    parsedStructuredProjects.slice(0, 10).forEach((item, idx) => {
      const title = item.title || `Project ${idx + 1}`;
      const desc = item.description || "";
      const technologies = item.technologies || [];
      const isOngoing = item.is_ongoing === true;
      const matchingEval = evalMap.get(title.toLowerCase());

      allProjects.push({
        title,
        description: desc,
        technologies,
        isOngoing,
        eval: matchingEval,
        rawText: `${title} ${desc}`,
      });
    });
  } else if (parsedProjects && parsedProjects.length > 0) {
    // 2. Fallback: parse string array candidates up to 10
    const rawItems = [];
    parsedProjects.forEach((item) => {
      const isObj = typeof item === "object" && item !== null;
      const str = isObj ? `${item.title || ""} – ${item.description || ""}` : String(item);
      const segments = str.split(/(?<=[.!?])\s+(?=[A-Z][A-Za-z0-9\s/&+\-]{2,45}\s+(?:[–—\-|:]|\([A-Za-z0-9,\s+]+\))\s+)/);
      segments.forEach((seg) => {
        if (seg.trim().length > 2) rawItems.push(seg.trim());
      });
    });

    rawItems.slice(0, 10).forEach((rawText, idx) => {
      let title = `Project ${idx + 1}`;
      let desc = "";

      let separated = false;
      for (const sep of [" – ", " — ", " | ", ": ", " - "]) {
        if (rawText.includes(sep)) {
          const parts = rawText.split(sep);
          const potentialTitle = parts[0].trim();
          if (potentialTitle.length <= 60) {
            title = potentialTitle;
            desc = parts.slice(1).join(sep).trim();
            separated = true;
            break;
          }
        }
      }

      if (!separated) {
        const lines = rawText.split("\n");
        title = lines[0].trim();
        desc = lines.slice(1).join(" ").trim();
      }

      const isOngoing =
        /\b(?:ongoing|in\s*[-–—]?\s*progress|currently\s+working\s+on|under\s+development|continuing)\b/i.test(rawText) ||
        /\((?:ongoing|current|present|in\s*progress)\)/i.test(rawText) ||
        /\b(?:(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s*)?(?:19|20)\d{2}\s*[\-\–\—\to]\s*(?:present|current)\b/i.test(rawText);

      const matchingEval = evalMap.get(title.toLowerCase()) || projectEvals?.[idx];
      const technologies =
        matchingEval?.technologies_detected ||
        matchingEval?.technologies ||
        [];

      allProjects.push({
        title,
        description: desc || matchingEval?.relevance_explanation || "",
        technologies,
        isOngoing,
        eval: matchingEval,
        rawText,
      });
    });
  } else if (projectEvals && projectEvals.length > 0) {
    // 3. Fallback: use project evaluations
    projectEvals.slice(0, 3).forEach((evalItem, idx) => {
      const title = evalItem.project_title || evalItem.project_name || evalItem.title || `Project ${idx + 1}`;
      const rawText = `${title} ${evalItem.relevance_explanation || ""} ${evalItem.improvement_suggestions || ""}`;
      const isOngoing =
        /\b(?:ongoing|in\s*[-–—]?\s*progress|currently\s+working\s+on|under\s+development|continuing)\b/i.test(rawText) ||
        /\((?:ongoing|current|present|in\s*progress)\)/i.test(rawText);

      allProjects.push({
        title,
        description: evalItem.relevance_explanation || "",
        technologies: evalItem.technologies_detected || evalItem.technologies || [],
        isOngoing,
        eval: evalItem,
        rawText,
      });
    });
  }

  const ongoingProjects = allProjects.filter((p) => p.isOngoing);
  const completedProjects = allProjects.filter((p) => !p.isOngoing);

  return {
    allProjects: allProjects.slice(0, 10),
    ongoingProjects: ongoingProjects.slice(0, 10),
    completedProjects: completedProjects.slice(0, 10),
    hasOngoing: ongoingProjects.length > 0,
  };
}
