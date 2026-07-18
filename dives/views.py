import json
import logging
import os
import urllib.error
import urllib.parse
import urllib.request
import smtplib
import ssl
from pathlib import Path

try:
    from dotenv import load_dotenv
except ImportError:  # pragma: no cover - fallback for environments without python-dotenv
    def load_dotenv(*args, **kwargs):
        return False

from django.http import JsonResponse
from django.shortcuts import render, redirect
from django.views.decorators.csrf import csrf_exempt
import hmac
import hashlib
from datetime import datetime

from .models import Enquiry


BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / ".env")
logger = logging.getLogger(__name__)
LAST_WHATSAPP_ERROR = None
LAST_WHATSAPP_RESPONSE = None


def home(request):
    return render(request, "dives/home.html")


def custom_404(request, exception=None):
    return redirect("home")


def about(request):
    return render(request, "dives/about.html")


def services(request):
    return render(request, "dives/services.html")


def service_detail(request, slug):
    details = {
        "training": {
            "title": "Training & Certification",
            "eyebrow": "Training",
            "intro": "Structured, modern scuba education designed for comfort, progress, and safety.",
            "image_url": "https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=1200&q=80",
            "headline": "A refined path from first breaths to advanced dive confidence.",
            "body": "Today’s diving education is more flexible and technology-supported than ever. We combine guided practice, digital preparation, and instructor-led coaching to make each certification experience clear, calm, and confidence-building.",
            "highlights": [
                {"title": "Flexible learning", "text": "Pre-course study and clear skill progression help divers prepare with ease before reaching the water."},
                {"title": "Advanced pathways", "text": "From Open Water to specialty courses, every lesson is paced to your experience and goals."},
                {"title": "Modern safety", "text": "Dive computers, updated briefing formats, and detailed debriefs keep training aligned with current industry practice."},
            ],
        },
        "travel": {
            "title": "Travel & Expedition Planning",
            "eyebrow": "Travel",
            "intro": "Luxury-caliber diving travel built around comfort, logistics, and unforgettable destinations.",
            "image_url": "https://images.unsplash.com/photo-1500375592092-40eb2168fd21?auto=format&fit=crop&w=1200&q=80",
            "headline": "Every itinerary is planned with the same care as a premium travel experience.",
            "body": "We organize island transfers, boat schedules, and dive access with precision so the trip feels effortless. Each journey is shaped around marine conditions, comfort, and authentic local experiences.",
            "highlights": [
                {"title": "Seamless logistics", "text": "Transfers, schedules, and local coordination are managed so you can focus on the dive."},
                {"title": "Responsible travel", "text": "We align each itinerary with sustainable practices and marine-conscious choices."},
                {"title": "Destination depth", "text": "From reef-rich islands to premium liveaboards, every route is selected for quality and variety."},
            ],
        },
        "gear": {
            "title": "Premium Gear & Equipment",
            "eyebrow": "Gear",
            "intro": "High-performance scuba gear selected for comfort, reliability, and modern diving needs.",
            "image_url": "/static/dives/Equipment.jpg",
            "headline": "Premium rentals and setups designed around performance and ease.",
            "body": "The latest scuba equipment trends favor lighter builds, smarter systems, and better comfort. We offer modern rental sets and setup support to match current dive standards and the expectations of today’s divers.",
            "highlights": [
                {"title": "Modern configurations", "text": "BCD, regulator, and weighting setups are customized for fit, comfort, and diving style."},
                {"title": "Digital readiness", "text": "Dive computers and nitrox-ready support help you stay aligned with contemporary dive practices."},
                {"title": "Climate-aware gear", "text": "We account for tropical conditions and varying water temperatures to keep you comfortable."},
            ],
        },
        "support": {
            "title": "Safety & Surface Support",
            "eyebrow": "Support",
            "intro": "Attentive, professional support that keeps every dive calm, organised, and secure.",
            "image_url": "https://images.unsplash.com/photo-1519046904884-53103b34b206?auto=format&fit=crop&w=1200&q=80",
            "headline": "Confidence starts with dependable support before and after every descent.",
            "body": "Today’s premium diving experience is built on clear communication and well-prepared operations. Our support team handles briefing clarity, safety readiness, and guest reassurance from arrival to return.",
            "highlights": [
                {"title": "Proactive safety", "text": "Rescue-ready guidance and prepared equipment keep every outing well-supported."},
                {"title": "Guest reassurance", "text": "Clear updates and attentive care help divers feel comfortable and informed throughout the day."},
                {"title": "Seamless coordination", "text": "Boat logistics, weather awareness, and shore support are managed with care and precision."},
            ],
        },
    }

    detail = details.get(slug)
    if not detail:
        return redirect("services")

    return render(request, "dives/service_detail.html", {"slug": slug, **detail})


