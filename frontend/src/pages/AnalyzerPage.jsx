import React, { useState } from "react";
import Header from "../components/Header";
import JobDescription from "../components/JobDescription";
import ResumeUpload from "../components/ResumeUpload";
import StatusMessage from "../components/StatusMessage";
import { submitResume } from "../services/api";

function LoadingSpinner() {
  return (
    <svg className="h-5 w-5 animate-spin text-white" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
    </svg>
  );
}

function SparklesIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4 text-emerald-600" aria-hidden="true">
      <path d="M12 3v3m0 12v3M3 12h3m12 0h3m-3.5-6.5l-2 2m-7 7l-2 2m0-11l2 2m7 7l2 2" strokeLinecap="round" />
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
    <div className="min-h-screen bg-slate-50">
      <Header />
      <main className="mx-auto max-w-6xl px-5 py-10 sm:px-6 sm:py-14 lg:py-16">
        <div className="mx-auto max-w-2xl text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3.5 py-1 text-xs font-semibold text-slate-700">
            <SparklesIcon /> AI-Powered ATS Optimization
          </span>
          <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-950 sm:text-4xl lg:text-5xl">
            AI ATS Resume Analyzer
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-slate-600 sm:text-lg">
            Upload your resume and optionally paste your target job description for instant ATS scoring, keyword gap detection, and actionable suggestions.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="mx-auto mt-8 max-w-2xl rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8"
        >
          <div className="space-y-7">
            <ResumeUpload
              file={resumeFile}
              onFileChange={handleFileChange}
              onSelectionStart={clearRequestState}
            />

            <div className="border-t border-slate-200" />

            <JobDescription
              value={jobDescription}
              onChange={handleJdChange}
              error={jdError}
            />

            {error && <StatusMessage type="error">{error}</StatusMessage>}

            {/* Analysis In-Progress Banner */}
            {isSubmitting && (
              <div className="rounded-xl border border-indigo-100 bg-indigo-50/70 p-4 text-center">
                <p className="text-sm font-semibold text-indigo-900">
                  Analyzing resume{jobDescription?.trim() ? " against job description" : ""}...
                </p>
                <p className="mt-1 text-xs text-indigo-700">
                  Parsing text, analyzing technical skills, detecting experience, and calculating ATS score.
                </p>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-slate-400"
            >
              {isSubmitting ? (
                <>
                  <LoadingSpinner />
                  <span>Processing Analysis...</span>
                </>
              ) : (
                <span>Analyze Resume</span>
              )}
            </button>
          </div>
        </form>

        <div className="mx-auto mt-8 max-w-2xl grid grid-cols-1 gap-4 sm:grid-cols-3 text-center">
          <div className="rounded-xl border border-slate-200/80 bg-white p-4">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Deterministic ATS Scoring</h3>
            <p className="mt-1 text-xs text-slate-500">Structured scoring calibrated for both freshers and experienced candidates.</p>
          </div>
          <div className="rounded-xl border border-slate-200/80 bg-white p-4">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Skill Gap Detection</h3>
            <p className="mt-1 text-xs text-slate-500">Pinpoints missing keywords and required technologies from the job post.</p>
          </div>
          <div className="rounded-xl border border-slate-200/80 bg-white p-4">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Privacy-Preserving</h3>
            <p className="mt-1 text-xs text-slate-500">Secure analysis processed within your dedicated environment.</p>
          </div>
        </div>
      </main>
    </div>
  );
}

export default AnalyzerPage;


