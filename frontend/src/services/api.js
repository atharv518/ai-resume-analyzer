const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");

const REQUEST_TIMEOUT_MS = 60000; // 60s timeout for deep LLM / document processing
const POLL_INTERVAL_MS = 800; // 800ms polling interval for async jobs

/**
 * Direct synchronous resume analysis.
 */
export async function submitResume({ resumeFile, jobDescription, signal }) {
  const formData = new FormData();
  formData.append("resume", resumeFile);
  formData.append("job_description", (jobDescription || "").trim());

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  if (signal) {
    signal.addEventListener("abort", () => controller.abort());
  }

  let response;
  const endpoint = API_BASE_URL ? `${API_BASE_URL}/api/analyze` : "/api/analyze";

  try {
    response = await fetch(endpoint, {
      method: "POST",
      body: formData,
      signal: controller.signal,
    });
  } catch (err) {
    if (err.name === "AbortError") {
      throw new Error("Analysis request timed out. Please try again with a shorter document or simpler job description.");
    }
    throw new Error("We could not reach the server. Make sure the backend is running and try again.");
  } finally {
    clearTimeout(timeoutId);
  }

  let payload;
  try {
    payload = await response.json();
  } catch {
    throw new Error("The server returned an unexpected response format. Please try again.");
  }

  if (!response.ok) {
    throw new Error(payload.detail || "The resume could not be analyzed. Please try again.");
  }

  if (!payload.success || !payload.parsed_resume) {
    throw new Error("The server returned an incomplete analysis result. Please try again.");
  }

  return payload;
}

/**
 * Asynchronous queue-based resume analysis with live progress reporting.
 */
export async function submitResumeAsync({ resumeFile, jobDescription, onProgress, signal }) {
  const formData = new FormData();
  formData.append("resume", resumeFile);
  formData.append("job_description", (jobDescription || "").trim());

  const asyncEndpoint = API_BASE_URL ? `${API_BASE_URL}/api/analyze/async` : "/api/analyze/async";

  let submitRes;
  try {
    submitRes = await fetch(asyncEndpoint, {
      method: "POST",
      body: formData,
      signal,
    });
  } catch {
    // Graceful fallback to direct sync analysis if async endpoint fails
    return submitResume({ resumeFile, jobDescription, signal });
  }

  if (!submitRes.ok) {
    const errPayload = await submitRes.json().catch(() => ({}));
    throw new Error(errPayload.detail || "Failed to submit resume analysis job.");
  }

  const { job_id } = await submitRes.json();
  const pollEndpoint = API_BASE_URL ? `${API_BASE_URL}/api/jobs/${job_id}` : `/api/jobs/${job_id}`;

  const startTime = Date.now();

  while (Date.now() - startTime < REQUEST_TIMEOUT_MS) {
    if (signal?.aborted) {
      throw new Error("Analysis request cancelled.");
    }

    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));

    const pollRes = await fetch(pollEndpoint, { signal });
    if (!pollRes.ok) {
      throw new Error("Failed to check analysis progress.");
    }

    const jobData = await pollRes.json();

    if (onProgress) {
      onProgress(jobData.progress_percentage || 0, jobData.current_step || "Processing");
    }

    if (jobData.status === "completed" && jobData.result) {
      return jobData.result;
    }

    if (jobData.status === "failed") {
      throw new Error(jobData.error || "Resume analysis failed in background queue.");
    }
  }

  throw new Error("Analysis job timed out. Please try again.");
}
