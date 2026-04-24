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


// ===== BULK EMAIL — FILE UPLOAD =====
const bulkArea = document.getElementById("bulkUploadArea");
const bulkInput = document.getElementById("bulkFileInput");
let bulkFile = null;
let allStudents = [];

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
  bulkArea.innerHTML = `<div class="upload-filename">📄 ${file.name} (${(file.size/1024).toFixed(1)} KB) — Ready to preview</div>`;
  document.getElementById("previewBtn").disabled = false;
}

// ===== STEP 1 → STEP 2: PREVIEW STUDENTS =====
async function previewStudents() {
  if (!bulkFile) return;
  const btn = document.getElementById("previewBtn");
  btn.textContent = "👁️ Loading...";
  btn.disabled = true;

  const formData = new FormData();
  formData.append("file", bulkFile);

  try {
    const res = await fetch("/api/preview-students", { method: "POST", body: formData });
    const data = await res.json();
    if (!res.ok) { alert("Error: " + (data.error || "Unknown")); return; }
    allStudents = data.students;
    renderStudentTable(data.students);
    document.getElementById("step1Card").style.display = "none";
    document.getElementById("step2Card").style.display = "block";
    document.getElementById("step2Card").scrollIntoView({ behavior: "smooth" });
  } catch (err) {
    alert("Something went wrong. Please try again.");
  } finally {
    btn.textContent = "👁️ Preview Students";
    btn.disabled = false;
  }
}

// ===== RENDER STUDENT SELECTION TABLE =====
function renderStudentTable(students) {
  const tbody = document.getElementById("studentSelectTable");
  tbody.innerHTML = students.map((s, i) => {
    const lClass = s.likelihood >= 70 ? "badge-high" : s.likelihood >= 45 ? "badge-medium" : "badge-low";
    const warnBadge = s.warnings > 0
      ? `<span style="color:#f59e0b" title="${s.warning_messages.join(' | ')}">⚠️ ${s.warnings} warning${s.warnings > 1 ? 's' : ''}</span>`
      : `<span style="color:#4ade80">✅ None</span>`;
    const emailBadge = s.has_valid_email
      ? `<span style="color:#4ade80;font-size:0.75rem">✅ Valid</span>`
      : `<span style="color:#f87171;font-size:0.75rem">❌ Missing</span>`;
    const previewSnippet = s.email_subject
      ? `<span style="color:#a5b4fc;font-size:0.75rem" title="${s.email_body}">${s.email_subject.substring(0, 35)}...</span>`
      : `<span style="color:#4b5563;font-size:0.75rem">—</span>`;

    return `<tr id="row-${i}" class="${s.warnings > 0 ? 'row-warning' : ''}">
      <td><input type="checkbox" class="student-check" data-index="${i}" onchange="updateCount()"/></td>
      <td><strong>${s.student_name}</strong></td>
      <td style="font-size:0.8rem;color:#6b7280">${s.email || '—'} ${emailBadge}</td>
      <td style="font-size:0.85rem">${s.event_name}</td>
      <td class="${lClass}">${s.likelihood}% <span style="font-size:0.72rem">${s.likelihood_label}</span></td>
      <td>${warnBadge}</td>
      <td>${previewSnippet}</td>
    </tr>`;
  }).join("");
  updateCount();
}

// ===== CHECKBOX HELPERS =====
function toggleAll(master) {
  document.querySelectorAll(".student-check").forEach(cb => cb.checked = master.checked);
  updateCount();
}

function selectAll() {
  document.querySelectorAll(".student-check").forEach(cb => cb.checked = true);
  document.getElementById("masterCheck").checked = true;
  updateCount();
}

function selectNone() {
  document.querySelectorAll(".student-check").forEach(cb => cb.checked = false);
  document.getElementById("masterCheck").checked = false;
  updateCount();
}

function selectLowLikelihood() {
  document.querySelectorAll(".student-check").forEach(cb => cb.checked = false);
  document.querySelectorAll(".student-check").forEach(cb => {
    const idx = parseInt(cb.dataset.index);
    if (allStudents[idx].likelihood < 60) cb.checked = true;
  });
  updateCount();
}

function selectWithWarnings() {
  document.querySelectorAll(".student-check").forEach(cb => cb.checked = false);
  document.querySelectorAll(".student-check").forEach(cb => {
    const idx = parseInt(cb.dataset.index);
    if (allStudents[idx].warnings > 0) cb.checked = true;
  });
  updateCount();
}

function updateCount() {
  const checked = document.querySelectorAll(".student-check:checked").length;
  document.getElementById("selectCount").textContent = `${checked} selected`;
  const btn = document.getElementById("sendSelectedBtn");
  const info = document.getElementById("sendInfo");
  btn.disabled = checked === 0;
  info.textContent = checked > 0
    ? `Ready to send ${checked} personalized email${checked > 1 ? 's' : ''}`
    : "Select students above to send emails";
}

