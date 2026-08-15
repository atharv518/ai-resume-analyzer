# AI-Based Resume Analyzer and ATS Optimization System

A privacy-focused college project that will eventually help users analyze resumes and optionally compare them with a job description. This repository contains **Phase 1 only**: the foundation, a professional upload interface, and a FastAPI endpoint that receives and validates files.

## Current Phase 1 functionality

- Professional React landing page for the AI Resume Analyzer.
- Resume upload by drag-and-drop or the operating system file picker.
- PDF and DOCX validation, with a 10 MB maximum upload size.
- Selected-file card showing the name, size, ready status, and a replacement action.
- Optional Job Description textarea.
- Frontend upload request sent with `FormData`.
- FastAPI `POST /api/analyze` endpoint that validates and acknowledges the received file.
- Local-development CORS configuration for the Vite frontend.

The success panel after submission confirms only that the backend received the resume. It does not show any analysis.

## Not implemented yet

AI analysis, local LLM/Ollama integration, resume parsing, embeddings, ATS scoring, recommendations, databases, authentication, and external AI APIs are intentionally **not implemented** in this phase. They belong to later phases.

## Tech stack

- Frontend: React, Vite, Tailwind CSS
- Backend: Python, FastAPI, Uvicorn

## Project structure

```text
resume-ai-analyzer/
├── frontend/
│   ├── src/
│   │   ├── components/       # Small reusable UI pieces
│   │   ├── pages/            # Main analyzer page
│   │   ├── services/api.js   # Frontend API request helper
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── .env.example
│   └── package.json
├── backend/
│   ├── app/
│   │   ├── routes/analyze.py # POST /api/analyze
│   │   ├── services/         # Reserved for future analysis logic
│   │   ├── utils/            # File validation helper
│   │   └── main.py
│   ├── .env.example
│   └── requirements.txt
├── README.md
└── .gitignore
```

## Prerequisites

- Node.js 18 or newer
- Python 3.10 or newer

## Run the backend

Open a terminal in the `backend` directory:

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app.main:app --reload
```

The API will run at `http://localhost:8000`. You can confirm it is available at `http://localhost:8000/health`.

By default, the API accepts requests from `http://localhost:5173` and `http://127.0.0.1:5173`. To use another local frontend origin, set the `FRONTEND_ORIGINS` environment variable to a comma-separated list before starting Uvicorn.

## Run the frontend

Open a second terminal in the `frontend` directory:

```powershell
cd frontend
npm install
npm run dev
```

Vite prints the local URL, normally `http://localhost:5173`.

The frontend defaults to `http://127.0.0.1:8000` for its API. If the backend uses another URL, copy `.env.example` to `.env`, update `VITE_API_BASE_URL`, and restart `npm run dev`.

## API contract for Phase 1

`POST /api/analyze` accepts multipart form data:

- `resume` (required): a non-empty `.pdf` or `.docx` file, 10 MB or smaller
- `job_description` (optional): text; may be omitted or empty

Successful example response:

```json
{
  "success": true,
  "message": "Resume received successfully.",
  "filename": "candidate_resume.pdf",
  "job_description_provided": true
}
```

## Supported resume formats

- PDF (`.pdf`)
- Microsoft Word DOCX (`.docx`)

Files above 10 MB, empty files, and any other file extension are rejected by both the interface and the backend. Backend validation is the final authority.

## Current limitations

This is an upload and validation foundation only. The server temporarily reads the upload solely to check its size and does not parse, save, score, or analyze the document. No resume data is sent to an LLM or external service.
