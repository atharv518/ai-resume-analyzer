import React from "react";

function StatusMessage({ type = "error", children }) {
  const isError = type === "error";

  return (
    <div
      role={isError ? "alert" : "status"}
      className={`rounded-xl border p-md text-sm flex items-start gap-2.5 backdrop-blur-sm ${
        isError
          ? "border-error/40 bg-error-container/20 text-error-container"
          : "border-tertiary-fixed-dim/40 bg-tertiary-container/20 text-tertiary-fixed-dim"
      }`}
    >
      <span className="material-symbols-outlined text-[18px] shrink-0 mt-0.5">
        {isError ? "error" : "check_circle"}
      </span>
      <div className="font-body-md text-body-md text-sm leading-relaxed">
        {children}
      </div>
    </div>
  );
}

export default StatusMessage;
