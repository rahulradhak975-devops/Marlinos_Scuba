import logging
import os
from typing import Optional

from django.conf import settings
from django.core.mail import EmailMessage, BadHeaderError

logger = logging.getLogger(__name__)


def send_booking_emails(name: str, email: str, phone: str, package: str, preferred_date: str, form_type: str, message: str = "") -> None:
    """Send customer confirmation and business notification emails for a booking inquiry."""
    business_email = os.getenv("BUSINESS_EMAIL", "meshivadharpr96@gmail.com").strip()
    if not business_email:
        business_email = settings.DEFAULT_FROM_EMAIL or "meshivadharpr96@gmail.com"

    customer_subject = "Booking Request Received – Marlinos Diventures"
    customer_body = f"""Dear {name or 'Customer'},

Thank you for choosing Marlinos Diventures.

We have successfully received your booking request. Our team will review the details and contact you shortly to confirm availability and complete the booking process.

Booking Details:
- Name: {name or 'Not provided'}
- Package: {package or 'Not provided'}
- Preferred Date: {preferred_date or 'Not provided'}
- Contact Number: {phone or 'Not provided'}

Please note that this is an acknowledgement of your request and not a final booking confirmation.

If you have any questions, feel free to reply to this email.

Best regards,
Marlinos Diventures Team
"""

    business_subject = "New Booking Request"
    business_body = f"""Customer Name: {name or 'Not provided'}
Email: {email or 'Not provided'}
Phone: {phone or 'Not provided'}
Package: {package or 'Not provided'}
Preferred Date: {preferred_date or 'Not provided'}
Form Type: {form_type}

Additional Requirements:
{message or 'None'}
"""

    send_mail_with_error_handling(
        to=[email] if email else [],
        subject=customer_subject,
        body=customer_body,
        from_email=settings.DEFAULT_FROM_EMAIL,
    )

    send_mail_with_error_handling(
        to=[business_email],
        subject=business_subject,
        body=business_body,
        from_email=settings.DEFAULT_FROM_EMAIL,
    )


def send_mail_with_error_handling(to: list[str], subject: str, body: str, from_email: Optional[str] = None) -> None:
    """Send email and log failures without interrupting the form submission flow."""
    if not to:
        return

    try:
        email = EmailMessage(
            subject=subject,
            body=body,
            from_email=from_email or settings.DEFAULT_FROM_EMAIL,
            to=to,
        )
        email.send(fail_silently=False)
    except BadHeaderError as exc:
        logger.exception("Invalid email header while sending %s", subject)
    except Exception as exc:  # pragma: no cover - defensive logging path
        logger.exception("Failed to send email %s to %s: %s", subject, to, exc)