def gallery(request):
    return render(request, "dives/gallery.html")


def faq(request):
    return render(request, "dives/faq.html")


def contact(request):
    return render(request, "dives/contact.html")


def experiences(request):
    return redirect("/#experiences")


def packages(request):
    return redirect("/#packages")


def sites(request):
    return redirect("/#sites")


def stories(request):
    return redirect("/#testimonials")


def booking(request):
    packages = [
        {"name": "Intro Dive Escape", "description": "A calm first-time introduction to Lakshadweep scuba diving."},
        {"name": "Reef Explorer", "description": "A premium reef-focused island dive experience for certified divers."},
        {"name": "Island Adventure", "description": "An extended diving trip with reef exploration and night dive options."},
    ]

    if request.method == "POST":
        selected_package = (request.POST.get("package") or "").strip()
        if selected_package:
            request.session["selected_package"] = selected_package
            return redirect("booking_confirmation")
        return render(request, "dives/booking.html", {"packages": packages, "error": "Please select a package."})

    return render(request, "dives/booking.html", {"packages": packages})


def package_detail(request, package_name):
    packages = {
        "intro-dive-escape": {
            "name": "Intro Dive Escape",
            "description": "A calm first-time introduction to Lakshadweep scuba diving.",
            "location": "Agatti · Bangaram · Kalpeni",
            "highlights": ["1-day beginner programme", "2 guided dives", "Equipment and instructor support"],
            "price": "5500/- per person",
        },
        "reef-explorer": {
            "name": "Reef Explorer",
            "description": "A premium reef-focused island dive experience for certified divers.",
            "location": "Bangaram · Kadmat · Minicoy",
            "highlights": ["3-day island diving package", "Up to 4 dives daily", "Boat transfers and dive guide included"],
            "price": "12000/- per person",
        },
        "island-adventure": {
            "name": "Island Adventure",
            "description": "An extended diving trip with reef exploration and night dive options.",
            "location": "Agatti · Kadmat · Minicoy",
            "highlights": ["5-day premium itinerary", "Night dive option available", "Stay, transfers, and dive planning included"],
            "price": "18000/- per person",
        },
    }

    package = packages.get(package_name)
    if not package:
        return redirect("home")

    if request.method == "POST":
        email = (request.POST.get("email") or "").strip()
        phone = (request.POST.get("phone") or "").strip()
        alt_phone = (request.POST.get("alt_phone") or "").strip()
        preferred_date = (request.POST.get("preferred_date") or "").strip()
        preferred_time = (request.POST.get("preferred_time") or "").strip()
        requirements = (request.POST.get("requirements") or "").strip()

        if not email and not phone:
            return render(request, "dives/package_detail.html", {"package": package, "error": "Please enter an email address or mobile number."})

        request.session["selected_package"] = package["name"]
        request.session["customer_email"] = email
        request.session["customer_phone"] = phone
        request.session["customer_alt_phone"] = alt_phone
        request.session["preferred_date"] = preferred_date
        request.session["preferred_time"] = preferred_time
        request.session["requirements"] = requirements

        if email:
            confirmation_subject = f"Booking Request Confirmed - {package['name']}"
            confirmation_body = (
                f"Dear Customer,\n\n"
                f"Thank you for submitting your request for {package['name']}. We have received your booking enquiry and our team will contact you shortly.\n\n"
                f"Package: {package['name']}\n"
                f"Location: {package['location']}\n"
                f"Preferred Date: {preferred_date or 'Not provided'}\n"
                f"Preferred Time: {preferred_time or 'Not provided'}\n"
                f"Additional Requirements: {requirements or 'None'}\n\n"
                f"Warm regards,\n"
                f"Marlinos Diventures"
            )
            send_email_fallback(email, confirmation_subject, confirmation_body)

        return redirect("booking_confirmation")

    return render(request, "dives/package_detail.html", {"package": package})


def booking_confirmation(request):
    selected_package = request.session.get("selected_package", "")
    customer_email = request.session.get("customer_email", "")
    return render(request, "dives/booking_confirmation.html", {"selected_package": selected_package, "customer_email": customer_email})


