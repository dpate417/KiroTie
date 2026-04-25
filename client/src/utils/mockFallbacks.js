const SHOW_RATES = {
  food_social:        0.72,
  academic_workshop:  0.65,
  career_fair:        0.58,
  club_meeting:       0.80,
  general:            0.68,
}

export function mockPredictFallback(payload) {
  const rate = SHOW_RATES[payload.event_type] ?? 0.68
  const predicted = Math.round(payload.expected_signups * rate)
  const waste = Math.max(0, payload.planned_quantity - predicted) * 0.5
  const savings = waste * (payload.cost_per_person ?? 10)
  return {
    predicted_attendance: predicted,
    confidence_low:       Math.round(predicted * 0.85),
    confidence_high:      Math.round(predicted * 1.15),
    confidence_level:     'medium',
    show_rate_pct:        Math.round(rate * 100),
    expected_signups:     payload.expected_signups,
    planned_quantity:     payload.planned_quantity,
    food_waste_lbs:       parseFloat(waste.toFixed(1)),
    total_savings_usd:    parseFloat(savings.toFixed(2)),
    factors: [
      { label: 'Event Type',    impact: 'medium', detail: `${payload.event_type} events average ${Math.round(rate * 100)}% show rate` },
      { label: 'Registration',  impact: 'low',    detail: 'No registration timing data available; using baseline' },
    ],
  }
}

export function mockUploadFallback() {
  return {
    events: [
      { row: 1, event_name: 'Spring Mixer',   event_type: 'food_social',       expected_signups: 80,  predicted_attendance: 58,  show_rate_pct: 72, confidence_level: 'medium', over_prepared_by: 22, total_savings_usd: 110.00, food_waste_lbs: 11.0, co2_saved_kg: 4.9,  status: 'ok' },
      { row: 2, event_name: 'Resume Workshop', event_type: 'academic_workshop', expected_signups: 40,  predicted_attendance: 26,  show_rate_pct: 65, confidence_level: 'low',    over_prepared_by: 14, total_savings_usd: 70.00,  food_waste_lbs: 7.0,  co2_saved_kg: 3.1,  status: 'ok' },
      { row: 3, event_name: 'Career Fair',     event_type: 'career_fair',       expected_signups: 200, predicted_attendance: 116, show_rate_pct: 58, confidence_level: 'high',   over_prepared_by: 84, total_savings_usd: 420.00, food_waste_lbs: 42.0, co2_saved_kg: 18.7, status: 'ok' },
    ],
    summary: {
      total_events:         3,
      processed:            3,
      blocked:              0,
      total_savings_usd:    600.00,
      total_co2_saved_kg:   26.7,
      total_food_waste_lbs: 60.0,
    },
  }
}
