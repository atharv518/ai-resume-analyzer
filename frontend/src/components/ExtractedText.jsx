import React, { useState, useMemo } from "react";
import { copyToClipboard } from "../utils/clipboardUtils";

function ExtractedText({ extractedText }) {
  const [showRawText, setShowRawText] = useState(false);
  const [copied, setCopied] = useState(false);
  const [copyFailed, setCopyFailed] = useState(false);

  const stats = useMemo(() => {
    if (!extractedText) return { chars: 0, words: 0, lines: 0, preview: "" };
    const trimmed = extractedText.trim();
    const chars = trimmed.length;
    const words = trimmed ? trimmed.split(/\s+/).filter(Boolean).length : 0;
    const lines = trimmed.split("\n").filter((l) => l.trim().length > 0).length;
    const preview = trimmed.slice(0, 220).replace(/\s+/g, " ");
    return { chars, words, lines, preview };
  }, [extractedText]);

  const handleCopy = async () => {
    if (!extractedText) return;
    const success = await copyToClipboard(extractedText);
    if (success) {
      setCopied(true);
      setCopyFailed(false);
      setTimeout(() => setCopied(false), 2000);
    } else {
      setCopyFailed(true);
      setTimeout(() => setCopyFailed(false), 3000);
    }
  };

  return (
    <div className="glass-card rounded-xl p-4 sm:p-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-xs sm:text-sm font-semibold text-white flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px] text-primary">
                raw_on
              </span>
              <span>Extracted Resume Text</span>
            </h3>
            {stats.chars > 0 && (
              <span className="px-2 py-0.5 rounded bg-surface-variant/20 border border-outline-variant/30 text-[10px] font-mono text-neutral-300">
                {stats.words.toLocaleString()} words · {stats.chars.toLocaleString()} chars
              </span>
            )}
          </div>
          <p className="text-[11px] text-neutral-400 mt-0.5">
            Inspect source text layer extracted from the uploaded document.
          </p>
        </div>

        <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-auto">
          {showRawText && (
            <button
              type="button"
              onClick={handleCopy}
              className="px-2.5 py-1 rounded-lg border border-outline-variant/30 bg-surface-variant/10 text-xs font-semibold text-primary hover:bg-surface-variant/20 transition-all flex items-center gap-1 cursor-pointer"
              title="Copy extracted text to clipboard"
            >
              <span className="material-symbols-outlined text-[13px]">
                {copied ? "check" : copyFailed ? "error" : "content_copy"}
              </span>
              <span>{copied ? "Copied" : copyFailed ? "Failed" : "Copy"}</span>
            </button>
          )}
          <button
            type="button"
            onClick={() => setShowRawText(!showRawText)}
            className="px-2.5 py-1 rounded-lg border border-outline-variant/30 bg-surface-variant/10 text-xs font-semibold text-white hover:bg-surface-variant/20 transition-all cursor-pointer flex items-center gap-1"
          >
            <span className="material-symbols-outlined text-[14px]">
              {showRawText ? "expand_less" : "expand_more"}
            </span>
            <span>{showRawText ? "Hide Full Text" : "Show Full Text"}</span>
          </button>
        </div>
      </div>

      {/* Collapsed Preview */}
      {!showRawText && stats.chars > 0 && (
        <div
          onClick={() => setShowRawText(true)}
          className="mt-2.5 p-2.5 rounded-lg bg-surface-variant/5 border border-outline-variant/15 text-xs text-neutral-400 hover:border-outline-variant/40 transition-colors cursor-pointer group"
          title="Click to view full text"
        >
          <div className="flex items-center justify-between text-[10px] text-neutral-500 mb-1">
            <span>PREVIEW</span>
            <span className="group-hover:text-primary transition-colors flex items-center gap-0.5">
              <span>Click to expand</span>
              <span className="material-symbols-outlined text-[12px]">open_in_full</span>
            </span>
          </div>
          <p className="font-mono text-[11px] leading-relaxed text-neutral-300 line-clamp-2">
            "{stats.preview}..."
          </p>
        </div>
      )}

      {/* Expanded Full View */}
      {showRawText && (
        <div className="mt-3 animate-fade-in-up">
          <pre className="max-h-60 overflow-y-auto whitespace-pre-wrap rounded-xl bg-neutral-900 border border-outline-variant/20 p-3 font-mono text-[11px] leading-relaxed text-neutral-200">
            {extractedText || "No text extracted."}
          </pre>
        </div>
      )}
    </div>
  );
}

export default React.memo(ExtractedText);
