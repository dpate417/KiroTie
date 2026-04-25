import pytest
from services import auth_service
from services.auth_service import (
    validate_email,
    assign_role,
    create_session,
    get_session,
    invalidate_session,
)
from models.session import Session


@pytest.fixture(autouse=True)
def clear_sessions():
    """Clear the in-memory session store before each test."""
    auth_service._sessions.clear()
    yield
    auth_service._sessions.clear()


# --- validate_email ---

def test_validate_email_valid():
    assert validate_email("student@asu.edu") is True

def test_validate_email_invalid_domain():
    assert validate_email("user@gmail.com") is False

def test_validate_email_no_at():
    assert validate_email("notanemail") is False

def test_validate_email_empty():
    assert validate_email("") is False

def test_validate_email_subdomain():
    # only @asu.edu suffix counts
    assert validate_email("user@sub.asu.edu") is False


# --- assign_role ---

def test_assign_role_hardcoded_organizer():
    assert assign_role("organizer@asu.edu") == "organizer"

def test_assign_role_staff_prefix():
    assert assign_role("staff.john@asu.edu") == "organizer"

def test_assign_role_faculty_prefix():
    assert assign_role("faculty.jane@asu.edu") == "organizer"

def test_assign_role_student():
    assert assign_role("jdoe@asu.edu") == "student"

def test_assign_role_student_no_prefix():
    assert assign_role("astudent@asu.edu") == "student"


# --- create_session / get_session ---

def test_create_session_returns_token():
    token = create_session("student@asu.edu", "student")
    assert isinstance(token, str) and len(token) == 64  # 32 bytes hex = 64 chars

def test_create_session_stores_session():
    token = create_session("student@asu.edu", "student")
    session = get_session(token)
    assert session is not None
    assert isinstance(session, Session)
    assert session.token == token
    assert session.email == "student@asu.edu"
    assert session.role == "student"

def test_create_session_unique_tokens():
    token1 = create_session("a@asu.edu", "student")
    token2 = create_session("b@asu.edu", "student")
    assert token1 != token2

def test_get_session_missing_returns_none():
    assert get_session("nonexistent") is None


# --- invalidate_session ---

def test_invalidate_session_removes_session():
    token = create_session("student@asu.edu", "student")
    invalidate_session(token)
    assert get_session(token) is None

def test_invalidate_session_nonexistent_no_error():
    # Should not raise
    invalidate_session("ghost_token")
