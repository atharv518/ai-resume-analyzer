import React, { useState } from "react";
import Header from "../components/Header";
import JobDescription from "../components/JobDescription";
import ResumeUpload from "../components/ResumeUpload";
import ResumeResults from "../components/ResumeResults";
import StatusMessage from "../components/StatusMessage";
import { submitResume } from "../services/api";

function AnalyzerPage() {
  const [resumeFile, setResumeFile] = useState(null);
  const [jobDescription, setJobDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  const handleFileChange = (file) => {
    setResumeFile(file);
    setError("");
    setResult(null);
  };

  const clearRequestState = () => {
    setError("");
    setResult(null);
  };

  const handleReset = () => {
    setResumeFile(null);
    setJobDescription("");
    setError("");
    setResult(null);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!resumeFile) {
      setError("Please select a valid PDF or DOCX resume before continuing.");
      return;
    }

    setIsSubmitting(true);
    clearRequestState();

    try {
      const response = await submitResume({ resumeFile, jobDescription });
      setResult(response);
    } catch (requestError) {
      setError(requestError.message || "The resume could not be analyzed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      <main className="mx-auto max-w-6xl px-5 py-12 sm:px-6 sm:py-16 lg:py-20">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-600">Private resume workspace</p>
          <h1 className="mt-4 text-4xl font-bold tracking-tight text-slate-950 sm:text-5xl">
            AI Resume Analyzer
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-base leading-7 text-slate-600 sm:text-lg">
            Extract, parse, and review key details from your PDF and DOCX resumes locally.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mx-auto mt-10 max-w-2xl rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
          <div className="space-y-8">
            <ResumeUpload file={resumeFile} onFileChange={handleFileChange} onSelectionStart={clearRequestState} />
            <div className="border-t border-slate-200" />
            <JobDescription value={jobDescription} onChange={setJobDescription} />

            {error && <StatusMessage type="error">{error}</StatusMessage>}

            <button
              type="submit"
              disabled={!resumeFile || isSubmitting}
              className="flex w-full items-center justify-center rounded-xl bg-slate-900 px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {isSubmitting ? "Extracting & Analyzing Resume..." : "Analyze Resume"}
            </button>
          </div>
        </form>

        {result && (
          <div className="mx-auto max-w-2xl">
            <ResumeResults result={result} onReset={handleReset} />
          </div>
        )}

        <p className="mx-auto mt-5 max-w-2xl text-center text-xs leading-5 text-slate-500">
          Your resume is processed locally in your development environment.
        </p>
      </main>
    </div>
  );
}

export default AnalyzerPage;

