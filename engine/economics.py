"""
Economics Engine — The Hidden Cost Exposer
Turns invisible waste data into actionable financial insight.
Data sources: USDA ERS 2023, EPA WARM Model
"""
import json
import os

BASE_DIR = os.path.dirname(os.path.dirname(__file__))
with open(os.path.join(BASE_DIR, "data", "event_baselines.json")) as f:
    BASELINES = json.load(f)

ECON = BASELINES["economic_constants"]
EVENT_TYPES = BASELINES["event_types"]


def calculate_waste_cost(planned: int, predicted: int, event_type: str, cost_per_person: float) -> dict:
    """
    Exposes the hidden economic cost of over-preparation.
    Returns dollar savings, food waste, CO2 impact, and semester projection.
    """
    over_prep = max(0, planned - predicted)

    # Direct food/resource cost
    direct_savings_usd = round(over_prep * cost_per_person, 2)

    # Food waste (lbs) using USDA baseline
    waste_lbs_per_person = EVENT_TYPES.get(event_type, EVENT_TYPES["general"])["avg_food_waste_lbs_per_person"]
    food_waste_lbs = round(over_prep * waste_lbs_per_person, 2)
    food_waste_cost_usd = round(food_waste_lbs * ECON["food_waste_cost_per_lb_usd"], 2)

    # CO2 equivalent using EPA WARM model
    co2_saved_kg = round(food_waste_lbs * ECON["co2_per_lb_food_waste_kg"], 2)

    # Hidden costs (space, staff, printed materials)
    space_savings = round(over_prep * ECON["space_cost_per_extra_person_usd"], 2)
    staff_savings = round(over_prep * ECON["staff_cost_per_extra_person_usd"], 2)
    materials_savings = round(over_prep * ECON["printed_materials_cost_per_person_usd"], 2)
    hidden_cost_usd = round(space_savings + staff_savings + materials_savings, 2)

    total_savings_usd = round(direct_savings_usd + food_waste_cost_usd + hidden_cost_usd, 2)

    # Semester projection (assume 20 similar events/semester)
    semester_savings = round(total_savings_usd * 20, 2)
    semester_co2 = round(co2_saved_kg * 20, 2)

    return {
        "over_prepared_by": over_prep,
        "direct_savings_usd": direct_savings_usd,
        "food_waste_lbs": food_waste_lbs,
        "food_waste_cost_usd": food_waste_cost_usd,
        "co2_saved_kg": co2_saved_kg,
        "hidden_costs": {
            "space_usd": space_savings,
            "staff_usd": staff_savings,
            "materials_usd": materials_savings,
            "total_usd": hidden_cost_usd
        },
        "total_savings_usd": total_savings_usd,
        "semester_projection": {
            "total_savings_usd": semester_savings,
            "co2_saved_kg": semester_co2,
            "events_count": 20
        },
        "economics_data_source": ECON["data_source"],
        "breakdown": [
            {"label": "Food & resources", "amount": direct_savings_usd, "icon": "🍕"},
            {"label": "Food waste disposal", "amount": food_waste_cost_usd, "icon": "🗑️"},
            {"label": "Space over-reservation", "amount": space_savings, "icon": "🏛️"},
            {"label": "Staff over-allocation", "amount": staff_savings, "icon": "👥"},
            {"label": "Printed materials", "amount": materials_savings, "icon": "📄"}
        ]
    }
