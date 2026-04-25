"""Tests for models/baselines.py — Baseline_Store loader."""

import json
import os
import pytest

from models.baselines import BaselineConstant, Baselines, load_baselines


VALID_DATA = {
    "food_waste_cost_per_lb": {"value": 1.84, "source": "USDA ERS 2023"},
    "carbon_per_lb_food_waste_kg": {"value": 0.37, "source": "EPA WARM Model"},
    "space_cost_per_person": {"value": 3.50, "source": "ASU Event Services"},
    "staff_cost_per_person": {"value": 2.00, "source": "ASU Event Services"},
    "materials_cost_per_person": {"value": 1.25, "source": "ASU Event Services"},
    "food_waste_lbs_per_person": {"value": 0.75, "source": "USDA ERS 2023"},
}


@pytest.fixture
def baseline_file(tmp_path):
    """Write valid baseline JSON and return its path."""
    p = tmp_path / "event_baselines.json"
    p.write_text(json.dumps(VALID_DATA))
    return str(p)


# --- happy path ---

def test_load_baselines_returns_baselines_instance(baseline_file):
    b = load_baselines(baseline_file)
    assert isinstance(b, Baselines)


def test_load_baselines_values(baseline_file):
    b = load_baselines(baseline_file)
    assert b.food_waste_cost_per_lb.value == pytest.approx(1.84)
    assert b.carbon_per_lb_food_waste_kg.value == pytest.approx(0.37)
    assert b.space_cost_per_person.value == pytest.approx(3.50)
    assert b.staff_cost_per_person.value == pytest.approx(2.00)
    assert b.materials_cost_per_person.value == pytest.approx(1.25)
    assert b.food_waste_lbs_per_person.value == pytest.approx(0.75)


def test_load_baselines_sources(baseline_file):
    b = load_baselines(baseline_file)
    assert b.food_waste_cost_per_lb.source == "USDA ERS 2023"
    assert b.space_cost_per_person.source == "ASU Event Services"


def test_per_person_cost_is_sum_of_space_staff_materials(baseline_file):
    b = load_baselines(baseline_file)
    assert b.per_person_cost == pytest.approx(3.50 + 2.00 + 1.25)  # $6.75


def test_per_person_cost_value(baseline_file):
    b = load_baselines(baseline_file)
    assert b.per_person_cost == pytest.approx(6.75)


# --- missing file ---

def test_missing_file_raises_system_exit(tmp_path):
    with pytest.raises(SystemExit):
        load_baselines(str(tmp_path / "nonexistent.json"))


def test_missing_file_logs_error(tmp_path, caplog):
    import logging
    with caplog.at_level(logging.ERROR, logger="models.baselines"):
        with pytest.raises(SystemExit):
            load_baselines(str(tmp_path / "nonexistent.json"))
    assert any("not found" in r.message.lower() or "nonexistent" in r.message for r in caplog.records)


# --- invalid values ---

@pytest.mark.parametrize("bad_value", [0, -1, -0.5, "abc", None])
def test_non_positive_value_raises_system_exit(tmp_path, bad_value):
    data = dict(VALID_DATA)
    data["space_cost_per_person"] = {"value": bad_value, "source": "test"}
    p = tmp_path / "bad.json"
    p.write_text(json.dumps(data))
    with pytest.raises(SystemExit):
        load_baselines(str(p))


def test_invalid_value_logs_field_name(tmp_path, caplog):
    import logging
    data = dict(VALID_DATA)
    data["staff_cost_per_person"] = {"value": -5, "source": "test"}
    p = tmp_path / "bad.json"
    p.write_text(json.dumps(data))
    with caplog.at_level(logging.ERROR, logger="models.baselines"):
        with pytest.raises(SystemExit):
            load_baselines(str(p))
    assert any("staff_cost_per_person" in r.message for r in caplog.records)


# --- real file smoke test ---

def test_load_real_baselines_file():
    real_path = os.path.join(os.path.dirname(__file__), "..", "data", "event_baselines.json")
    b = load_baselines(real_path)
    assert b.per_person_cost == pytest.approx(6.75)