// ===== STEP 2 → STEP 3: SEND SELECTED =====
async function sendSelectedEmails() {
  const checked = document.querySelectorAll(".student-check:checked");
  if (checked.length === 0) return;

  const btn = document.getElementById("sendSelectedBtn");
  btn.textContent = `📨 Sending ${checked.length} emails...`;
  btn.disabled = true;

  const selected = Array.from(checked).map(cb => {
    const idx = parseInt(cb.dataset.index);
    return allStudents[idx];
  });

  // Warn about missing emails but continue
  const missing = selected.filter(s => !s.has_valid_email || !s.email);
  if (missing.length > 0) {
    const names = missing.map(s => s.student_name).join(", ");
    if (!confirm(`${missing.length} student(s) have no email address: ${names}\n\nThey will be skipped. Continue?`)) {
      btn.textContent = "📨 Send to Selected Students";
      btn.disabled = false;
      return;
    }
  }

  try {
    const res = await fetch("/api/send-selected", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ students: selected })
    });
    const data = await res.json();
    if (!res.ok) { alert("Error: " + (data.error || "Unknown")); return; }
    renderSendResults(data);
    document.getElementById("step2Card").style.display = "none";
    document.getElementById("step3Card").style.display = "block";
    document.getElementById("step3Card").scrollIntoView({ behavior: "smooth" });
  } catch (err) {
    alert("Something went wrong. Please try again.");
  } finally {
    btn.textContent = "📨 Send to Selected Students";
    btn.disabled = false;
  }
}

// ===== RENDER SEND RESULTS =====
function renderSendResults(data) {
  const badge = document.getElementById("bulkStatusBadge");
  badge.className = data.summary.failed === 0 ? "gate-badge" : "gate-badge blocked";
  badge.textContent = data.summary.failed === 0
    ? `✅ All ${data.summary.sent} emails sent successfully`
    : `📨 ${data.summary.sent} sent · ${data.summary.failed} failed`;

  document.getElementById("bulkEmailSummary").innerHTML = `
    <div class="bulk-stat"><div class="bulk-stat-num">${data.summary.total}</div><div class="bulk-stat-label">Selected</div></div>
    <div class="bulk-stat"><div class="bulk-stat-num green">${data.summary.sent}</div><div class="bulk-stat-label">Sent ✅</div></div>
    <div class="bulk-stat"><div class="bulk-stat-num" style="color:#f87171">${data.summary.failed}</div><div class="bulk-stat-label">Failed ❌</div></div>
  `;

  document.getElementById("bulkEmailTable").innerHTML = data.results.map(r =>
    `<tr>
      <td><strong>${r.name}</strong></td>
      <td style="color:#6b7280;font-size:0.8rem">${r.email}</td>
      <td style="font-size:0.85rem">${r.event || '—'}</td>
      <td style="font-weight:600;color:${r.status === 'SENT' ? '#4ade80' : '#f87171'}">
        ${r.status === 'SENT' ? '✅ Sent' : '❌ ' + (r.reason || 'Failed')}
      </td>
    </tr>`
  ).join("");
}

function resetBulk() {
  bulkFile = null;
  allStudents = [];
  document.getElementById("step3Card").style.display = "none";
  document.getElementById("step2Card").style.display = "none";
  document.getElementById("step1Card").style.display = "block";
  document.getElementById("bulkUploadArea").innerHTML = `
    <div class="upload-icon">📂</div>
    <div class="upload-title">Drop student CSV here or click to browse</div>`;
  document.getElementById("previewBtn").disabled = true;
  document.getElementById("step1Card").scrollIntoView({ behavior: "smooth" });
}

// ===== STUDENT TAB SWITCHER =====
function switchStudentTab(tab, event) {
  document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
  if (event && event.target) event.target.classList.add("active");
  document.getElementById("singleTab").style.display = tab === "single" ? "block" : "none";
  document.getElementById("addlistTab").style.display = tab === "addlist" ? "block" : "none";
}

// ===== MANUAL STUDENT LIST =====
let manualStudents = [];

// Interest slider
const alInterest = document.getElementById("al_interest");
const alInterestLabel = document.getElementById("al_interest_label");
if (alInterest) {
  alInterest.addEventListener("input", () => {
    const v = parseFloat(alInterest.value);
    alInterestLabel.textContent = v >= 0.7 ? "High" : v >= 0.4 ? "Medium" : "Low";
  });
}

