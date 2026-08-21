# AI ATS Resume Analyzer

An intelligent, privacy-first web application for automated resume parsing, Job Description matching, deterministic ATS scoring, and actionable AI-driven optimization recommendations.

Built with **React 18 + Vite + Tailwind CSS** on the frontend and **FastAPI + Pydantic + Uvicorn** on the backend.

---

## Key Features

- **Two-Page User Experience**:
  - **Page 1 (Upload & Input)**: Drag-and-drop document upload (`.pdf` and `.docx`), target job description textarea with validation, and smooth loading state.
  - **Page 2 (Results Dashboard)**: Dedicated dashboard displaying overall ATS score, category breakdowns, skill comparisons, strengths, recommendations, and back navigation.
- **Deterministic ATS Scoring (0–100)**:
  - Transparent, mathematical scoring based on skill matching, keyword overlap, project scope, education, and resume structure.
  - **Adaptive Candidate Weighting**: Calibrated weights for freshers (no penalty for 0 commercial experience) vs experienced candidates.
- **Candidate Type & Experience Detection**:
  - Automatically identifies **Fresher / Early Career** vs **Experienced Professional**.
  - Distinguishes **Professional Work Experience**, **Internships**, **Virtual Job Simulations** (e.g. Forage), and **Academic/Personal Projects**.
  - **Conditional Experience Display**: Experience section is **completely omitted** for freshers with no commercial background (no "Experience: 0%" or empty cards).
- **Skill & Keyword Gap Analysis**:
  - **Matching Skills**: Highlights technical skills present in both resume and job posting.
  - **Missing Skills**: Lists crucial requirements missing from the resume, paired with clear ethical guidance.
- **Actionable AI Recommendations**:
  - Contextual recommendations focusing on measurable metrics, project depth, and role alignment.
- **Modular Feature Controls**:
  - Centralized toggles in `app/config.py` allow enabling/disabling individual sections (`SHOW_ATS_SCORE`, `SHOW_SKILL_MATCH`, `SHOW_KEYWORD_ANALYSIS`, `SHOW_EXPERIENCE_ANALYSIS`, `SHOW_PROJECT_ANALYSIS`, `SHOW_AI_RECOMMENDATIONS`, `SHOW_RESUME_STRENGTHS`) cleanly without deleting underlying code.
- **Robust Document Text Extraction**:
  - Multi-page extraction and password detection for PDFs via `pypdf`.
  - Paragraph and table extraction for DOCX documents via `python-docx`.

---

## How It Works

