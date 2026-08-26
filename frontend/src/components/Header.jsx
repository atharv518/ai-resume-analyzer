import React from "react";
import NovaLogo from "./NovaLogo";

// Dynamically defined via vite.config.js define or fallback
const APP_VERSION = typeof __APP_VERSION__ !== "undefined" ? __APP_VERSION__ : "2.0.0";

function Header() {
  return (
    <>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] focus:px-4 focus:py-2 focus:bg-primary focus:text-on-primary focus:rounded-lg focus:shadow-lg focus:outline-none"
      >
        Skip to main content
      </a>
      <nav
        aria-label="Main Navigation"
        className="fixed top-0 left-0 w-full z-50 flex justify-between items-center px-4 sm:px-6 lg:px-8 h-14 sm:h-16 bg-[#000000]/70 backdrop-blur-md border-b border-[#2C2C2E]"
      >
        <a href="/" className="flex items-center gap-2.5 group transition-transform active:scale-95">
          <NovaLogo className="w-7 h-7 sm:w-8 sm:h-8" />
          <span className="text-base sm:text-lg font-bold text-white tracking-tight font-headline-md">
            Nova<span className="text-[#c4c7c8]">ATS</span>
          </span>
        </a>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#1C1C1E] border border-[#2C2C2E] text-on-surface text-xs font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-accent-cyan animate-pulse"></span>
            <span>v{APP_VERSION}</span>
          </span>
        </div>
      </nav>
    </>
  );
}

export default React.memo(Header);
