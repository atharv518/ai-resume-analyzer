import React from "react";

function NovaLogo({ className = "w-8 h-8", glow = true }) {
  return (
    <div className={`relative flex items-center justify-center shrink-0 ${className}`}>
      {glow && (
        <div className="absolute inset-0 rounded-full bg-inverse-primary/20 blur-sm scale-110 -z-10 pointer-events-none"></div>
      )}
      <svg
        viewBox="0 0 512 512"
        className="w-full h-full select-none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <circle cx="256" cy="256" r="248" fill="#000000" />
        <circle cx="256" cy="256" r="220" fill="none" stroke="#ffffff" strokeWidth="22" />
        <text
          x="256"
          y="262"
          textAnchor="middle"
          fill="#ffffff"
          fontFamily="Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
          fontSize="208"
          fontWeight="900"
          letterSpacing="-2"
        >
          N
        </text>
        <line x1="144" y1="288" x2="368" y2="288" stroke="#ffffff" strokeWidth="14" strokeLinecap="round" />
        <text
          x="262"
          y="370"
          textAnchor="middle"
          fill="#ffffff"
          fontFamily="Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
          fontSize="72"
          fontWeight="800"
          letterSpacing="14"
        >
          ATS
        </text>
      </svg>
    </div>
  );
}

export default React.memo(NovaLogo);
