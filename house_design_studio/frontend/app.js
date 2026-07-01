"use strict";

const $ = (id) => document.getElementById(id);
let pollTimer = null;

async function health() {
  try {
    const r = await fetch("/api/health");
    const h = await r.json();
    const bits = [];
    if (h.mock_claude) bits.push("offline demo (mock AI)");
    if (h.dev_mode_freecad) bits.push("dev mode (no FreeCAD)");
    $("mode-hint").textContent = bits.length
      ? "Running in " + bits.join(" + ") + "."
      : "Running with live AI and FreeCAD.";
  } catch (e) {
    $("mode-hint").textContent = "";
  }
}

function setRunning(running) {
  $("run-btn").disabled = running;
  $("sample-btn").disabled = running;
}

async function startJob(formData) {
  setRunning(true);
  $("progress-card").classList.remove("hidden");
  $("results-card").classList.add("hidden");
  $("progress-list").innerHTML = "";
  $("status-line").textContent = "Submitting…";
  try {
    const r = await fetch("/api/jobs", { method: "POST", body: formData });
    if (!r.ok) {
      const err = await r.json().catch(() => ({ detail: r.statusText }));
      throw new Error(err.detail || "Request failed");
    }
    const { job_id } = await r.json();
    poll(job_id);
  } catch (e) {
    $("status-line").textContent = "Error: " + e.message;
    setRunning(false);
  }
}

function poll(jobId) {
  if (pollTimer) clearInterval(pollTimer);
  pollTimer = setInterval(async () => {
    try {
      const r = await fetch(`/api/jobs/${jobId}`);
      const s = await r.json();
      renderProgress(s);
      if (s.status === "done" || s.status === "error") {
        clearInterval(pollTimer);
        setRunning(false);
        if (s.status === "done") loadResults(jobId, s);
      }
    } catch (e) {
      /* keep polling */
    }
  }, 1500);
}

function renderProgress(s) {
  $("status-line").textContent = "Status: " + s.status +
    (s.current_revision ? " (revision " + s.current_revision + ")" : "");
  const list = $("progress-list");
  list.innerHTML = "";
  (s.progress || []).forEach((line) => {
    const li = document.createElement("li");
    li.textContent = line;
    list.appendChild(li);
  });
}

async function loadResults(jobId, status) {
  $("results-card").classList.remove("hidden");
  $("result-summary").textContent =
    `Outcome: ${status.result_status || status.status}. ` +
    `${status.iterations || 0} revision(s); final v${status.final_revision || 1}.`;

  // Report
  try {
    const rep = await fetch(`/api/jobs/${jobId}/report`);
    $("report").textContent = rep.ok
      ? await rep.text()
      : "Report not available.";
  } catch (e) {
    $("report").textContent = "Report not available.";
  }

  // Manifest / artifacts
  try {
    const m = await fetch(`/api/jobs/${jobId}/manifest`);
    const manifest = await m.json();
    const ul = $("artifact-list");
    ul.innerHTML = "";
    (manifest.artifacts || []).forEach((a) => {
      const li = document.createElement("li");
      if (a.path) {
        const link = document.createElement("a");
        link.href = `/api/jobs/${jobId}/artifacts/${a.path}`;
        link.textContent = a.label;
        li.appendChild(link);
      } else {
        li.className = "skipped";
        li.textContent = `${a.label} — ${a.status}`;
      }
      ul.appendChild(li);
    });
  } catch (e) {
    /* ignore */
  }
}

$("run-btn").addEventListener("click", () => {
  const fd = new FormData();
  fd.append("text", $("brief").value || "");
  const files = $("images").files;
  for (let i = 0; i < files.length; i++) fd.append("images", files[i]);
  startJob(fd);
});

$("sample-btn").addEventListener("click", () => {
  const fd = new FormData();
  fd.append("use_sample", "true");
  startJob(fd);
});

health();
