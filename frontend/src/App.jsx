import React, { useState } from "react";
import AnalyzerPage from "./pages/AnalyzerPage";
import ResultsPage from "./pages/ResultsPage";

function App() {
  const [currentPage, setCurrentPage] = useState("upload"); // "upload" | "results"
  const [resumeFile, setResumeFile] = useState(null);
  const [jobDescription, setJobDescription] = useState("");
  const [analysisResult, setAnalysisResult] = useState(null);

  const handleAnalysisSuccess = (result) => {
    setAnalysisResult(result);
    setCurrentPage("results");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleBackToUpload = () => {
    setCurrentPage("upload");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (currentPage === "results" && analysisResult) {
    return (
      <ResultsPage
        result={analysisResult}
        onBack={handleBackToUpload}
      />
    );
  }

  return (
    <AnalyzerPage
      resumeFile={resumeFile}
      setResumeFile={setResumeFile}
      jobDescription={jobDescription}
      setJobDescription={setJobDescription}
      onAnalysisSuccess={handleAnalysisSuccess}
    />
  );
}

export default App;

