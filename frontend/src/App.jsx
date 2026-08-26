import React, { useState, useEffect, useCallback } from "react";
import AnalyzerPage from "./pages/AnalyzerPage";
import ResultsPage from "./pages/ResultsPage";
import ErrorBoundary from "./components/ErrorBoundary";

// Clear any legacy persisted data to ensure complete privacy
try {
  sessionStorage.removeItem("ai_resume_latest_analysis");
  sessionStorage.removeItem("ai_resume_job_description");
} catch {
  // Ignore storage exceptions
}

function App() {
  // Pure in-memory state: data never persists across page reloads or new visits
  const [analysisResult, setAnalysisResult] = useState(null);
  const [jobDescription, setJobDescription] = useState("");
  const [resumeFile, setResumeFile] = useState(null);
  const [currentPage, setCurrentPage] = useState("upload");

  // Clean URL hash on fresh load if no in-memory analysis exists
  useEffect(() => {
    if (window.location.hash === "#results" && !analysisResult) {
      window.history.replaceState({ page: "upload" }, "", window.location.pathname + window.location.search);
    }
  }, [analysisResult]);

  // Handle browser back/forward buttons during active session
  useEffect(() => {
    const handlePopState = (event) => {
      const pageState = event.state?.page || (window.location.hash === "#results" ? "results" : "upload");
      if (pageState === "results" && analysisResult) {
        setCurrentPage("results");
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }
      setCurrentPage("upload");
      window.scrollTo({ top: 0, behavior: "smooth" });
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [analysisResult]);

  const handleAnalysisSuccess = useCallback((result) => {
    setAnalysisResult(result);
    setCurrentPage("results");
    window.history.pushState({ page: "results" }, "", "#results");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const handleBackToUpload = useCallback(() => {
    setCurrentPage("upload");
    window.history.pushState({ page: "upload" }, "", window.location.pathname + window.location.search);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const handleViewSavedResults = useCallback(() => {
    if (analysisResult) {
      setCurrentPage("results");
      window.history.pushState({ page: "results" }, "", "#results");
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [analysisResult]);

  const handleReset = useCallback(() => {
    setAnalysisResult(null);
    setResumeFile(null);
    setJobDescription("");
    setCurrentPage("upload");
    window.history.replaceState({ page: "upload" }, "", window.location.pathname + window.location.search);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  return (
    <ErrorBoundary onReset={handleReset}>
      {currentPage === "results" && analysisResult ? (
        <ResultsPage
          result={analysisResult}
          onBack={handleBackToUpload}
          onReset={handleReset}
        />
      ) : (
        <AnalyzerPage
          resumeFile={resumeFile}
          setResumeFile={setResumeFile}
          jobDescription={jobDescription}
          setJobDescription={setJobDescription}
          onAnalysisSuccess={handleAnalysisSuccess}
          hasSavedResult={Boolean(analysisResult)}
          onViewSavedResult={handleViewSavedResults}
          onClearSavedResult={handleReset}
        />
      )}
    </ErrorBoundary>
  );
}

export default App;