```
┌─────────────────────────────────────────────────────────────┐
│                    PAGE 1 — INPUT & UPLOAD                  │
│   1. Upload Resume (.pdf / .docx)                           │
│   2. Paste Target Job Description (Required)                │
│   3. Click "Analyze Resume" (In-place Loading State)        │
└──────────────────────────────┬──────────────────────────────┘
                               │ Multipart Form Data
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                       FASTAPI BACKEND                       │
│   • Document Text Extractor (PDF / DOCX)                    │
│   • Regex & Heading Parser (Contact & Sections)             │
│   • Job Matcher (Skills & Domain Keywords)                  │
│   • Experience Detector (Candidate Type & Simulations)      │
│   • Deterministic ATS Scorer (0–100 Weighted Score)         │
│   • AI Analyzer (Gemini / OpenAI / Deterministic Fallback)  │
│   • Centralized Feature Flag Filter                         │
└──────────────────────────────┬──────────────────────────────┘
                               │ Structured JSON Response
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                    PAGE 2 — RESULTS DASHBOARD               │
│   • ATS Score Gauge (XX / 100) & Category Progress Bars     │
│   • Candidate Overview Badge (Fresher vs Experienced)       │
│   • Matching Skills vs Missing Gap Skills                   │
│   • Resume Strengths & AI Actionable Recommendations        │
│   • Conditional Experience Section (Hidden for Freshers)    │
│   • Projects & Education Sections                           │
│   • Collapsible Extracted Document Text                     │
│   • "Upload Another Resume" Back Navigation Button          │
└─────────────────────────────────────────────────────────────┘
```

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
- **HTTP Client**: [HTTPX](https://www.python-httpx.org/)
- **Document Processing**: [pypdf](https://pypdf.readthedocs.io/), [python-docx](https://python-docx.readthedocs.io/)
- **Form Handling**: [python-multipart](https://andrew-d.github.io/python-multipart/)

---

## Project Structure

```text
ai-resume-analyzer/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ExperienceAnalysis.jsx   # Conditional experience & simulation badges
│   │   │   ├── Header.jsx               # Top navigation bar
│   │   │   ├── JobDescription.jsx       # Job description textarea with validation
│   │   │   ├── ResumeResults.jsx        # Modular result sections
│   │   │   ├── ResumeUpload.jsx         # Drag-and-drop file upload zone
│   │   │   ├── ScoreCard.jsx            # Circular ATS score gauge & breakdowns
│   │   │   └── StatusMessage.jsx        # Alert feedback banner
│   │   ├── pages/
│   │   │   ├── AnalyzerPage.jsx         # Page 1: Upload & Input page
│   │   │   └── ResultsPage.jsx          # Page 2: Comprehensive Results Dashboard
│   │   ├── services/
│   │   │   └── api.js                   # Frontend API client
│   │   ├── App.jsx                      # Two-page state navigator
│   │   ├── index.css
│   │   └── main.jsx
│   ├── .env.example
│   ├── package.json
│   └── vite.config.js
├── backend/
│   ├── app/
│   │   ├── routes/
│   │   │   └── analyze.py               # POST /api/analyze route
│   │   ├── services/
│   │   │   ├── ai_analyzer.py           # LLM provider & deterministic fallback
│   │   │   ├── ats_scorer.py            # Adaptive ATS score calculation (0-100)
│   │   │   ├── experience_detector.py   # Candidate classification & simulation detection
│   │   │   ├── extractor.py             # PDF & DOCX text extraction
│   │   │   ├── job_matcher.py           # Skill and keyword comparison engine
│   │   │   └── parser.py                # Regex candidate info & section parser
│   │   ├── utils/
│   │   │   └── file_validation.py       # File format and size validation
│   │   ├── config.py                    # Modular feature flags & AI settings
│   │   └── main.py                      # FastAPI application entry point
│   ├── .env.example
│   ├── requirements.txt
│   └── tests_phase3.py                  # Automated backend test suite
├── README.md
└── .gitignore
```

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

4. (Optional) Configure environment variables:
   Copy `.env.example` to `.env` to configure AI keys or toggle feature flags:
   ```bash
   cp .env.example .env
   ```

5. Start the FastAPI development server:
   ```bash
   uvicorn app.main:app --reload
   ```

- Health Check: `http://localhost:8000/health`
- OpenAPI Docs: `http://localhost:8000/docs`

---

### 2. Run the Frontend

1. Navigate to the `frontend` directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the Vite development server:
   ```bash
   npm run dev
   ```

The application will be accessible at `http://localhost:5173`.

---

## API Reference

### `POST /api/analyze`

Accepts a multipart form submission containing a resume file and optional job description text.

#### Request (Multipart Form)
| Parameter | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `resume` | File | Yes | `.pdf` or `.docx` document (max 10 MB) |
| `job_description` | Text | No | Target job description string (optional) |

#### Example Response (`200 OK`)
```json
{
  "success": true,
  "message": "Resume analyzed successfully against job description.",
  "filename": "candidate_resume.pdf",
  "job_description_provided": true,
  "feature_flags": {
    "SHOW_ATS_SCORE": true,
    "SHOW_SKILL_MATCH": true,
    "SHOW_KEYWORD_ANALYSIS": true,
    "SHOW_EXPERIENCE_ANALYSIS": true,
    "SHOW_PROJECT_ANALYSIS": true,
    "SHOW_AI_RECOMMENDATIONS": true,
    "SHOW_RESUME_STRENGTHS": true
  },
  "parsed_resume": {
    "name": "Alex Mercer",
    "email": "alex.mercer@example.com",
    "phone": "(555) 234-5678",
    "skills": ["Python", "FastAPI", "React", "PostgreSQL", "Docker", "Git"],
    "education": ["B.S. in Computer Science (2020 - 2024)"],
    "experience": [],
    "projects": ["AI Resume Analyzer - Built full-stack platform"],
    "certifications": ["AWS Certified Cloud Practitioner"]
  },
  "ats_score": {
    "overall_score": 88,
    "rating": "Excellent Match",
    "breakdown": {
      "skills_score": 90,
      "keyword_score": 85,
      "projects_score": 90,
      "experience_score": null,
      "education_score": 80,
      "structure_score": 95
    },
    "summary_feedback": "Your profile shows outstanding alignment with the target role and key technical requirements."
  },
  "skill_comparison": {
    "matching_skills": ["Python", "FastAPI", "PostgreSQL", "Docker"],
    "missing_skills": ["AWS", "CI/CD"],
    "matching_keywords": ["REST APIs", "Microservices"],
    "missing_keywords": ["Kubernetes"],
    "skill_match_percentage": 80.0,
    "keyword_match_percentage": 75.0
  },
  "experience_analysis": {
    "candidate_type": "fresher",
    "has_professional_experience": false,
    "has_internship_experience": false,
    "has_virtual_experience": false,
    "include_experience_section": false,
    "professional_items": [],
    "internship_items": [],
    "virtual_simulation_items": [],
    "explanation": "Candidate is a fresher with academic and project background."
  },
  "ai_insights": {
    "role_fit_summary": "The candidate is evaluated as a fresher candidate matching 80.0% of required skills.",
    "resume_strengths": [
      "Strong technical alignment with key role requirements in Python, FastAPI, PostgreSQL.",
      "Practical portfolio demonstrates hands-on implementation across distinct projects."
    ],
    "recommendations": [
      "Review missing technologies mentioned in the job description (AWS, CI/CD).",
      "Quantify project outcomes with measurable metrics."
    ],
    "project_relevance_summary": "Projects demonstrate practical coding capability.",
    "is_ai_powered": false
  },
  "extracted_text": "Alex Mercer\nalex.mercer@example.com\n..."
}
```

