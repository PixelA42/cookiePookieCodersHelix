import smtplib
from email.message import EmailMessage

from app.core.config import get_settings


def send_otp_email(recipient_email: str, otp_code: str, org_name: str) -> None:
    settings = get_settings()

    message = EmailMessage()
    message["Subject"] = "HeatREco verification code"
    message["From"] = settings.smtp_from_email
    message["To"] = recipient_email
    message.set_content(
        (
            f"Hello {org_name},\n\n"
            f"Your HeatREco verification code is: {otp_code}\n"
            f"It expires in {settings.otp_expire_minutes} minutes.\n\n"
            "If you did not request this, you can ignore this email."
        )
    )

    with smtplib.SMTP(settings.smtp_host, settings.smtp_port, timeout=15) as server:
        if settings.smtp_use_tls:
            server.starttls()
        server.login(settings.smtp_username, settings.smtp_password)
        server.send_message(message)
