"""
Auth middleware for Flask routes.

Implements:
  - require_auth decorator: validates Bearer token, returns 401 if missing/invalid
  - require_role(role) decorator: validates session role, returns 403 if mismatch
  Requirements: 1.6, 1.8, 7.5, 7.6
"""

from __future__ import annotations

from functools import wraps

from flask import jsonify, request

from services.auth_service import get_session


def _unauthorized(msg: str = "Authentication required"):
    return jsonify({"status": "error", "data": None, "error": msg}), 401


def _forbidden(msg: str = "Insufficient permissions"):
    return jsonify({"status": "error", "data": None, "error": msg}), 403


def require_auth(f):
    """Decorator that validates the Authorization: Bearer <token> header."""
    @wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get("Authorization", "")
        if not auth_header.startswith("Bearer "):
            return _unauthorized()

        token = auth_header[len("Bearer "):]
        session = get_session(token)
        if session is None:
            return _unauthorized()

        # Attach session to request for downstream use
        request.session = session
        return f(*args, **kwargs)

    return decorated


def require_role(role: str):
    """Decorator factory that checks the session role after require_auth."""
    def decorator(f):
        @wraps(f)
        def decorated(*args, **kwargs):
            session = getattr(request, "session", None)
            if session is None:
                return _unauthorized()
            if session.role != role:
                return _forbidden()
            return f(*args, **kwargs)
        return decorated
    return decorator
