const sInterest = document.getElementById("s_interest_match");
const sInterestLabel = document.getElementById("s_interest_label");
if (sInterest) {
  sInterest.addEventListener("input", () => {
    const v = parseFloat(sInterest.value);
    sInterestLabel.textContent = v >= 0.7 ? "High" : v >= 0.4 ? "Medium" : "Low";
  });
}

document.getElementById("studentForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const payload = {
    event_name: document.getElementById("s_event_name").value,
    event_time: document.getElementById("s_event_time").value,
    day_of_week: document.getElementById("s_day_of_week").value,
    event_location: document.getElementById("s_event_location").value,
    last_class_end_time: document.getElementById("s_last_class_end").value,
    last_class_location: document.getElementById("s_last_class_location").value,
    distance_miles: parseFloat(document.getElementById("s_distance").value) || 0,
    past_attended: parseInt(document.getElementById("s_past_attended").value) || 0,
    past_no_shows: parseInt(document.getElementById("s_past_no_shows").value) || 0,
    attendance_streak: parseInt(document.getElementById("s_streak").value) || 0,
    registration_days_ago: parseInt(document.getElementById("s_reg_days_ago").value) || 1,
    interest_match_score: parseFloat(document.getElementById("s_interest_match").value) || 0.5,
    student_major: document.getElementById("s_student_major").value,
    event_topic: document.getElementById("s_event_topic").value
  };

  try {
    const res = await fetch("/api/student-insights", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    renderStudentResults(data);
  } catch (err) {
    alert("Something went wrong. Please try again.");
  }
});

function renderStudentResults(data) {
  document.getElementById("studentEmptyState").style.display = "none";
  const panel = document.getElementById("studentOutput");
  panel.style.display = "flex";

  // Likelihood
  const score = data.attendance_likelihood.score;
  const color = data.attendance_likelihood.color;
  const circle = document.getElementById("likelihoodCircle");
  circle.style.borderColor = color === "green" ? "#4ade80" : color === "orange" ? "#fb923c" : "#f87171";
  document.getElementById("likelihoodScore").textContent = score;
  document.getElementById("likelihoodScore").style.color = color === "green" ? "#4ade80" : color === "orange" ? "#fb923c" : "#f87171";
  document.getElementById("likelihoodLabel").textContent = data.attendance_likelihood.label + " likelihood";

  // Warnings
  const warningsSection = document.getElementById("warningsSection");
  const warningsList = document.getElementById("warningsList");
  if (data.warnings && data.warnings.length > 0) {
    warningsSection.style.display = "block";
    warningsList.innerHTML = data.warnings.map(w =>
      `<div class="warning-item">⚠️ ${w.message}</div>`
    ).join("");
  } else {
    warningsSection.style.display = "none";
  }

  // Insights
  const insightsSection = document.getElementById("insightsSection");
  const insightsList = document.getElementById("insightsList");
  if (data.insights && data.insights.length > 0) {
    insightsSection.style.display = "block";
    const icons = {
      pattern_warning: "📊",
      logistics: "🗺️",
      reminder: "🔔",
      streak: "🔥",
      interest: "🎯"
    };
    insightsList.innerHTML = data.insights.map(i =>
      `<div class="insight-item">
        <span class="insight-icon">${icons[i.type] || "💡"}</span>
        <span>${i.message}</span>
      </div>`
    ).join("");
  } else {
    insightsSection.style.display = "none";
  }

  // Streak
  const streakSection = document.getElementById("streakSection");
  if (data.streak >= 2) {
    streakSection.style.display = "block";
    document.getElementById("streakDisplay").innerHTML =
      `🔥 ${data.streak}-event streak — keep it going!`;
  } else {
    streakSection.style.display = "none";
  }

  // Reminders — 3 stage
  const remindersList = document.getElementById("remindersList");
  const reminderIcons = { interest: "🎯", schedule: "📅", logistics: "📍" };
  remindersList.innerHTML = data.reminders.map(r =>
    `<div class="reminder-item">
      <span class="reminder-time">${reminderIcons[r.type] || "🔔"} ${r.timing}</span>
      <span>${r.message}</span>
    </div>`
  ).join("");

  // Email preview
  const emailPreview = document.getElementById("emailPreview");
  if (data.email_preview) {
    emailPreview.textContent = data.email_preview;
    currentEmailBody = data.email_preview;
    // Extract subject line
    const subjectLine = data.email_preview.split("\n")[0];
    currentEmailSubject = subjectLine.replace("Subject: ", "").trim();
  }

  // Cancellation prompt
  const cancelSection = document.getElementById("cancelSection");
  const cancelPrompt = document.getElementById("cancelPrompt");
  if (data.cancellation_prompt) {
    cancelSection.style.display = "block";
    cancelPrompt.innerHTML = `<p>${data.cancellation_prompt.message}</p>`;
  } else {
    cancelSection.style.display = "none";
  }

  panel.scrollIntoView({ behavior: "smooth" });
}

function handleCancel() {
  alert("✅ Your spot has been canceled. The organizer has been notified and can plan more accurately. Thank you!");
}

// ===== SEND EMAIL =====
let currentEmailBody = "";
let currentEmailSubject = "";

