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
    registration_days_ago: parseInt(document.getElementById("s_reg_days_ago").value) || 1
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
      streak: "🔥"
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

  // Reminders
  const remindersList = document.getElementById("remindersList");
  remindersList.innerHTML = data.reminders.map(r =>
    `<div class="reminder-item">
      <span class="reminder-time">${r.timing}</span>
      <span>${r.message}</span>
    </div>`
  ).join("");

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
