export const BASELINES = {
  food_waste_cost_per_lb:       { value: 1.84,  source: "USDA ERS 2023" },
  carbon_per_lb_food_waste_kg:  { value: 0.37,  source: "EPA WARM Model" },
  space_cost_per_person:        { value: 3.50,  source: "ASU Event Services" },
  staff_cost_per_person:        { value: 2.00,  source: "ASU Event Services" },
  materials_cost_per_person:    { value: 1.25,  source: "ASU Event Services" },
  food_waste_lbs_per_person:    { value: 0.75,  source: "USDA ERS 2023" },
};

const perPersonCostUsd =
  BASELINES.space_cost_per_person.value +
  BASELINES.staff_cost_per_person.value +
  BASELINES.materials_cost_per_person.value; // = 6.75

const sources = [...new Set(Object.values(BASELINES).map((b) => b.source))];

/**
 * Computes waste and cost insight for an event given a predicted attendance count.
 *
 * @param {Object} event - Event object with a `signup_count` field.
 * @param {number} predictedCount - Predicted attendance count.
 * @returns {Object} Waste insight object.
 */
export function computeWaste(event, predictedCount) {
  const rsvpCount = event.signup_count;
  const recommendedPrep = Math.round(predictedCount * 1.10);

  if (predictedCount >= rsvpCount) {
    return {
      overPrepGap: 0,
      wastedCostUsd: 0,
      recommendedPrep,
      savingsIfAdjustedUsd: 0,
      carbonSavingsKg: 0,
      perPersonCostUsd,
      sources,
    };
  }

  const overPrepGap = rsvpCount - predictedCount;
  const wastedCostUsd = overPrepGap * perPersonCostUsd;
  const carbonSavingsKg =
    overPrepGap *
    BASELINES.food_waste_lbs_per_person.value *
    BASELINES.carbon_per_lb_food_waste_kg.value;

  return {
    overPrepGap,
    wastedCostUsd,
    recommendedPrep,
    savingsIfAdjustedUsd: wastedCostUsd,
    carbonSavingsKg,
    perPersonCostUsd,
    sources,
  };
}