async function sendEmail() {
  const toEmail = document.getElementById("recipientEmail").value.trim();
  const btn = document.getElementById("sendEmailBtn");
  const statusDiv = document.getElementById("emailStatus");

  if (!toEmail) {
    showEmailStatus("error", "Please enter a recipient email address.");
    return;
  }
  if (!currentEmailBody) {
    showEmailStatus("error", "Generate a student check first before sending.");
    return;
  }

  btn.textContent = "📤 Sending...";
  btn.disabled = true;

  try {
    const res = await fetch("/api/send-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        to_email: toEmail,
        subject: currentEmailSubject,
        email_body: currentEmailBody
      })
    });

    const data = await res.json();

    if (data.status === "SENT") {
      showEmailStatus("success", `✅ Email sent to ${toEmail}`);
    } else {
      showEmailStatus("error", `❌ ${data.reason}`);
    }
  } catch (err) {
    showEmailStatus("error", "❌ Network error. Check the server is running.");
  } finally {
    btn.textContent = "📤 Send Email";
    btn.disabled = false;
  }
}

function showEmailStatus(type, message) {
  const div = document.getElementById("emailStatus");
  div.style.display = "block";
  div.className = type === "success" ? "email-status-ok" : "email-status-err";
  div.textContent = message;
}

// ===== BULK EMAIL UPLOAD =====
const bulkArea = document.getElementById("bulkUploadArea");
const bulkInput = document.getElementById("bulkFileInput");
let bulkFile = null;

if (bulkArea) {
  bulkArea.addEventListener("click", () => bulkInput.click());
  bulkArea.addEventListener("dragover", e => { e.preventDefault(); bulkArea.classList.add("dragover"); });
  bulkArea.addEventListener("dragleave", () => bulkArea.classList.remove("dragover"));
  bulkArea.addEventListener("drop", e => {
    e.preventDefault();
    bulkArea.classList.remove("dragover");
    if (e.dataTransfer.files[0]) setBulkFile(e.dataTransfer.files[0]);
  });
  bulkInput.addEventListener("change", () => {
    if (bulkInput.files[0]) setBulkFile(bulkInput.files[0]);
  });
}

function setBulkFile(file) {
  bulkFile = file;
  bulkArea.innerHTML = `<div class="upload-filename">📄 ${file.name} (${(file.size/1024).toFixed(1)} KB) — Ready</div>`;
  document.getElementById("bulkSendBtn").disabled = false;
}

async function sendBulkEmails() {
  if (!bulkFile) return;
  const btn = document.getElementById("bulkSendBtn");
  btn.textContent = "📨 Sending...";
  btn.disabled = true;

  const formData = new FormData();
  formData.append("file", bulkFile);

  try {
    const res = await fetch("/api/bulk-email", { method: "POST", body: formData });
    const data = await res.json();
    if (!res.ok) { alert("Error: " + (data.error || "Unknown")); return; }
    renderBulkEmailResults(data);
  } catch (err) {
    alert("Something went wrong. Please try again.");
  } finally {
    btn.textContent = "📨 Generate & Send All Emails";
    btn.disabled = false;
  }
}

function renderBulkEmailResults(data) {
  const panel = document.getElementById("bulkResults");
  panel.style.display = "block";

  // Badge
  const badge = document.getElementById("bulkStatusBadge");
  const allSent = data.summary.failed === 0 && data.summary.skipped === 0;
  badge.className = allSent ? "gate-badge" : "gate-badge blocked";
  badge.textContent = allSent
    ? `✅ All ${data.summary.sent} emails sent successfully`
    : `📨 ${data.summary.sent} sent · ${data.summary.failed} failed · ${data.summary.skipped} skipped`;

  // Summary cards
  document.getElementById("bulkEmailSummary").innerHTML = `
    <div class="bulk-stat">
      <div class="bulk-stat-num">${data.summary.total}</div>
      <div class="bulk-stat-label">Students processed</div>
    </div>
    <div class="bulk-stat">
      <div class="bulk-stat-num green">${data.summary.sent}</div>
      <div class="bulk-stat-label">Emails sent</div>
    </div>
    <div class="bulk-stat">
      <div class="bulk-stat-num" style="color:#f87171">${data.summary.failed + data.summary.skipped}</div>
      <div class="bulk-stat-label">Failed / skipped</div>
    </div>
  `;

  // Per-student table
  document.getElementById("bulkEmailTable").innerHTML = data.results.map(r => {
    if (r.status === "SENT") {
      const lClass = r.likelihood >= 70 ? "badge-high" : r.likelihood >= 45 ? "badge-medium" : "badge-low";
      const warnBadge = r.warnings > 0 ? `<span style="color:#f59e0b">⚠️ ${r.warnings}</span>` : `<span style="color:#4ade80">✅ None</span>`;
      return `<tr>
        <td><strong>${r.name}</strong></td>
        <td style="color:#6b7280;font-size:0.8rem">${r.email}</td>
        <td>${r.event}</td>
        <td class="${lClass}">${r.likelihood}% ${r.likelihood_label}</td>
        <td>${warnBadge}</td>
        <td style="color:#4ade80;font-weight:600">✅ Sent</td>
      </tr>`;
    } else {
      return `<tr>
        <td><strong>${r.name}</strong></td>
        <td style="color:#6b7280;font-size:0.8rem">${r.email}</td>
        <td colspan="3" style="color:#f87171;font-size:0.8rem">${r.reason || r.status}</td>
        <td style="color:#f87171;font-weight:600">❌ ${r.status}</td>
      </tr>`;
    }
  }).join("");

  panel.scrollIntoView({ behavior: "smooth" });
}
