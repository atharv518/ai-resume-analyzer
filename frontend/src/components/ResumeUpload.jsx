import React, { useRef, useState } from "react";

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const SUPPORTED_EXTENSIONS = [".pdf", ".docx"];

function formatFileSize(bytes) {
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function getValidationMessage(file) {
  if (!file) {
    return "Please choose a resume file.";
  }

  const filename = file.name.toLowerCase();
  const isSupported = SUPPORTED_EXTENSIONS.some((extension) => filename.endsWith(extension));

  if (!isSupported) {
    return "Please upload a PDF or DOCX resume.";
  }

  if (file.size > MAX_FILE_SIZE) {
    return "Your resume must be 10 MB or smaller.";
  }

  return null;
}

function UploadIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-8 w-8" aria-hidden="true">
      <path d="M12 16V4m0 0L8 8m4-4 4 4M5 15v3.2A1.8 1.8 0 0 0 6.8 20h10.4a1.8 1.8 0 0 0 1.8-1.8V15" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function DocumentIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-6 w-6" aria-hidden="true">
      <path d="M14 2.75H6.75A1.75 1.75 0 0 0 5 4.5v15A1.75 1.75 0 0 0 6.75 21h10.5A1.75 1.75 0 0 0 19 19.25V7.75L14 2.75Z" strokeLinejoin="round" />
      <path d="M14 2.75v5h5M8.5 13h7M8.5 16.5h5" strokeLinecap="round" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4" aria-hidden="true">
      <path d="m5 12 4.5 4.5L19 7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ResumeUpload({ file, onFileChange, onSelectionStart }) {
  const fileInputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [validationError, setValidationError] = useState("");

  const handleFile = (nextFile) => {
    const errorMessage = getValidationMessage(nextFile);

    if (errorMessage) {
      setValidationError(errorMessage);
      return;
    }

    setValidationError("");
    onFileChange(nextFile);
  };

  const openFilePicker = () => {
    onSelectionStart();
    fileInputRef.current?.click();
  };

  const handleInputChange = (event) => {
    handleFile(event.target.files?.[0]);
    event.target.value = "";
  };

  const handleDragOver = (event) => {
    event.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (event) => {
    if (!event.currentTarget.contains(event.relatedTarget)) {
      setIsDragging(false);
    }
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setIsDragging(false);
    onSelectionStart();
    handleFile(event.dataTransfer.files?.[0]);
  };

  return (
    <section aria-labelledby="resume-upload-heading">
      <div className="mb-3">
        <h2 id="resume-upload-heading" className="text-base font-semibold text-slate-900">
          Upload your Resume
        </h2>
        <p className="mt-1 text-sm text-slate-500">PDF and DOCX files up to 10 MB.</p>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        onChange={handleInputChange}
        className="sr-only"
        aria-label="Choose a resume file"
      />

      {file ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-4 sm:flex sm:items-center sm:justify-between sm:gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-white text-emerald-700 shadow-sm">
              <DocumentIcon />
            </span>
            <div className="min-w-0">
              <p className="truncate font-medium text-slate-900" title={file.name}>{file.name}</p>
              <p className="mt-0.5 text-sm text-slate-500">{formatFileSize(file.size)}</p>
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between gap-4 sm:mt-0 sm:justify-end">
            <span className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-700">
              <CheckIcon /> Ready to analyze
            </span>
            <button
              type="button"
              onClick={openFilePicker}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2"
            >
              Replace File
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={openFilePicker}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`flex w-full flex-col items-center rounded-xl border-2 border-dashed px-6 py-11 text-center transition focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2 ${
            isDragging
              ? "border-slate-900 bg-slate-100"
              : "border-slate-300 bg-slate-50/70 hover:border-slate-400 hover:bg-slate-50"
          }`}
          aria-describedby="upload-help upload-error"
        >
          <span className={`mb-4 flex h-14 w-14 items-center justify-center rounded-full ${isDragging ? "bg-slate-900 text-white" : "bg-white text-slate-700 shadow-sm"}`}>
            <UploadIcon />
          </span>
          <span className="text-base font-semibold text-slate-900">
            {isDragging ? "Drop your resume here" : "Drag & drop your resume here"}
          </span>
          <span className="mt-2 text-sm text-slate-500">or</span>
          <span className="mt-3 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white">Browse Files</span>
          <span id="upload-help" className="mt-4 text-xs text-slate-500">Supported formats: PDF, DOCX</span>
        </button>
      )}

      {validationError && (
        <p id="upload-error" role="alert" className="mt-3 text-sm text-red-600">
          {validationError}
        </p>
      )}
    </section>
  );
}

export default ResumeUpload;
