"""
Tests for routes/middleware.py — require_auth and require_role decorators
Requirements: 1.6, 1.8, 7.5, 7.6
"""

import pytest
from app import create_app
from services import auth_service


@pytest.fixture
def client():
    app = create_app()
    app.config["TESTING"] = True
    with app.test_client() as c:
        yield c


@pytest.fixture(autouse=True)
def clear_sessions():
    auth_service._sessions.clear()
    yield
    auth_service._sessions.clear()


def _login(client, email="student@asu.edu"):
    resp = client.post("/api/auth/login", json={"email": email})
    return resp.get_json()["data"]["token"]


# ---------------------------------------------------------------------------
# require_auth on event routes
# ---------------------------------------------------------------------------

def test_get_events_without_token_returns_401(client):
    resp = client.get("/api/events")
    assert resp.status_code == 401
    body = resp.get_json()
    assert body["status"] == "error"
    assert body["error"] == "Authentication required"


def test_get_events_with_invalid_token_returns_401(client):
    resp = client.get("/api/events", headers={"Authorization": "Bearer bad-token"})
    assert resp.status_code == 401


def test_get_events_with_no_bearer_prefix_returns_401(client):
    resp = client.get("/api/events", headers={"Authorization": "bad-token"})
    assert resp.status_code == 401


def test_get_events_with_valid_token_returns_200(client):
    token = _login(client)
    resp = client.get("/api/events", headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 200


def test_get_event_detail_without_token_returns_401(client):
    resp = client.get("/api/events/evt-001")
    assert resp.status_code == 401


def test_get_event_detail_with_valid_token_returns_200_or_404(client):
    token = _login(client)
    resp = client.get("/api/events/evt-001", headers={"Authorization": f"Bearer {token}"})
    # Either found (200) or not found (404) — both mean auth passed
    assert resp.status_code in (200, 404)


def test_post_event_action_without_token_returns_401(client):
    resp = client.post("/api/events/evt-001/actions", json={"action_type": "reduce_over_preparation"})
    assert resp.status_code == 401


def test_post_event_action_with_valid_token_passes_auth(client):
    token = _login(client)
    resp = client.post(
        "/api/events/evt-001/actions",
        json={"action_type": "reduce_over_preparation"},
        headers={"Authorization": f"Bearer {token}"},
    )
    # Auth passed — either 200 (event found) or 404 (event not found)
    assert resp.status_code in (200, 404)


# ---------------------------------------------------------------------------
# Session invalidation invalidates auth
# ---------------------------------------------------------------------------

def test_invalidated_token_returns_401(client):
    token = _login(client)
    # Confirm it works first
    resp = client.get("/api/events", headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 200

    # Logout
    client.post("/api/auth/logout", headers={"Authorization": f"Bearer {token}"})

    # Now it should be rejected
    resp = client.get("/api/events", headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 401
