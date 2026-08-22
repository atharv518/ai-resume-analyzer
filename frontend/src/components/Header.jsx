import React from "react";

function Header() {
  return (
    <nav className="fixed top-0 left-0 w-full z-50 flex justify-between items-center px-4 sm:px-6 lg:px-8 h-14 sm:h-16 bg-on-surface/90 backdrop-blur-md shadow-sm border-b border-outline-variant/20">
      <a href="/" className="flex items-center gap-2 group transition-transform active:scale-95">
        <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-inverse-primary/20 border border-inverse-primary/30 flex items-center justify-center text-inverse-primary shrink-0">
          <span className="material-symbols-outlined text-[18px] sm:text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>
            description
          </span>
        </div>
        <span className="text-base sm:text-lg font-bold text-inverse-primary tracking-tight">
          AI Resume Analyzer
        </span>
      </a>

      <div className="flex items-center gap-2">
        <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface-variant/10 border border-inverse-primary/20 text-inverse-primary text-xs font-medium">
          <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>
            auto_awesome
          </span>
          <span>v2.0</span>
        </span>
      </div>
    </nav>
  );
}

export default Header;
