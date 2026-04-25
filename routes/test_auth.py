"""
Tests for routes/auth.py — POST /api/auth/login and POST /api/auth/logout
Requirements: 1.1, 1.2, 1.3, 7.1, 7.7
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
    """Clear in-memory sessions between tests."""
    auth_service._sessions.clear()
    yield
    auth_service._sessions.clear()


# ---------------------------------------------------------------------------
# POST /api/auth/login
# ---------------------------------------------------------------------------

def test_login_valid_student_email(client):
    resp = client.post("/api/auth/login", json={"email": "student@asu.edu"})
    assert resp.status_code == 200
    body = resp.get_json()
    assert body["status"] == "ok"
    assert body["error"] is None
    assert "token" in body["data"]
    assert body["data"]["role"] == "student"


def test_login_valid_organizer_email(client):
    resp = client.post("/api/auth/login", json={"email": "organizer@asu.edu"})
    assert resp.status_code == 200
    body = resp.get_json()
    assert body["data"]["role"] == "organizer"


def test_login_staff_prefix_gets_organizer_role(client):
    resp = client.post("/api/auth/login", json={"email": "staff.john@asu.edu"})
    assert resp.status_code == 200
    assert resp.get_json()["data"]["role"] == "organizer"


def test_login_invalid_domain_returns_400(client):
    resp = client.post("/api/auth/login", json={"email": "user@gmail.com"})
    assert resp.status_code == 400
    body = resp.get_json()
    assert body["status"] == "error"
    assert body["data"] is None
    assert body["error"] == "ASU email required"


def test_login_missing_email_returns_400(client):
    resp = client.post("/api/auth/login", json={})
    assert resp.status_code == 400
    body = resp.get_json()
    assert body["status"] == "error"
    assert body["error"] == "ASU email required"


def test_login_empty_email_returns_400(client):
    resp = client.post("/api/auth/login", json={"email": ""})
    assert resp.status_code == 400


def test_login_no_body_returns_400(client):
    resp = client.post("/api/auth/login", content_type="application/json", data="")
    assert resp.status_code == 400


def test_login_creates_valid_session(client):
    resp = client.post("/api/auth/login", json={"email": "student@asu.edu"})
    token = resp.get_json()["data"]["token"]
    session = auth_service.get_session(token)
    assert session is not None
    assert session.email == "student@asu.edu"
    assert session.role == "student"


# ---------------------------------------------------------------------------
# POST /api/auth/logout
# ---------------------------------------------------------------------------

def test_logout_via_bearer_header(client):
    # Login first
    login_resp = client.post("/api/auth/login", json={"email": "student@asu.edu"})
    token = login_resp.get_json()["data"]["token"]

    resp = client.post(
        "/api/auth/logout",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resp.status_code == 200
    body = resp.get_json()
    assert body["status"] == "ok"
    assert body["data"] is None
    assert body["error"] is None

    # Session should be gone
    assert auth_service.get_session(token) is None


def test_logout_via_request_body(client):
    login_resp = client.post("/api/auth/login", json={"email": "student@asu.edu"})
    token = login_resp.get_json()["data"]["token"]

    resp = client.post("/api/auth/logout", json={"token": token})
    assert resp.status_code == 200
    assert auth_service.get_session(token) is None


def test_logout_with_invalid_token_still_returns_200(client):
    resp = client.post(
        "/api/auth/logout",
        headers={"Authorization": "Bearer nonexistent-token"},
    )
    assert resp.status_code == 200


def test_logout_with_no_token_still_returns_200(client):
    resp = client.post("/api/auth/logout", json={})
    assert resp.status_code == 200
