import React, { useState } from "react";
import Header from "../components/Header";
import JobDescription from "../components/JobDescription";
import ResumeUpload from "../components/ResumeUpload";
import StatusMessage from "../components/StatusMessage";
import { submitResume } from "../services/api";

function LoadingSpinner() {
  return (
    <svg className="h-5 w-5 animate-spin text-on-primary-container" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
    </svg>
  );
}

function AnalyzerPage({
  resumeFile,
  setResumeFile,
  jobDescription,
  setJobDescription,
  onAnalysisSuccess,
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [jdError, setJdError] = useState("");

  const handleFileChange = (file) => {
    setResumeFile(file);
    setError("");
  };

  const handleJdChange = (text) => {
    setJobDescription(text);
    if (jdError && text.trim().length >= 10) {
      setJdError("");
    }
  };

  const clearRequestState = () => {
    setError("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setJdError("");

    if (!resumeFile) {
      setError("Please select a valid PDF or DOCX resume before continuing.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await submitResume({ resumeFile, jobDescription });
      onAnalysisSuccess(response);
    } catch (requestError) {
      setError(requestError.message || "The resume could not be analyzed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="text-inverse-on-surface antialiased selection:bg-inverse-primary/20 selection:text-inverse-primary min-h-screen lg:h-screen lg:max-h-screen lg:overflow-hidden flex flex-col bg-on-surface">
      <Header />

      {/* Main Content Canvas — Sleek Centered Rectangular Hero & Card */}
      <main className="flex-1 pt-14 sm:pt-16 pb-4 sm:pb-6 px-4 sm:px-6 lg:px-8 flex flex-col justify-center items-center w-full max-w-5xl mx-auto overflow-hidden">
        <div className="w-full flex flex-col gap-4 sm:gap-6 my-auto">
          {/* Hero Header Section */}
          <header className="flex flex-col items-center text-center gap-1.5 sm:gap-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-variant/10 border border-inverse-primary/20 text-inverse-primary text-xs sm:text-sm font-medium shadow-sm">
              <span className="material-symbols-outlined text-[15px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                auto_awesome
              </span>
              <span>AI-Powered ATS Optimization</span>
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white tracking-tight">
              AI ATS Resume Analyzer
            </h1>
            <p className="text-xs sm:text-sm md:text-base text-outline-variant max-w-xl leading-relaxed">
              Upload your resume and optional target job description for instant ATS scoring, skill matching, and actionable suggestions.
            </p>
          </header>

          {/* Upload Form Card — Spacious Rectangular Layout */}
          <form
            onSubmit={handleSubmit}
            className="glass-card rounded-2xl sm:rounded-3xl p-5 sm:p-7 md:p-8 flex flex-col gap-4 sm:gap-5 w-full shadow-2xl border border-outline-variant/30"
          >
            {/* 2-Column Grid on Tablet/Desktop */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 items-stretch">
              <div className="flex flex-col">
                <ResumeUpload
                  file={resumeFile}
                  onFileChange={handleFileChange}
                  onSelectionStart={clearRequestState}
                />
              </div>

              <div className="flex flex-col">
                <JobDescription
                  value={jobDescription}
                  onChange={handleJdChange}
                  error={jdError}
                />
              </div>
            </div>

            {error && <StatusMessage type="error">{error}</StatusMessage>}

            {/* Analysis In-Progress Banner */}
            {isSubmitting && (
              <div className="rounded-xl border border-inverse-primary/30 bg-inverse-primary/10 p-3 text-center backdrop-blur-sm">
                <p className="text-sm font-semibold text-inverse-primary">
                  Analyzing resume{jobDescription?.trim() ? " against target job description" : ""}...
                </p>
                <p className="text-xs text-outline-variant mt-0.5">
                  Parsing structure, evaluating skills match, and calculating ATS compatibility.
                </p>
              </div>
            )}

            {/* Submit Action Button */}
            <div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 sm:py-4 px-6 bg-primary text-on-primary text-sm sm:text-base font-bold rounded-xl shadow-lg hover:bg-primary-container hover:shadow-primary/25 transition-all active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50 flex justify-center items-center gap-2 cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <LoadingSpinner />
                    <span>Processing Analysis...</span>
                  </>
                ) : (
                  <>
                    <span>Analyze Resume</span>
                    <span className="material-symbols-outlined text-[18px] sm:text-[20px]">arrow_forward</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Feature Badges Strip */}
          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-6 text-xs sm:text-sm text-outline-variant pt-1">
            <span className="inline-flex items-center gap-1.5 font-medium">
              <span className="material-symbols-outlined text-[16px] text-inverse-primary">fact_check</span>
              <span>Deterministic ATS Scoring</span>
            </span>
            <span className="hidden sm:inline text-outline-variant/40">•</span>
            <span className="inline-flex items-center gap-1.5 font-medium">
              <span className="material-symbols-outlined text-[16px] text-tertiary-fixed-dim">troubleshoot</span>
              <span>Skill Gap Detection</span>
            </span>
            <span className="hidden sm:inline text-outline-variant/40">•</span>
            <span className="inline-flex items-center gap-1.5 font-medium">
              <span className="material-symbols-outlined text-[16px] text-secondary-fixed-dim">shield_lock</span>
              <span>100% In-Memory Privacy</span>
            </span>
          </div>
        </div>
      </main>
    </div>
  );
}

export default AnalyzerPage;
