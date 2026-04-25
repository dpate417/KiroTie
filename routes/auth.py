"""
Flask routes for authentication endpoints.

Implements:
  - POST /api/auth/login   (17.1) Requirements 1.1, 1.2, 1.3, 7.1, 7.7
  - POST /api/auth/logout  (17.1) Requirements 1.7, 7.7
"""

from __future__ import annotations

from flask import Blueprint, jsonify, request

from services.auth_service import (
    assign_role,
    create_session,
    get_session,
    invalidate_session,
    validate_email,
)

auth_bp = Blueprint("auth", __name__)


def _ok(data) -> tuple:
    return jsonify({"status": "ok", "data": data, "error": None}), 200


def _error(msg: str, code: int) -> tuple:
    return jsonify({"status": "error", "data": None, "error": msg}), code


# ---------------------------------------------------------------------------
# POST /api/auth/login
# ---------------------------------------------------------------------------

@auth_bp.route("/auth/login", methods=["POST"])
def login():
    """Validate ASU email, create session, return token and role."""
    body = request.get_json(silent=True) or {}
    email = body.get("email", "")

    if not validate_email(email):
        return _error("ASU email required", 400)

    role = assign_role(email)
    token = create_session(email, role)

    return _ok({"token": token, "role": role})


# ---------------------------------------------------------------------------
# POST /api/auth/logout
# ---------------------------------------------------------------------------

@auth_bp.route("/auth/logout", methods=["POST"])
def logout():
    """Invalidate the session token."""
    # Try Authorization header first, then request body
    auth_header = request.headers.get("Authorization", "")
    if auth_header.startswith("Bearer "):
        token = auth_header[len("Bearer "):]
    else:
        body = request.get_json(silent=True) or {}
        token = body.get("token", "")

    if token:
        invalidate_session(token)

    return _ok(None)
