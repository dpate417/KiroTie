from dataclasses import dataclass


@dataclass
class Session:
    token: str
    email: str
    role: str  # "organizer" | "student"
