import React from "react";

function Header() {
  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 sm:px-6">
        <a href="/" className="flex items-center gap-3 text-slate-900" aria-label="AI Resume Analyzer home">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-900 text-sm font-bold text-white">
            AR
          </span>
          <span className="text-base font-semibold tracking-tight">AI Resume Analyzer</span>
        </a>
      </div>
    </header>
  );
}

export default Header;
