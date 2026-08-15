const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000").replace(/\/$/, "");

export async function submitResume({ resumeFile, jobDescription }) {
  const formData = new FormData();
  formData.append("resume", resumeFile);
  formData.append("job_description", jobDescription);

  let response;

  try {
    response = await fetch(`${API_BASE_URL}/api/analyze`, {
      method: "POST",
      body: formData,
    });
  } catch {
    throw new Error("We could not reach the server. Make sure the backend is running and try again.");
  }

  let payload;
  try {
    payload = await response.json();
  } catch {
    throw new Error("The server returned an unexpected response. Please try again.");
  }

  if (!response.ok) {
    throw new Error(payload.detail || "The resume could not be uploaded. Please try again.");
  }

  if (!payload.success || !payload.message || !payload.filename) {
    throw new Error("The server returned an unexpected response. Please try again.");
  }

  return payload;
}
