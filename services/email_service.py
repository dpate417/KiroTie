"""
Email Service — sends personalized reminder emails via Gmail SMTP.
Credentials loaded from EVENTWISE_EMAIL and EVENTWISE_PASSWORD env vars.
"""
from __future__ import annotations

import os
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

from models.student import EmailResult, StudentScore


def send_email(to_email: str, subject: str, plain_text: str) -> EmailResult:
    """Send a single email. Returns EmailResult with status SENT or FAILED."""
    sender = os.environ.get("EVENTWISE_EMAIL")
    password = os.environ.get("EVENTWISE_PASSWORD")

    if not sender or not password:
        return EmailResult(
            email=to_email, name="",
            status="FAILED",
            reason="Email credentials not configured (EVENTWISE_EMAIL / EVENTWISE_PASSWORD)"
        )

    if not to_email or "@" not in to_email:
        return EmailResult(email=to_email, name="", status="SKIPPED", reason="Invalid email address")

    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = f"EventWise <{sender}>"
        msg["To"] = to_email
        msg.attach(MIMEText(plain_text, "plain"))
        msg.attach(MIMEText(_build_html(subject, plain_text), "html"))

        smtp_host = "smtp.gmail.com"
        smtp_port = 465
        if any(d in sender for d in ("outlook", "hotmail", "live")):
            with smtplib.SMTP("smtp.office365.com", 587) as s:
                s.starttls()
                s.login(sender, password)
                s.sendmail(sender, to_email, msg.as_string())
        else:
            with smtplib.SMTP_SSL(smtp_host, smtp_port) as s:
                s.login(sender, password)
                s.sendmail(sender, to_email, msg.as_string())

        return EmailResult(email=to_email, name="", status="SENT")

    except smtplib.SMTPAuthenticationError:
        return EmailResult(
            email=to_email, name="", status="FAILED",
            reason="Gmail authentication failed — use an App Password"
        )
    except Exception as e:
        return EmailResult(email=to_email, name="", status="FAILED", reason=str(e))


def send_to_selected(scores: list[StudentScore]) -> list[EmailResult]:
    """Send personalized emails to a list of scored students."""
    results = []
    for s in scores:
        if not s.has_valid_email:
            results.append(EmailResult(email=s.email, name=s.name, status="SKIPPED", reason="No valid email"))
            continue
        result = send_email(s.email, s.email_subject, s.email_body)
        result.name = s.name
        results.append(result)
    return results


def _build_html(subject: str, plain_text: str) -> str:
    lines = plain_text.split("\n")
    html_lines = []
    for line in lines:
        if line.startswith("Subject:"):
            continue
        elif not line.strip():
            html_lines.append("<br/>")
        elif line.startswith(("🎯", "⚠️", "📍", "🕐")):
            html_lines.append(
                f'<p style="margin:8px 0;padding:8px 12px;background:#1a1d27;'
                f'border-radius:6px;border-left:3px solid #6366f1">{line}</p>'
            )
        elif line.startswith("— EventWise"):
            html_lines.append(f'<p style="color:#6366f1;font-weight:bold;margin-top:16px">{line}</p>')
        elif "Cancel" in line:
            html_lines.append(f'<p style="color:#9ca3af;font-size:0.85em">{line}</p>')
        else:
            html_lines.append(f"<p style='margin:6px 0'>{line}</p>")

    body = "\n".join(html_lines)
    return f"""<html><body style="font-family:-apple-system,sans-serif;background:#07090f;
        color:#e2e8f0;padding:32px;max-width:600px;margin:0 auto">
      <div style="background:#1a1d27;border:1px solid #2d3148;border-radius:12px;padding:24px">
        <div style="border-bottom:1px solid #2d3148;padding-bottom:16px;margin-bottom:20px">
          <span style="font-size:1.5rem">📊</span>
          <span style="font-size:1.1rem;font-weight:700;color:#fff;margin-left:8px">EventWise</span>
        </div>
        <h2 style="color:#a5b4fc;font-size:1rem;margin-bottom:16px">{subject}</h2>
        {body}
      </div>
      <p style="text-align:center;color:#374151;font-size:0.72rem;margin-top:16px">
        EventWise · Data: USDA ERS 2023 · EPA WARM Model
      </p>
    </body></html>"""
