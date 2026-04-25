/**
 * Attendance Engine — computes predicted attendance, likelihood classification,
 * risk factors, and signup trend for EventWise events.
 *
 * Implements Requirements 3.1–3.5 (Attendance Prediction).
 */

const DEFAULT_HISTORICAL_RATIO = 0.65;

/**
 * Parse the hour from an HH:MM 24h time string.
 * @param {string} time - e.g. "13:30"
 * @returns {number} hour (0–23)
 */
function parseHour(time) {
  return parseInt(time.split(":")[0], 10);
}

/**
 * Parse the day of week (0=Sun, 1=Mon, ..., 6=Sat) from an ISO 8601 date string.
 * @param {string} date - e.g. "2025-04-15"
 * @returns {number} day of week
 */
function parseDayOfWeek(date) {
  return new Date(date + "T12:00:00").getDay();
}

/**
 * Compute predicted attendance for an event by applying signal weights.
 *
 * @param {object} event - Event object matching the Event interface
 * @returns {number} predicted attendance count
 */
export function computePrediction(event) {
  const { signup_count, historical_ratio, time, date, competing_event_ids, academic_calendar_flags } = event;

  const baseRatio = historical_ratio !== undefined ? historical_ratio : DEFAULT_HISTORICAL_RATIO;

  // Time of day adjustment
  const hour = parseHour(time);
  let timeAdj = 0;
  if ((hour >= 11 && hour < 14) || (hour >= 17 && hour < 19)) {
    timeAdj = 0.05;  // peak hours
  } else if (hour < 9 || hour >= 21) {
    timeAdj = -0.05; // early morning / late night
  }

  // Day of week adjustment
  const dow = parseDayOfWeek(date);
  let dayAdj = 0;
  if (dow === 2 || dow === 3 || dow === 4) {
    dayAdj = 0.05;  // Tue/Wed/Thu
  } else if (dow === 1 || dow === 5) {
    dayAdj = -0.05; // Mon/Fri
  }

  // Competing events adjustment (capped at -0.20)
  const competingAdj = Math.max(-0.20, competing_event_ids.length * -0.10);

  // Academic calendar conflict adjustment
  const academicAdj = academic_calendar_flags.length > 0 ? -0.15 : 0;

  // Aggregated weight = base ratio + all adjustments
  const aggregatedWeight = baseRatio + timeAdj + dayAdj + competingAdj + academicAdj;

  const predicted = Math.round(signup_count * aggregatedWeight);

  // Clamp to [0, signup_count]
  return Math.max(0, Math.min(signup_count, predicted));
}

/**
 * Classify attendance likelihood based on predicted vs signup count.
 *
 * @param {number} predicted - predicted attendance count
 * @param {number} signups - total signup count
 * @returns {"High"|"Medium"|"Low"}
 */
export function classifyLikelihood(predicted, signups) {
  if (signups === 0) return "Low";
  const ratio = predicted / signups;
  if (ratio >= 0.80) return "High";
  if (ratio >= 0.50) return "Medium";
  return "Low";
}

/**
 * Compute risk factors for an event.
 *
 * @param {object} event - Event object
 * @returns {Array<{type: string, label: string, detail: string}>}
 */
export function computeRiskFactors(event) {
  const { competing_event_ids, academic_calendar_flags, time, date } = event;
  const factors = [];

  if (competing_event_ids.length > 0) {
    const count = competing_event_ids.length;
    factors.push({
      type: "competing_event",
      label: "Competing Events",
      detail: `${count} competing event(s) in the same time slot reduce expected turnout.`,
    });
  }

  if (academic_calendar_flags.length > 0) {
    factors.push({
      type: "academic_conflict",
      label: "Academic Calendar Conflict",
      detail: `Event falls during: ${academic_calendar_flags.join(", ")}.`,
    });
  }

  // Check time and day for poor slot — only add one "poor_time_slot" entry
  const hour = parseHour(time);
  const dow = parseDayOfWeek(date);

  const isPoorTime = hour < 9 || hour >= 21;
  const isPoorDay = dow === 1 || dow === 5; // Mon or Fri

  if (isPoorTime) {
    factors.push({
      type: "poor_time_slot",
      label: "Poor Time Slot",
      detail: "Event is scheduled outside peak attendance hours.",
    });
  } else if (isPoorDay) {
    factors.push({
      type: "poor_time_slot",
      label: "Low-Traffic Day",
      detail: "Monday and Friday events typically see lower turnout.",
    });
  }

  return factors;
}

/**
 * Get the signup trend for an event.
 *
 * @param {object} event - Event object
 * @returns {"growing"|"slowing"|"stagnant"}
 */
export function getSignupTrend(event) {
  const { signup_trend, signup_count, historical_ratio } = event;

  if (signup_trend !== undefined) {
    return signup_trend;
  }

  if (signup_count > 0 && historical_ratio !== undefined && historical_ratio > 0.70) {
    return "growing";
  }
  if (historical_ratio !== undefined && historical_ratio < 0.55) {
    return "slowing";
  }
  return "stagnant";
}
