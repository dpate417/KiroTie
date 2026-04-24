const interestSlider = document.getElementById("interest_match_score");
const interestLabel = document.getElementById("interest_label");

interestSlider.addEventListener("input", () => {
  const v = parseFloat(interestSlider.value);
  interestLabel.textContent = v >= 0.7 ? "High" : v >= 0.4 ? "Medium" : "Low";
});

document.getElementById("predictForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const btn = document.getElementById("predictBtn");
  btn.textContent = "⚙️ Analyzing...";
  btn.disabled = true;

  const historical = document.getElementById("historical_show_rate").value;

  const payload = {
    event_type: document.getElementById("event_type").value,
    expected_signups: parseInt(document.getElementById("expected_signups").value),
    planned_quantity: parseInt(document.getElementById("planned_quantity").value),
    cost_per_person: parseFloat(document.getElementById("cost_per_person").value) || 15,
    time_slot: document.getElementById("time_slot").value,
    registration_timing: document.getElementById("registration_timing").value,
    interest_match_score: parseFloat(interestSlider.value),
    historical_show_rate: historical ? parseFloat(historical) : null
  };

  try {
    const res = await fetch("/api/predict", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const data = await res.json();

    if (!res.ok) {
      showGateBlocked(data.error);
      return;
    }

    renderResults(data, payload.planned_quantity);
  } catch (err) {
    alert("Something went wrong. Please try again.");
  } finally {
    btn.textContent = "⚙️ Predict Attendance & Reveal Hidden Costs";
    btn.disabled = false;
  }
});

function showGateBlocked(reason) {
  document.getElementById("emptyState").style.display = "none";
  document.getElementById("outputPanel").style.display = "flex";

  const badge = document.getElementById("gateBadge");
  badge.className = "gate-badge blocked";
  badge.textContent = "🚫 Transparency Gate: BLOCKED — " + reason;
}

function renderResults(data, planned) {
  document.getElementById("emptyState").style.display = "none";
  const panel = document.getElementById("outputPanel");
  panel.style.display = "flex";

  // Gate badge
  const badge = document.getElementById("gateBadge");
  badge.className = "gate-badge";
  badge.textContent = "✅ Transparency Gate: APPROVED — Prediction grounded in verified data (USDA · EPA)";

  // Prediction numbers
  document.getElementById("predictedNum").textContent = data.predicted_attendance;
  document.getElementById("predictedNum2").textContent = data.predicted_attendance;
  document.getElementById("plannedNum").textContent = planned;
  document.getElementById("overPrepNum").textContent = data.over_prepared_by;
  document.getElementById("confidenceRange").textContent =
    `Range: ${data.confidence_low} – ${data.confidence_high} people`;

  const confBadge = document.getElementById("confidenceBadge");
  confBadge.textContent = data.confidence_level + " confidence";
  confBadge.className = "confidence-badge " + data.confidence_level;

  // Economics breakdown
  const breakdown = document.getElementById("costBreakdown");
  breakdown.innerHTML = data.breakdown.map(item => `
    <div class="cost-item">
      <span class="cost-item-label">${item.icon} ${item.label}</span>
      <span class="cost-item-amount">$${item.amount.toFixed(2)}</span>
    </div>
  `).join("");

  document.getElementById("totalSavings").textContent = "$" + data.total_savings_usd.toFixed(2);
  document.getElementById("dataSource").textContent = data.economics_data_source;

  // Environmental
  document.getElementById("foodWasteLbs").textContent = data.food_waste_lbs;
  document.getElementById("co2Saved").textContent = data.co2_saved_kg;

  // Semester projection
  document.getElementById("semesterSavings").textContent =
    "$" + data.semester_projection.total_savings_usd.toLocaleString();
  document.getElementById("semesterCO2").textContent =
    data.semester_projection.co2_saved_kg + " kg";

  // Factors
  const factorsList = document.getElementById("factorsList");
  factorsList.innerHTML = data.factors.map(f => `
    <div class="factor-item">
      <div class="factor-dot ${f.impact}"></div>
      <div>
        <div class="factor-label">${f.label}</div>
        <div class="factor-detail">${f.detail}</div>
      </div>
    </div>
  `).join("");

  panel.scrollIntoView({ behavior: "smooth" });
}

