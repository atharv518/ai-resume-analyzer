import React, { useState } from "react";
import Header from "../components/Header";
import GridCanvas from "../components/GridCanvas";
import JobDescription from "../components/JobDescription";
import ResumeUpload from "../components/ResumeUpload";
import StatusMessage from "../components/StatusMessage";
import { submitResume } from "../services/api";

function LoadingSpinner() {
  return (
    <svg className="h-5 w-5 animate-spin text-[#0A0A0A]" viewBox="0 0 24 24" fill="none" aria-hidden="true">
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
  hasSavedResult,
  onViewSavedResult,
  onClearSavedResult,
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [jdError, setJdError] = useState("");

  const handleFileChange = (file) => {
    setResumeFile(file);
    setError("");
    setJdError("");
  };

  const handleJdChange = (text) => {
    setJobDescription(text);
    if (jdError && text.trim().length >= 10) {
      setJdError("");
    }
  };

  const clearRequestState = () => {
    setError("");
    setJdError("");
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
    <div className="bg-background text-on-surface font-body-md min-h-screen flex flex-col relative overflow-x-hidden selection:bg-secondary selection:text-on-secondary">
      {/* Interactive Grid Shader Background */}
      <GridCanvas />

      {/* Minimal Top Header */}
      <Header />

      {/* Main Content Canvas — Pure Minimal Centered Card */}
      <main id="main-content" className="relative z-10 flex-grow flex items-center justify-center p-4 w-full min-h-[calc(100vh-4rem)] pt-20 pb-8">
        <form
          onSubmit={handleSubmit}
          className="bg-[#18181A] border border-[#2C2C2E] rounded-xl p-6 sm:p-8 shadow-2xl w-full max-w-[600px] space-y-6 sm:space-y-8 backdrop-blur-sm bg-opacity-95"
        >
          {hasSavedResult && (
            <div className="p-3 bg-primary/10 border border-primary/25 rounded-lg flex items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2 text-primary font-medium">
                <span className="material-symbols-outlined text-[18px]">history</span>
                <span>Previous analysis results are available</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onViewSavedResult}
                  className="px-2.5 py-1 bg-primary text-black font-semibold rounded hover:bg-primary/90 transition-colors cursor-pointer"
                >
                  View Results →
                </button>
                <button
                  type="button"
                  onClick={onClearSavedResult}
                  className="text-outline-variant hover:text-white p-1 transition-colors cursor-pointer"
                  title="Clear saved results"
                >
                  <span className="material-symbols-outlined text-[16px]">close</span>
                </button>
              </div>
            </div>
          )}

          {/* Resume Upload Section */}
          <ResumeUpload
            file={resumeFile}
            onFileChange={handleFileChange}
            onSelectionStart={clearRequestState}
          />

          {/* Job Description Input Section */}
          <JobDescription
            value={jobDescription}
            onChange={handleJdChange}
            error={jdError}
          />

          {error && <StatusMessage type="error">{error}</StatusMessage>}

          {/* Action Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-primary text-[#0A0A0A] font-medium py-3.5 rounded-lg hover:bg-opacity-90 transition-all flex items-center justify-center gap-2 font-body-md shadow-md active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <LoadingSpinner />
                <span>Analyzing Resume...</span>
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-[20px]">bar_chart</span>
                <span>Analyze Resume</span>
              </>
            )}
          </button>
        </form>
      </main>
    </div>
  );
}

export default AnalyzerPage;
