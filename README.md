# AI Resume Analyzer

A privacy-focused web application designed to extract, parse, and analyze resumes locally. The system accepts resume documents in PDF or DOCX format, extracts text content, and identifies structured candidate details—including contact information, skills, work experience, education, projects, and certifications—with optional job description comparison context.

---

## Key Features

- **Multi-Format Document Upload**: Supports PDF (`.pdf`) and Microsoft Word (`.docx`) documents up to 10 MB.
- **Interactive Drag-and-Drop UI**: Clean upload zone with instant file validation, file-card preview, and reset capabilities.
- **Robust Document Text Extraction**:
  - Multi-page extraction and password-protection detection for PDFs via `pypdf`.
  - Paragraph and table text extraction for DOCX documents via `python-docx`.
- **Intelligent Resume Parsing**:
  - Automatic extraction of candidate name, email address, and phone number.
  - Heading-based section segmentation (Skills, Experience, Education, Projects, Certifications).
  - Keyword matching and section-based aggregation for technical and soft skills.
- **Job Description Context**: Optional input to capture target job descriptions alongside resumes.
- **Structured Results Dashboard**:
  - Candidate profile overview and contact shortcuts.
  - Categorized skill tags and formatted section entries.
  - Collapsible raw text viewer for extracted document inspection.
- **Local & Privacy-Centric**: Document processing happens directly within your local development environment without sending data to external third-party APIs.
- **Fast & Typed Backend**: Built with FastAPI and Pydantic for validation, error handling, and auto-generated OpenAPI documentation.

---

## How It Works

```
┌─────────────────┐       Multipart Form Data        ┌─────────────────────────┐
│                 │  (Resume File + Job Description) │                         │
│  React Frontend │ ───────────────────────────────> │     FastAPI Backend     │
│                 │ <─────────────────────────────── │                         │
└─────────────────┘        Parsed JSON Response      └────────────┬────────────┘
                                                                  │
                                       ┌──────────────────────────┴──────────────────────────┐
                                       │                                                     │
                                       ▼                                                     ▼
                            ┌─────────────────────┐                               ┌─────────────────────┐
                            │   Text Extractor    │                               │    Resume Parser    │
                            │ (pypdf/python-docx) │ ───> Extracted Document Text ─> (Regex & Sections)  │
                            └─────────────────────┘                               └─────────────────────┘
```

1. **Upload & Validation**: The user selects or drags a resume (`.pdf` or `.docx`). Client and server validate file format, file size (max 10 MB), and integrity.
2. **Text Extraction**: The backend processes the document bytes, extracting plain text from PDF pages or DOCX paragraphs and tables.
3. **Information Parsing**: Heuristic heading detection segments the document into functional sections, while regex matchers identify contact details and keyword matchers aggregate skills.
4. **Result Presentation**: The API returns structured JSON data containing candidate attributes, segmented sections, and raw text, which the frontend renders in an intuitive results dashboard.

---

## Tech Stack

