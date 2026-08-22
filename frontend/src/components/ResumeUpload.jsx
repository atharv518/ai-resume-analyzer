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
    <div className="flex flex-col gap-2 h-full">
      <div className="flex justify-between items-baseline">
        <h2 className="text-sm sm:text-base font-semibold text-inverse-on-surface flex items-center gap-1.5">
          <span className="material-symbols-outlined text-[18px] text-inverse-primary">upload_file</span>
          <span>Resume Document</span>
        </h2>
        <span className="text-xs text-outline-variant">
          PDF, DOCX (Max 10MB)
        </span>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        onChange={handleInputChange}
        className="hidden"
        id="resume-upload"
        aria-label="Upload Resume"
      />

      {file ? (
        <div className="flex-1 min-h-[170px] sm:min-h-[195px] md:min-h-[210px] rounded-xl border border-tertiary-fixed-dim/40 bg-surface-variant/10 p-4 sm:p-6 flex flex-col justify-between gap-3 backdrop-blur-sm">
          <div className="flex items-start gap-3.5 min-w-0">
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-tertiary-container/30 border border-tertiary-fixed-dim/40 flex items-center justify-center text-tertiary-fixed-dim shrink-0">
              <span className="material-symbols-outlined text-[26px] sm:text-[28px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                description
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm sm:text-base font-bold text-white truncate" title={file.name}>
                {file.name}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-outline-variant">
                  {formatFileSize(file.size)}
                </span>
                <span className="h-1 w-1 rounded-full bg-outline-variant/60"></span>
                <span className="text-xs text-tertiary-fixed-dim flex items-center gap-1 font-semibold">
                  <span className="material-symbols-outlined text-[14px]">check_circle</span> Ready for Analysis
                </span>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-2 border-t border-outline-variant/15">
            <button
              type="button"
              onClick={openFilePicker}
              className="px-4 py-2 bg-inverse-surface border border-outline-variant/30 text-secondary-fixed-dim hover:text-inverse-primary hover:border-inverse-primary/40 text-xs sm:text-sm font-medium rounded-lg transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer"
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
          className={`drop-zone flex-1 min-h-[170px] sm:min-h-[195px] md:min-h-[210px] rounded-xl p-4 sm:p-6 flex flex-col items-center justify-center text-center gap-2 sm:gap-2.5 cursor-pointer bg-surface-variant/5 hover:bg-surface-variant/10 transition-all ${
            isDragging ? "dragover" : ""
          }`}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              openFilePicker();
            }
          }}
        >
          <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-surface-variant/10 border border-inverse-primary/20 flex items-center justify-center text-inverse-primary transition-transform duration-300 group-hover:scale-110 shadow-sm">
            <span className="material-symbols-outlined text-[24px] sm:text-[26px]">cloud_upload</span>
          </div>
          <div>
            <p className="text-sm sm:text-base font-semibold text-inverse-on-surface">
              {isDragging ? "Drop resume here" : "Drag & drop your resume here"}
            </p>
            <p className="text-xs text-outline-variant mt-0.5">
              or click to browse from device (PDF or DOCX)
            </p>
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              openFilePicker();
            }}
            className="mt-1 px-4 py-2 bg-primary text-on-primary text-xs sm:text-sm font-semibold rounded-lg hover:bg-primary-container transition-all active:scale-95 flex items-center gap-1.5 shadow-sm cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]">folder_open</span>
            <span>Browse Files</span>
          </button>
        </div>
      )}

      {validationError && (
        <div className="mt-1 rounded-lg bg-error-container/20 border border-error/30 p-2 text-error text-xs flex items-center gap-1.5">
          <span className="material-symbols-outlined text-[15px]">error</span>
          <span>{validationError}</span>
        </div>
      )}
    </div>
  );
}

export default ResumeUpload;
