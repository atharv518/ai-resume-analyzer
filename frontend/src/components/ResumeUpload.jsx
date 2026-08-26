import React, { useRef, useState } from "react";

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const SUPPORTED_EXTENSIONS = [".pdf", ".docx", ".txt", ".rtf"];

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
    return "Please upload a PDF, DOCX, TXT, or RTF resume.";
  }

  if (file.size > MAX_FILE_SIZE) {
    return "Your resume must be 10 MB or smaller.";
  }

  return null;
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
    if (onSelectionStart) onSelectionStart();
    fileInputRef.current?.click();
  };

  const handleInputChange = (event) => {
    if (event.target.files?.[0]) {
      handleFile(event.target.files[0]);
    }
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
    if (onSelectionStart) onSelectionStart();
    if (event.dataTransfer.files?.[0]) {
      handleFile(event.dataTransfer.files[0]);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-baseline">
        <h2 className="text-[20px] sm:text-[22px] font-semibold text-primary font-headline-md tracking-tight">
          Upload your Resume
        </h2>
        <span className="text-xs text-on-surface-variant font-label-xs">
          PDF, DOCX, TXT, RTF (MAX 10MB)
        </span>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.docx,.txt,.rtf,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain,application/rtf,text/rtf"
        onChange={handleInputChange}
        className="hidden"
        id="resume-upload"
        aria-label="Upload Resume"
      />

      {file ? (
        <div className="border border-[#3A3A3C] rounded-xl min-h-[190px] sm:min-h-[200px] bg-[#1C1C1E] p-5 sm:p-6 flex flex-col justify-between gap-3">
          <div className="flex items-start gap-3.5 min-w-0">
            <div className="w-12 h-12 rounded-xl bg-[#2C2C2E] border border-[#3A3A3C] flex items-center justify-center text-primary shrink-0">
              <span className="material-symbols-outlined text-[26px]">description</span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm sm:text-base font-semibold text-primary truncate" title={file.name}>
                {file.name}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-on-surface-variant font-mono">
                  {formatFileSize(file.size)}
                </span>
                <span className="h-1 w-1 rounded-full bg-outline-variant"></span>
                <span className="text-xs text-secondary flex items-center gap-1 font-medium">
                  <span className="material-symbols-outlined text-[14px]">check_circle</span> Ready for Analysis
                </span>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-2 border-t border-[#2C2C2E]">
            <button
              type="button"
              onClick={openFilePicker}
              className="px-3.5 py-1.5 bg-[#2C2C2E] border border-[#3A3A3C] text-secondary hover:text-primary hover:border-secondary/50 text-xs sm:text-sm font-medium rounded-lg transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">swap_horiz</span>
              <span>Change Resume</span>
            </button>
          </div>
        </div>
      ) : (
        <div
          onClick={openFilePicker}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`border border-dashed border-[#3A3A3C] rounded-xl min-h-[190px] sm:min-h-[200px] bg-[#1C1C1E] flex flex-col items-center justify-center text-center p-4 hover:border-secondary/50 transition-colors cursor-pointer group ${
            isDragging ? "border-secondary bg-[#201f1f]" : ""
          }`}
          role="button"
          tabIndex={0}
          aria-label="Upload resume document: drag and drop file here or press Enter to browse"
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              openFilePicker();
            }
          }}
        >
          <span className="material-symbols-outlined text-[40px] text-on-surface-variant mb-3 group-hover:text-secondary transition-colors">
            upload_file
          </span>
          <span className="text-primary text-sm sm:text-base font-medium mb-1">
            Drag & drop your PDF, DOCX, TXT, or RTF here
          </span>
          <span className="text-on-surface-variant text-xs sm:text-sm">
            or <span className="underline underline-offset-2 hover:text-primary transition-colors">browse files</span>
          </span>
        </div>
      )}

      {validationError && (
        <div className="mt-1 rounded-lg bg-error-container/20 border border-error/30 p-2 text-error text-xs flex items-center gap-1.5" role="alert">
          <span className="material-symbols-outlined text-[15px]">error</span>
          <span>{validationError}</span>
        </div>
      )}
    </div>
  );
}

export default React.memo(ResumeUpload);
