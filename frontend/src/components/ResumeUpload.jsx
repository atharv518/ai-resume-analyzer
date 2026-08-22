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
    <div className="flex flex-col gap-sm">
      <div className="flex justify-between items-baseline">
        <h2 className="font-headline-sm text-headline-sm text-inverse-on-surface">
          Upload your Resume
        </h2>
        <span className="font-body-md text-body-md text-outline-variant text-xs">
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
        <div className="mt-2 rounded-xl border border-tertiary-fixed-dim/40 bg-surface-variant/10 p-md flex flex-col sm:flex-row sm:items-center sm:justify-between gap-md backdrop-blur-sm">
          <div className="flex items-center gap-md min-w-0">
            <div className="w-12 h-12 rounded-lg bg-tertiary-container/30 border border-tertiary-fixed-dim/40 flex items-center justify-center text-tertiary-fixed-dim shrink-0">
              <span className="material-symbols-outlined text-[28px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                description
              </span>
            </div>
            <div className="min-w-0">
              <p className="font-title-lg text-title-lg text-white truncate" title={file.name}>
                {file.name}
              </p>
              <div className="flex items-center gap-sm mt-0.5">
                <span className="font-body-md text-body-md text-outline-variant text-xs">
                  {formatFileSize(file.size)}
                </span>
                <span className="h-1 w-1 rounded-full bg-outline-variant/60"></span>
                <span className="font-label-md text-label-md text-tertiary-fixed-dim flex items-center gap-1 text-xs">
                  <span className="material-symbols-outlined text-[14px]">check_circle</span> Ready to analyze
                </span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={openFilePicker}
            className="px-4 py-2 bg-inverse-surface border border-outline-variant/30 text-secondary-fixed-dim hover:text-inverse-primary hover:border-inverse-primary/40 font-label-md text-label-md rounded-lg transition-all active:scale-95 flex items-center justify-center gap-1.5 self-start sm:self-auto"
          >
            <span className="material-symbols-outlined text-[16px]">swap_horiz</span>
            <span>Replace File</span>
          </button>
        </div>
      ) : (
        <div
          onClick={openFilePicker}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`drop-zone mt-2 rounded-xl p-xl flex flex-col items-center justify-center text-center gap-md cursor-pointer bg-surface-variant/5 ${
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
          <div className="w-16 h-16 rounded-full bg-surface-variant/10 flex items-center justify-center text-inverse-primary mb-2 transition-transform duration-300 group-hover:scale-110">
            <span className="material-symbols-outlined text-[34px]">cloud_upload</span>
          </div>
          <div>
            <p className="font-title-lg text-title-lg text-inverse-on-surface mb-1">
              {isDragging ? "Drop your resume right here" : "Drag and drop your file here"}
            </p>
            <p className="font-body-md text-body-md text-outline-variant">
              or browse from your device
            </p>
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              openFilePicker();
            }}
            className="mt-2 px-5 py-2.5 bg-primary text-on-primary font-label-md text-label-md rounded-lg hover:bg-primary-container transition-all active:scale-95 flex items-center gap-2 shadow-sm"
          >
            <span className="material-symbols-outlined text-[18px]">folder_open</span>
            <span>Browse Files</span>
          </button>
        </div>
      )}

      {validationError && (
        <div className="mt-2 rounded-lg bg-error-container/20 border border-error/30 p-sm text-error font-body-md text-body-md text-xs flex items-center gap-2">
          <span className="material-symbols-outlined text-[16px]">error</span>
          <span>{validationError}</span>
        </div>
      )}
    </div>
  );
}

export default ResumeUpload;
