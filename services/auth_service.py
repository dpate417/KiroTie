import secrets
from models.session import Session

# Hardcoded organizer emails and prefix patterns
_ORGANIZER_EMAILS: list[str] = ["organizer@asu.edu"]
_ORGANIZER_PREFIXES: tuple[str, ...] = ("staff.", "faculty.")

# In-memory session store: token -> Session
_sessions: dict[str, Session] = {}


def validate_email(email: str) -> bool:
    """Returns True only if the email ends with @asu.edu."""
    return isinstance(email, str) and email.endswith("@asu.edu")


def assign_role(email: str) -> str:
    """Returns 'organizer' for known organizer emails/prefixes, 'student' otherwise."""
    if email in _ORGANIZER_EMAILS:
        return "organizer"
    local = email.split("@")[0] if "@" in email else email
    if any(local.startswith(prefix) for prefix in _ORGANIZER_PREFIXES):
        return "organizer"
    return "student"


def create_session(email: str, role: str) -> str:
    """Generates a unique token, stores the session, and returns the token."""
    token = secrets.token_hex(32)
    _sessions[token] = Session(token=token, email=email, role=role)
    return token


def get_session(token: str) -> Session | None:
    """Returns the Session for the given token, or None if not found."""
    return _sessions.get(token)


def invalidate_session(token: str) -> None:
    """Removes the session from the in-memory store."""
    _sessions.pop(token, None)