async function addStudentToList() {
  const name = document.getElementById("al_name").value.trim();
  const email = document.getElementById("al_email").value.trim();

  if (!name || !email) {
    showAddStatus("error", "Name and email are required.");
    return;
  }
  if (!email.includes("@")) {
    showAddStatus("error", "Please enter a valid email address.");
    return;
  }

  const studentData = {
    student_name: name,
    email: email,
    event_name: document.getElementById("al_event_name").value,
    event_time: document.getElementById("al_event_time").value,
    event_location: document.getElementById("al_event_location").value,
    last_class_end_time: document.getElementById("al_last_class_end").value,
    last_class_location: document.getElementById("al_last_class_location").value,
    distance_miles: parseFloat(document.getElementById("al_distance").value) || 0,
    day_of_week: document.getElementById("al_day").value,
    student_major: document.getElementById("al_major").value,
    event_topic: document.getElementById("al_topic").value,
    past_attended: parseInt(document.getElementById("al_attended").value) || 0,
    past_no_shows: parseInt(document.getElementById("al_noshows").value) || 0,
    interest_match_score: parseFloat(document.getElementById("al_interest").value) || 0.5,
    registration_days_ago: 1
  };

  // Get insights for this student
  try {
    const res = await fetch("/api/student-insights", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(studentData)
    });
    const insights = await res.json();

    const emailBody = insights.email_preview || "";
    const subject = emailBody.split("\n")[0].replace("Subject: ", "").trim();

    const student = {
      ...studentData,
      likelihood: insights.attendance_likelihood.score,
      likelihood_label: insights.attendance_likelihood.label,
      likelihood_color: insights.attendance_likelihood.color,
      warnings: insights.warnings ? insights.warnings.length : 0,
      warning_messages: insights.warnings ? insights.warnings.map(w => w.message) : [],
      email_subject: subject,
      email_body: emailBody,
      has_valid_email: true,
      index: manualStudents.length
    };

    manualStudents.push(student);
    renderManualList();
    showAddStatus("success", `✅ ${name} added to list (${manualStudents.length} total)`);

    // Clear name and email for next entry
    document.getElementById("al_name").value = "";
    document.getElementById("al_email").value = "";
    document.getElementById("al_name").focus();

  } catch (err) {
    showAddStatus("error", "Could not process student. Try again.");
  }
}

function showAddStatus(type, msg) {
  const div = document.getElementById("addListStatus");
  div.style.display = "block";
  div.className = type === "success" ? "email-status-ok" : "email-status-err";
  div.textContent = msg;
  setTimeout(() => { div.style.display = "none"; }, 3000);
}

function renderManualList() {
  const section = document.getElementById("manualListSection");
  section.style.display = "block";
  document.getElementById("manualListCount").textContent = `${manualStudents.length} student${manualStudents.length !== 1 ? 's' : ''} added`;

  const list = document.getElementById("manualStudentList");
  list.innerHTML = manualStudents.map((s, i) => {
    const lColor = s.likelihood >= 70 ? "#4ade80" : s.likelihood >= 45 ? "#fb923c" : "#f87171";
    const warnBadge = s.warnings > 0 ? `⚠️ ${s.warnings}` : "✅";
    return `<div class="manual-student-row" id="mrow-${i}">
      <input type="checkbox" class="manual-check" data-index="${i}" checked onchange="updateManualCount()"/>
      <div class="manual-student-info">
        <div class="manual-student-name">${s.student_name}</div>
        <div class="manual-student-email">${s.email}</div>
      </div>
      <div class="manual-student-meta">
        <span style="color:${lColor};font-weight:600;font-size:0.8rem">${s.likelihood}%</span>
        <span style="font-size:0.75rem;color:#6b7280">${s.likelihood_label}</span>
      </div>
      <div class="manual-student-warn" style="font-size:0.8rem">${warnBadge}</div>
      <button class="manual-remove" onclick="removeStudent(${i})" title="Remove">✕</button>
    </div>`;
  }).join("");

  updateManualCount();
}

function updateManualCount() {
  const checked = document.querySelectorAll(".manual-check:checked").length;
  const btn = document.getElementById("emailListBtn");
  btn.textContent = checked > 0
    ? `📨 Email ${checked} Selected Student${checked !== 1 ? 's' : ''}`
    : "📨 Email Selected Students";
  btn.disabled = checked === 0;
}

function removeStudent(index) {
  manualStudents.splice(index, 1);
  // Re-index
  manualStudents.forEach((s, i) => s.index = i);
  if (manualStudents.length === 0) {
    document.getElementById("manualListSection").style.display = "none";
  } else {
    renderManualList();
  }
}

function clearManualList() {
  manualStudents = [];
  document.getElementById("manualListSection").style.display = "none";
}

async function openEmailManager() {
  const checked = document.querySelectorAll(".manual-check:checked");
  if (checked.length === 0) return;

  const selected = Array.from(checked).map(cb => manualStudents[parseInt(cb.dataset.index)]);

  // Load them into the step2 table and show it
  allStudents = selected.map((s, i) => ({ ...s, index: i }));
  renderStudentTable(allStudents);

  // Scroll to and show the email manager
  document.getElementById("step1Card").style.display = "none";
  document.getElementById("step2Card").style.display = "block";
  document.getElementById("step3Card").style.display = "none";

  // Pre-check all
  selectAll();

  document.querySelector(".bulk-email-section").scrollIntoView({ behavior: "smooth" });
}
