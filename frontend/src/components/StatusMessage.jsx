import React from "react";

function StatusMessage({ type = "error", children }) {
  const styles = {
    error: "border-red-200 bg-red-50 text-red-800",
    success: "border-emerald-200 bg-emerald-50 text-emerald-800",
  };

  return (
    <div
      role={type === "error" ? "alert" : "status"}
      className={`rounded-xl border px-4 py-3 text-sm ${styles[type]}`}
    >
      {children}
    </div>
  );
}

export default StatusMessage;