### Frontend
- **Framework**: [React 18](https://react.dev/)
- **Build Tool**: [Vite](https://vitejs.dev/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)

### Backend
- **Framework**: [FastAPI](https://fastapi.tiangolo.com/)
- **ASGI Server**: [Uvicorn](https://www.uvicorn.org/)
- **Data Validation**: [Pydantic v2](https://docs.pydantic.dev/)
- **Document Processing**: [pypdf](https://pypdf.readthedocs.io/), [python-docx](https://python-docx.readthedocs.io/)
- **Form Handling**: [python-multipart](https://andrew-d.github.io/python-multipart/)

---

## Project Structure

```text
ai-resume-analyzer/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Header.jsx           # Top navigation bar
│   │   │   ├── JobDescription.jsx   # Job description textarea component
│   │   │   ├── ResumeResults.jsx    # Structured results and raw text viewer
│   │   │   ├── ResumeUpload.jsx     # Drag-and-drop file upload zone
│   │   │   └── StatusMessage.jsx    # Alert and feedback messages
│   │   ├── pages/
│   │   │   └── AnalyzerPage.jsx     # Main analyzer workflow page
│   │   ├── services/
│   │   │   └── api.js               # Frontend API client helper
│   │   ├── App.jsx
│   │   ├── index.css
│   │   └── main.jsx
│   ├── .env.example
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.js
├── backend/
│   ├── app/
│   │   ├── routes/
│   │   │   └── analyze.py           # POST /api/analyze route
│   │   ├── services/
│   │   │   ├── extractor.py         # PDF and DOCX text extraction logic
│   │   │   └── parser.py            # Resume entity & section parsing
│   │   ├── utils/
│   │   │   └── file_validation.py   # File type and size validation
│   │   ├── config.py                # Environment configuration
│   │   └── main.py                  # FastAPI application entry point
│   ├── .env.example
│   └── requirements.txt
├── README.md
└── .gitignore
```

---

## Prerequisites

Ensure you have the following installed on your system:

- **Node.js**: v18.0.0 or higher ([Download Node.js](https://nodejs.org/))
- **Python**: v3.10 or higher ([Download Python](https://www.python.org/))
- **npm** or package manager of choice

---

## Getting Started

### 1. Run the Backend

1. Navigate to the `backend` directory:
   ```bash
   cd backend
   ```

2. Create and activate a virtual environment:
   - **Windows (PowerShell)**:
     ```powershell
     python -m venv .venv
     .\.venv\Scripts\Activate.ps1
     ```
   - **macOS / Linux**:
     ```bash
     python3 -m venv .venv
     source .venv/bin/activate
     ```

3. Install backend dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Start the FastAPI development server:
   ```bash
   uvicorn app.main:app --reload
   ```

The backend server will start at `http://localhost:8000`.
- Health check: `http://localhost:8000/health`
- Interactive API Docs (Swagger UI): `http://localhost:8000/docs`

> **Note**: To configure custom frontend origins for CORS, set the `FRONTEND_ORIGINS` environment variable (e.g. `FRONTEND_ORIGINS="http://localhost:5173,http://127.0.0.1:5173"`).

---

### 2. Run the Frontend

1. Open a new terminal and navigate to the `frontend` directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. (Optional) Configure environment variables:
   Copy `.env.example` to `.env` if you need to override the default API URL:
   ```bash
   cp .env.example .env
   ```

4. Start the Vite development server:
   ```bash
   npm run dev
   ```

The frontend application will be accessible at `http://localhost:5173`.

---

## API Reference

### `POST /api/analyze`

Accepts a multipart form submission containing a resume file and optional job description text.

#### Request (Multipart Form)
| Parameter | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `resume` | File | Yes | `.pdf` or `.docx` document (max 10 MB) |
| `job_description` | Text | No | Target job description string |

#### Example Success Response (`200 OK`)
```json
{
  "success": true,
  "message": "Resume extracted and parsed successfully.",
  "filename": "candidate_resume.pdf",
  "job_description_provided": true,
  "parsed_resume": {
    "name": "Jane Doe",
    "email": "jane.doe@example.com",
    "phone": "+1 (555) 123-4567",
    "skills": [
      "Python",
      "FastAPI",
      "React",
      "JavaScript",
      "Docker",
      "SQL"
    ],
    "education": [
      "B.S. in Computer Science - University of Technology (2020 - 2024)"
    ],
    "experience": [
      "Software Engineer Intern - Acme Corp (2023 - 2024)",
      "Developed backend microservices using FastAPI and PostgreSQL"
    ],
    "projects": [
      "AI Resume Analyzer - Built full-stack document extraction application"
    ],
    "certifications": [
      "AWS Certified Cloud Practitioner"
    ]
  },
  "extracted_text": "Jane Doe\njane.doe@example.com\n..."
}
```

### `GET /health`

Health check endpoint to verify backend service availability.

#### Example Response (`200 OK`)
```json
{
  "ok": true
}
```

---

## Supported File Formats & Validation

| Format | Extension | Notes |
| :--- | :--- | :--- |
| **PDF** | `.pdf` | Multi-page text extraction. Password-protected and scanned image-only PDFs are rejected with informative error messages. |
| **Microsoft Word** | `.docx` | Paragraph and table text extraction. |

- **Maximum Upload Size**: 10 MB per file.
- **Validation Rules**: Empty files, unsupported extensions, and files exceeding 10 MB are rejected by both client-side guards and server-side validation.
