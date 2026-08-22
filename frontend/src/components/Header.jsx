import React from "react";

function Header() {
  return (
    <nav className="fixed top-0 left-0 w-full z-50 flex justify-between items-center px-lg py-md max-w-full bg-on-surface/80 backdrop-blur-md shadow-sm border-b border-outline-variant/30">
      <a href="/" className="flex items-center gap-2 group transition-transform active:scale-95">
        <div className="w-8 h-8 rounded-lg bg-inverse-primary/20 border border-inverse-primary/30 flex items-center justify-center text-inverse-primary">
          <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>
            description
          </span>
        </div>
        <span className="font-headline-md text-headline-md font-bold text-inverse-primary tracking-tight">
          AI Resume Analyzer
        </span>
      </a>

      <div className="flex items-center gap-sm">
        <button
          type="button"
          aria-label="Account info"
          className="text-inverse-primary hover:bg-surface-variant/10 transition-colors rounded-full p-2 active:scale-95 duration-200"
        >
          <span className="material-symbols-outlined text-[24px]">account_circle</span>
        </button>
      </div>
    </nav>
  );
}

export default Header;
