"""System email service — sends transactional emails (verification, password reset, etc.)"""
from __future__ import annotations

import structlog
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

import aiosmtplib

from app.config import settings

log = structlog.get_logger()


async def send_system_email(to_email: str, subject: str, html: str, text: str) -> bool:
    """
    Send a system email via SMTP.
    Returns True on success, False on failure.
    If SYSTEM_EMAIL_HOST is not configured, prints the link to console (dev mode).
    """
    if not settings.system_email_host or not settings.system_email_username:
        log.warning(
            "system_email_not_configured",
            hint="Set SYSTEM_EMAIL_HOST, SYSTEM_EMAIL_USERNAME, SYSTEM_EMAIL_PASSWORD in .env",
        )
        # Dev fallback: print to console so developers can still test
        log.info("dev_email_fallback", to=to_email, subject=subject, body=text)
        return False

    msg = MIMEMultipart("alternative")
    msg["From"] = settings.system_email_from
    msg["To"] = to_email
    msg["Subject"] = subject
    msg.attach(MIMEText(text, "plain", "utf-8"))
    msg.attach(MIMEText(html, "html", "utf-8"))

    try:
        await aiosmtplib.send(
            msg,
            hostname=settings.system_email_host,
            port=settings.system_email_port,
            username=settings.system_email_username,
            password=settings.system_email_password,
            start_tls=True,
        )
        return True
    except Exception as e:
        log.error("system_email_send_failed", to=to_email, error=str(e))
        return False


async def send_verification_email(to_email: str, full_name: str, token: str) -> bool:
    verify_url = f"{settings.frontend_url}/verify-email?token={token}"
    name = full_name or to_email.split("@")[0]

    html = f"""
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
</head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="520" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.08);">
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#6366f1,#8b5cf6);padding:32px 40px;text-align:center;">
              <div style="width:48px;height:48px;background:rgba(255,255,255,0.2);border-radius:12px;display:inline-flex;align-items:center;justify-content:center;margin-bottom:16px;">
                <span style="color:#ffffff;font-size:24px;font-weight:700;line-height:48px;display:block;">R</span>
              </div>
              <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;">Verify your email</h1>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:40px;">
              <p style="margin:0 0 16px;color:#334155;font-size:16px;">Hi {name},</p>
              <p style="margin:0 0 24px;color:#64748b;font-size:15px;line-height:1.6;">
                Thanks for signing up for ResolvAI! Click the button below to verify your email address and activate your account.
              </p>
              <div style="text-align:center;margin:32px 0;">
                <a href="{verify_url}"
                   style="display:inline-block;background:#6366f1;color:#ffffff;text-decoration:none;font-size:15px;font-weight:600;padding:14px 32px;border-radius:10px;">
                  Verify Email Address
                </a>
              </div>
              <p style="margin:0 0 8px;color:#94a3b8;font-size:13px;text-align:center;">
                This link expires in 24 hours.
              </p>
              <p style="margin:0;color:#94a3b8;font-size:12px;text-align:center;">
                If you didn't create a ResolvAI account, you can safely ignore this email.
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="border-top:1px solid #f1f5f9;padding:24px 40px;text-align:center;">
              <p style="margin:0;color:#cbd5e1;font-size:12px;">
                Or copy this link: <a href="{verify_url}" style="color:#6366f1;word-break:break-all;">{verify_url}</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
"""

    text = f"""Hi {name},

Verify your ResolvAI email address by visiting:
{verify_url}

This link expires in 24 hours.

If you didn't create a ResolvAI account, ignore this email.
"""

    return await send_system_email(to_email, "Verify your ResolvAI email", html, text)