def send_whatsapp_message(to_number, message):
    global LAST_WHATSAPP_ERROR
    global LAST_WHATSAPP_RESPONSE
    LAST_WHATSAPP_ERROR = None
    LAST_WHATSAPP_RESPONSE = None
    load_dotenv(BASE_DIR / ".env", override=False)
    access_token = os.getenv("WHATSAPP_ACCESS_TOKEN", "").strip()
    phone_number_id = os.getenv("WHATSAPP_PHONE_NUMBER_ID", "").strip()

    if not access_token or not phone_number_id:
        return False

    api_url = os.getenv("WHATSAPP_API_URL", "https://graph.facebook.com").rstrip("/")
    api_version = os.getenv("WHATSAPP_API_VERSION", "v18.0")
    endpoint = f"{api_url}/{api_version}/{phone_number_id}/messages"

    payloads = [{
        "messaging_product": "whatsapp",
        "to": to_number,
        "type": "text",
        "text": {"body": message},
    }]

    template_name = os.getenv("WHATSAPP_TEMPLATE_NAME", "").strip()
    template_language = os.getenv("WHATSAPP_TEMPLATE_LANGUAGE", "en").strip()
    if template_name:
        payloads.append({
            "messaging_product": "whatsapp",
            "to": to_number,
            "type": "template",
            "template": {
                "name": template_name,
                "language": {"code": template_language or "en"},
                "components": [
                    {"type": "body", "parameters": [{"type": "text", "text": message}]}
                ],
            },
        })

    last_error = None
    for payload in payloads:
        request = urllib.request.Request(
            endpoint,
            data=json.dumps(payload).encode("utf-8"),
            headers={
                "Authorization": f"Bearer {access_token}",
                "Content-Type": "application/json",
            },
            method="POST",
        )

        try:
            with urllib.request.urlopen(request, timeout=15) as response:
                body = response.read().decode("utf-8", errors="ignore")
                LAST_WHATSAPP_RESPONSE = body
                if response.status < 400:
                    return True
                last_error = f"HTTP {response.status}: {body}"
        except urllib.error.HTTPError as exc:
            try:
                err_body = exc.read().decode("utf-8", errors="ignore")
                LAST_WHATSAPP_RESPONSE = err_body
                last_error = err_body or str(exc)
            except Exception:
                last_error = str(exc)
        except Exception as exc:
            last_error = str(exc)

    if last_error:
        LAST_WHATSAPP_ERROR = last_error
        logger.error("WhatsApp send failed: %s", last_error)
    return False


def send_email_fallback(to_email, subject, body):
    """Try to send an email using SMTP env vars; if not configured, append to a local log file.

    Returns True if the notification was recorded/sent, False otherwise.
    """
    host = os.getenv("EMAIL_HOST", "").strip()
    port = int(os.getenv("EMAIL_PORT", "0") or 0)
    user = os.getenv("EMAIL_HOST_USER", "").strip()
    password = os.getenv("EMAIL_HOST_PASSWORD", "").strip()
    use_tls = os.getenv("EMAIL_USE_TLS", "false").lower() in ("1", "true", "yes")
    use_ssl = os.getenv("EMAIL_USE_SSL", "false").lower() in ("1", "true", "yes")
    from_addr = os.getenv("DEFAULT_FROM_EMAIL", user or "noreply@example.com")

    message = f"From: {from_addr}\r\nTo: {to_email}\r\nSubject: {subject}\r\n\r\n{body}\r\n"

    if host and port:
        try:
            if use_ssl or port == 465:
                context = ssl.create_default_context()
                with smtplib.SMTP_SSL(host, port, context=context) as server:
                    if user and password:
                        server.login(user, password)
                    server.sendmail(from_addr, [to_email], message)
            else:
                with smtplib.SMTP(host, port, timeout=15) as server:
                    if use_tls or port == 587:
                        server.starttls()
                    if user and password:
                        server.login(user, password)
                    server.sendmail(from_addr, [to_email], message)
            return True
        except Exception as exc:
            logger.error("Email fallback send failed: %s", exc)

    # If SMTP not configured or send failed, write to local log as a durable fallback
    try:
        log_path = BASE_DIR / "owner_notifications.log"
        with open(log_path, "a", encoding="utf-8") as f:
            f.write("----\n")
            f.write(f"To: {to_email}\nSubject: {subject}\n\n{body}\n")
        return True
    except Exception as exc:
        logger.error("Failed to write owner notification log: %s", exc)
        return False


