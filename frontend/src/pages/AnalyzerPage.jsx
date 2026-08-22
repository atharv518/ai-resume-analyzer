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
    <div className="text-inverse-on-surface antialiased selection:bg-inverse-primary/20 selection:text-inverse-primary min-h-screen flex flex-col bg-on-surface">
      <Header />

      {/* Main Content Canvas */}
      <main className="flex-grow pt-[88px] pb-xl px-md md:px-lg flex justify-center w-full">
        <div className="max-w-3xl w-full flex flex-col gap-xl">
          {/* Header Section */}
          <header className="flex flex-col items-center text-center gap-md mt-lg">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface-variant/10 border border-inverse-primary/20 text-inverse-primary">
              <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                auto_awesome
              </span>
              <span className="font-label-md text-label-md">AI-Powered ATS Optimization</span>
            </div>
            <h1 className="font-display-lg text-display-lg hidden md:block text-inverse-on-surface">
              AI ATS Resume Analyzer
            </h1>
            <h1 className="font-headline-lg-mobile text-headline-lg-mobile md:hidden text-inverse-on-surface">
              AI ATS Resume Analyzer
            </h1>
            <p className="font-body-lg text-body-lg text-outline-variant max-w-2xl">
              Upload your resume and optionally paste your target job description for instant ATS scoring, keyword gap detection, and actionable suggestions.
            </p>
          </header>

          {/* Upload Form Card */}
          <form
            onSubmit={handleSubmit}
            className="glass-card rounded-xl p-lg flex flex-col gap-lg"
          >
            <ResumeUpload
              file={resumeFile}
              onFileChange={handleFileChange}
              onSelectionStart={clearRequestState}
            />

            <div className="h-[1px] w-full bg-outline-variant/20 my-1"></div>

            <JobDescription
              value={jobDescription}
              onChange={handleJdChange}
              error={jdError}
            />

            {error && <StatusMessage type="error">{error}</StatusMessage>}

            {/* Analysis In-Progress Banner */}
            {isSubmitting && (
              <div className="rounded-xl border border-inverse-primary/30 bg-inverse-primary/10 p-md text-center backdrop-blur-sm">
                <p className="font-title-lg text-title-lg text-inverse-primary">
                  Analyzing resume{jobDescription?.trim() ? " against target job description" : ""}...
                </p>
                <p className="font-body-md text-body-md text-outline-variant text-xs mt-1">
                  Parsing structure, evaluating skills match, and calculating ATS compatibility.
                </p>
              </div>
            )}

            {/* Submit Action */}
            <div className="pt-sm">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 px-4 bg-primary text-on-primary font-title-lg text-title-lg rounded-xl shadow-md hover:bg-primary-container transition-all active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 flex justify-center items-center gap-2 cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <LoadingSpinner />
                    <span>Processing Analysis...</span>
                  </>
                ) : (
                  <>
                    <span>Analyze Resume</span>
                    <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Features Grid */}
          <section className="grid grid-cols-1 md:grid-cols-3 gap-md mt-md">
            {/* Feature 1 */}
            <div className="glass-card rounded-xl p-md flex flex-col gap-sm hover:-translate-y-1 transition-transform duration-300">
              <div className="w-10 h-10 rounded-full bg-inverse-primary/20 flex items-center justify-center text-inverse-primary mb-1">
                <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
                  fact_check
                </span>
              </div>
              <h3 className="font-title-lg text-title-lg text-inverse-on-surface">
                Deterministic ATS Scoring
              </h3>
              <p className="font-body-md text-body-md text-outline-variant">
                Our engine mimics leading Applicant Tracking Systems to provide an accurate, unbiased parse score.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="glass-card rounded-xl p-md flex flex-col gap-sm hover:-translate-y-1 transition-transform duration-300">
              <div className="w-10 h-10 rounded-full bg-tertiary-fixed/20 flex items-center justify-center text-tertiary-fixed mb-1">
                <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
                  troubleshoot
                </span>
              </div>
              <h3 className="font-title-lg text-title-lg text-inverse-on-surface">
                Skill Gap Detection
              </h3>
              <p className="font-body-md text-body-md text-outline-variant">
                Pinpoints exact keywords and hard skills missing from your resume compared to the target role.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="glass-card rounded-xl p-md flex flex-col gap-sm hover:-translate-y-1 transition-transform duration-300">
              <div className="w-10 h-10 rounded-full bg-secondary-fixed/20 flex items-center justify-center text-secondary-fixed mb-1">
                <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
                  shield_lock
                </span>
              </div>
              <h3 className="font-title-lg text-title-lg text-inverse-on-surface">
                Privacy-Preserving
              </h3>
              <p className="font-body-md text-body-md text-outline-variant">
                Your data is analyzed securely in real-time and is never stored or used to train public models.
              </p>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

export default AnalyzerPage;


