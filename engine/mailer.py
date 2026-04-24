"""
EventWise Mailer
Sends personalized reminder emails to students using Gmail SMTP.
Reads credentials from environment variables — never hardcoded.
"""
import smtplib
import os
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart


def send_reminder_email(to_email: str, subject: str, plain_text: str) -> dict:
    """
    Sends a personalized reminder email via Gmail SMTP.
    Requires EVENTWISE_EMAIL and EVENTWISE_PASSWORD env vars.
    """
    sender = os.environ.get("EVENTWISE_EMAIL")
    password = os.environ.get("EVENTWISE_PASSWORD")

    if not sender or not password:
        return {
            "status": "ERROR",
            "reason": "Email credentials not configured. Set EVENTWISE_EMAIL and EVENTWISE_PASSWORD environment variables."
        }

    if not to_email or "@" not in to_email:
        return {
            "status": "ERROR",
            "reason": "Invalid recipient email address."
        }

    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = f"EventWise <{sender}>"
        msg["To"] = to_email

        # Plain text part
        msg.attach(MIMEText(plain_text, "plain"))

        # HTML part — styled version of the same email
        html_body = _build_html(subject, plain_text)
        msg.attach(MIMEText(html_body, "html"))

        with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
            server.login(sender, password)
            server.sendmail(sender, to_email, msg.as_string())

        return {
            "status": "SENT",
            "to": to_email,
            "subject": subject,
            "message": f"Email successfully sent to {to_email}"
        }

    except smtplib.SMTPAuthenticationError:
        return {
            "status": "ERROR",
            "reason": "Gmail authentication failed. Make sure you're using an App Password, not your regular Gmail password."
        }
    except smtplib.SMTPException as e:
        return {
            "status": "ERROR",
            "reason": f"SMTP error: {str(e)}"
        }
    except Exception as e:
        return {
            "status": "ERROR",
            "reason": f"Unexpected error: {str(e)}"
        }


def _build_html(subject: str, plain_text: str) -> str:
    """Convert plain text email to styled HTML."""
    lines = plain_text.split("\n")
    html_lines = []
    for line in lines:
        if line.startswith("Subject:"):
            continue
        elif line.strip() == "":
            html_lines.append("<br/>")
        elif line.startswith("📅") or line.startswith("🎯") or line.startswith("📍") or line.startswith("⚠️"):
            html_lines.append(f'<p style="margin:8px 0;padding:8px 12px;background:#1a1d27;border-radius:6px;border-left:3px solid #6366f1">{line}</p>')
        elif line.startswith("— EventWise"):
            html_lines.append(f'<p style="color:#6366f1;font-weight:bold;margin-top:16px">{line}</p>')
        elif "Cancel" in line:
            html_lines.append(f'<p style="color:#9ca3af;font-size:0.85em;margin-top:8px">{line}</p>')
        else:
            html_lines.append(f"<p style='margin:6px 0'>{line}</p>")

    body = "\n".join(html_lines)
    return f"""
    <html><body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;
        background:#07090f;color:#e2e8f0;padding:32px;max-width:600px;margin:0 auto">
      <div style="background:#1a1d27;border:1px solid #2d3148;border-radius:12px;padding:24px">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:20px;
            border-bottom:1px solid #2d3148;padding-bottom:16px">
          <span style="font-size:1.5rem">📊</span>
          <span style="font-size:1.1rem;font-weight:700;color:#fff">EventWise</span>
          <span style="font-size:0.75rem;color:#6b7280;background:#0f1117;
              padding:2px 8px;border-radius:20px">by KiroTie</span>
        </div>
        <h2 style="color:#a5b4fc;font-size:1rem;margin-bottom:16px">{subject}</h2>
        {body}
      </div>
      <p style="text-align:center;color:#374151;font-size:0.72rem;margin-top:16px">
        EventWise · Kiro Spark Challenge 2025 · Data: USDA ERS 2023 · EPA WARM Model
      </p>
    </body></html>
    """
