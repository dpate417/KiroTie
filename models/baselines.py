"""Baseline_Store loader — loads economic/environmental constants from JSON."""

import json
import logging
from dataclasses import dataclass

logger = logging.getLogger(__name__)


@dataclass
class BaselineConstant:
    value: float
    source: str


@dataclass
class Baselines:
    food_waste_cost_per_lb: BaselineConstant
    carbon_per_lb_food_waste_kg: BaselineConstant
    space_cost_per_person: BaselineConstant
    staff_cost_per_person: BaselineConstant
    materials_cost_per_person: BaselineConstant
    food_waste_lbs_per_person: BaselineConstant

    @property
    def per_person_cost(self) -> float:
        """Sum of space, staff, and materials cost per person ($6.75)."""
        return (
            self.space_cost_per_person.value
            + self.staff_cost_per_person.value
            + self.materials_cost_per_person.value
        )


_REQUIRED_FIELDS = [
    "food_waste_cost_per_lb",
    "carbon_per_lb_food_waste_kg",
    "space_cost_per_person",
    "staff_cost_per_person",
    "materials_cost_per_person",
    "food_waste_lbs_per_person",
]


def load_baselines(path: str) -> Baselines:
    """Load and validate baselines from a JSON file.

    Halts with SystemExit if the file is missing or any value is not a
    positive number.
    """
    try:
        with open(path, "r", encoding="utf-8") as f:
            raw = json.load(f)
    except FileNotFoundError:
        logger.error("Baseline_Store file not found: %s", path)
        raise SystemExit(1)

    constants: dict[str, BaselineConstant] = {}
    for field in _REQUIRED_FIELDS:
        entry = raw.get(field, {})
        value = entry.get("value")
        source = entry.get("source", "")

        if not isinstance(value, (int, float)) or value <= 0:
            logger.error(
                "Invalid baseline value for '%s': %r (must be a positive number)",
                field,
                value,
            )
            raise SystemExit(1)

        constants[field] = BaselineConstant(value=float(value), source=source)

    return Baselines(
        food_waste_cost_per_lb=constants["food_waste_cost_per_lb"],
        carbon_per_lb_food_waste_kg=constants["carbon_per_lb_food_waste_kg"],
        space_cost_per_person=constants["space_cost_per_person"],
        staff_cost_per_person=constants["staff_cost_per_person"],
        materials_cost_per_person=constants["materials_cost_per_person"],
        food_waste_lbs_per_person=constants["food_waste_lbs_per_person"],
    )