// ===== TAB SWITCHING =====
function switchTab(tab) {
  document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
  event.target.classList.add("active");

  if (tab === "manual") {
    document.getElementById("manualTab").style.display = "block";
    document.getElementById("uploadTab").style.display = "none";
  } else {
    document.getElementById("manualTab").style.display = "none";
    document.getElementById("uploadTab").style.display = "block";
  }

  // Reset outputs
  document.getElementById("outputPanel").style.display = "none";
  document.getElementById("bulkPanel").style.display = "none";
  document.getElementById("emptyState").style.display = "flex";
}

// ===== FILE UPLOAD =====
const uploadArea = document.getElementById("uploadArea");
const fileInput = document.getElementById("fileInput");
let selectedFile = null;

uploadArea.addEventListener("click", () => fileInput.click());

uploadArea.addEventListener("dragover", (e) => {
  e.preventDefault();
  uploadArea.classList.add("dragover");
});

uploadArea.addEventListener("dragleave", () => uploadArea.classList.remove("dragover"));

uploadArea.addEventListener("drop", (e) => {
  e.preventDefault();
  uploadArea.classList.remove("dragover");
  const file = e.dataTransfer.files[0];
  if (file) setFile(file);
});

fileInput.addEventListener("change", () => {
  if (fileInput.files[0]) setFile(fileInput.files[0]);
});

function setFile(file) {
  selectedFile = file;
  uploadArea.innerHTML = `
    <div class="upload-filename">📄 ${file.name} (${(file.size / 1024).toFixed(1)} KB)</div>
    <div class="upload-sub">Ready to process</div>
  `;
  document.getElementById("uploadBtn").disabled = false;
}

async function uploadFile() {
  if (!selectedFile) return;

  const btn = document.getElementById("uploadBtn");
  btn.textContent = "⚙️ Processing...";
  btn.disabled = true;

  const formData = new FormData();
  formData.append("file", selectedFile);

  try {
    const res = await fetch("/api/upload", { method: "POST", body: formData });
    const data = await res.json();

    if (!res.ok) {
      alert("Error: " + data.error);
      return;
    }

    renderBulkResults(data);
  } catch (err) {
    alert("Something went wrong. Please try again.");
  } finally {
    btn.textContent = "⚙️ Predict All Events";
    btn.disabled = false;
  }
}

function renderBulkResults(data) {
  document.getElementById("emptyState").style.display = "none";
  document.getElementById("outputPanel").style.display = "none";
  const panel = document.getElementById("bulkPanel");
  panel.style.display = "flex";
  panel.style.flexDirection = "column";
  panel.style.gap = "1rem";

  // Gate badge
  const blocked = data.summary.blocked;
  const badge = document.getElementById("bulkGateBadge");
  if (blocked > 0) {
    badge.className = "gate-badge blocked";
    badge.textContent = `⚠️ Transparency Gate: ${blocked} row(s) BLOCKED — insufficient data`;
  } else {
    badge.className = "gate-badge";
    badge.textContent = "✅ Transparency Gate: ALL APPROVED — Predictions grounded in USDA · EPA data";
  }

  // Summary
  document.getElementById("bulkSummary").innerHTML = `
    <div class="bulk-stat">
      <div class="bulk-stat-num">${data.summary.processed}</div>
      <div class="bulk-stat-label">Events processed</div>
    </div>
    <div class="bulk-stat">
      <div class="bulk-stat-num yellow">$${data.summary.total_savings_usd.toLocaleString()}</div>
      <div class="bulk-stat-label">Total savings revealed</div>
    </div>
    <div class="bulk-stat">
      <div class="bulk-stat-num green">${data.summary.total_co2_saved_kg} kg</div>
      <div class="bulk-stat-label">CO₂ saved</div>
    </div>
  `;

  // Table
  const tbody = document.getElementById("bulkTableBody");
  tbody.innerHTML = data.events.map(e => {
    if (e.status === "BLOCKED") {
      return `<tr>
        <td>${e.event_name}</td>
        <td colspan="7" class="badge-blocked">🚫 BLOCKED — ${e.reason}</td>
      </tr>`;
    }
    const confClass = `badge-${e.confidence_level}`;
    return `<tr>
      <td><strong>${e.event_name}</strong></td>
      <td>${e.expected_signups}</td>
      <td><strong>${e.predicted_attendance}</strong></td>
      <td>${e.show_rate_pct}%</td>
      <td style="color:#f87171">${e.over_prepared_by}</td>
      <td style="color:#f59e0b"><strong>$${e.total_savings_usd.toFixed(0)}</strong></td>
      <td style="color:#4ade80">${e.co2_saved_kg} kg</td>
      <td class="${confClass}">${e.confidence_level}</td>
    </tr>`;
  }).join("");

  panel.scrollIntoView({ behavior: "smooth" });
}