@csrf_exempt
def booking_notification(request):
    if request.method != "POST":
        return JsonResponse({"status": "error", "message": "Method not allowed"}, status=405)

    try:
        payload = json.loads(request.body.decode("utf-8"))
    except json.JSONDecodeError:
        return JsonResponse({"status": "error", "message": "Invalid JSON"}, status=400)

    name = (payload.get("name") or "").strip()
    email = (payload.get("email") or "").strip()
    phone = (payload.get("phone") or "").strip()
    package = (payload.get("package") or "").strip()
    date = (payload.get("date") or "").strip()
    message = (payload.get("message") or "").strip()

    enquiry_type = "booking" if package or date else "contact"
    Enquiry.objects.create(
        name=name,
        email=email,
        phone=phone,
        package=package,
        preferred_date=date,
        message=message,
        enquiry_type=enquiry_type,
    )

    owner_number = os.getenv("OWNER_WHATSAPP_NUMBER", "918891454631")
    owner_message = (
        f"New dive booking request\n"
        f"Name: {name}\n"
        f"Email: {email}\n"
        f"Phone: {phone}\n"
        f"Package: {package}\n"
        f"Preferred Date: {date}\n"
        f"Additional Requirements: {message}"
    )

    encoded_message = urllib.parse.quote(owner_message)
    notify_url = f"https://wa.me/{owner_number}?text={encoded_message}"
    api_sent = send_whatsapp_message(owner_number, owner_message)

    email_sent = False
    owner_email = os.getenv("OWNER_EMAIL", "meshivadharpr96@gmail.com")
    if not api_sent:
        subject = f"New booking request from {name or 'Guest'}"
        email_sent = send_email_fallback(owner_email, subject, owner_message)

    return JsonResponse({
        "status": "ok",
        "owner_url": notify_url,
        "sent_via_api": api_sent,
        "email_fallback": email_sent,
        "message": "Booking notification sent successfully" if api_sent else ("Email fallback sent" if email_sent else "Prepared for WhatsApp fallback, email fallback failed"),
        "meta_error": LAST_WHATSAPP_ERROR,
        "meta_response": LAST_WHATSAPP_RESPONSE,
    })



@csrf_exempt
def whatsapp_webhook(request):
    """Receive WhatsApp Cloud API webhook callbacks.

    - GET: verification handshake using hub.mode, hub.challenge, hub.verify_token
    - POST: accept JSON payload, optionally validate signature, log payload to file, and return 200
    """
    # Verification handshake
    if request.method == "GET":
        mode = request.GET.get("hub.mode") or request.GET.get("mode")
        challenge = request.GET.get("hub.challenge") or request.GET.get("challenge")
        verify_token = request.GET.get("hub.verify_token") or request.GET.get("verify_token")
        expected = os.getenv("WHATSAPP_VERIFY_TOKEN", "").strip()
        if mode and challenge and verify_token:
            if verify_token == expected:
                return JsonResponse(int(challenge), safe=False, status=200)
            return JsonResponse({"error": "verify_token_mismatch"}, status=403)

        return JsonResponse({"status": "ok"})

    # POST: webhook payload
    if request.method != "POST":
        return JsonResponse({"status": "error", "message": "Method not allowed"}, status=405)

    raw = request.body or b""
    sig_header = request.META.get("HTTP_X_HUB_SIGNATURE_256") or request.META.get("HTTP_X_HUB_SIGNATURE")
    app_secret = os.getenv("WHATSAPP_APP_SECRET", "").strip()

    # Validate signature if present and secret configured
    if sig_header and app_secret:
        try:
            if sig_header.startswith("sha256="):
                signature = sig_header.split("=", 1)[1]
                mac = hmac.new(app_secret.encode("utf-8"), msg=raw, digestmod=hashlib.sha256)
                expected_sig = mac.hexdigest()
                if not hmac.compare_digest(expected_sig, signature):
                    logger.warning("Webhook signature mismatch")
                    return JsonResponse({"error": "invalid_signature"}, status=403)
        except Exception:
            logger.exception("Failed to validate webhook signature")
            return JsonResponse({"error": "signature_validation_error"}, status=400)

    try:
        payload = json.loads(raw.decode("utf-8")) if raw else {}
    except Exception:
        return JsonResponse({"error": "invalid_json"}, status=400)

    # Log the webhook payload for inspection
    try:
        log_path = BASE_DIR / "whatsapp_webhooks.log"
        with open(log_path, "a", encoding="utf-8") as f:
            f.write("---\n")
            f.write(f"{datetime.utcnow().isoformat()}Z\n")
            f.write(json.dumps(payload, ensure_ascii=False))
            f.write("\n")
    except Exception:
        logger.exception("Failed to write webhook log")

    # Optionally, if this is a messages notification, extract text and forward to owner email
    try:
        entries = payload.get("entry", []) or payload.get("entries", [])
        for entry in entries:
            changes = entry.get("changes", [])
            for change in changes:
                value = change.get("value") or {}
                messages = value.get("messages") or []
                for msg in messages:
                    sender = msg.get("from") or msg.get("wa_id") or "unknown"
                    mtype = msg.get("type")
                    body = None
                    if mtype == "text":
                        body = msg.get("text", {}).get("body")
                    elif mtype == "button":
                        body = msg.get("button", {}).get("text")
                    if body:
                        owner_email = os.getenv("OWNER_EMAIL", "meshivadharpr96@gmail.com")
                        subject = f"Incoming WhatsApp message from {sender}"
                        send_email_fallback(owner_email, subject, body)
    except Exception:
        logger.exception("Error processing webhook payload for forwarding")

    return JsonResponse({"status": "received"})
