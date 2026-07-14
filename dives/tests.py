import json
from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.test import SimpleTestCase, TestCase
from django.urls import reverse

from dives.models import Enquiry, WebsiteVisit
from dives.views import send_whatsapp_message


class HomePageTests(TestCase):
    def test_home_page_renders(self):
        response = self.client.get(reverse("home"))

        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "Marlinos Diventures")
        self.assertContains(response, '<form id="bookingForm">')

    def test_index_html_page_renders(self):
        response = self.client.get("/index.html")

        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "Marlinos Diventures")

    def test_unknown_routes_redirect_to_home(self):
        response = self.client.get("/this-page-does-not-exist/")

        self.assertEqual(response.status_code, 302)
        self.assertEqual(response.url, "/")

    def test_section_pages_render(self):
        pages = [
            "experiences",
            "packages",
            "sites",
            "stories",
            "booking",
        ]

        for page in pages:
            with self.subTest(page=page):
                response = self.client.get(reverse(page))

                self.assertEqual(response.status_code, 302)
                self.assertIn("/", response.url)

    def test_booking_notification_endpoint_accepts_payload(self):
        response = self.client.post(
            reverse("booking_notification"),
            data=json.dumps({
                "name": "Asha",
                "email": "asha@example.com",
                "phone": "8891454631",
                "package": "Discovery",
                "date": "2026-07-10",
                "message": "Need equipment",
            }),
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 200)
        self.assertIn("owner_url", response.json())
        self.assertIn("https://wa.me/918891454631", response.json()["owner_url"])

    @patch("dives.views.send_whatsapp_message", return_value=True)
    def test_booking_notification_uses_api_when_available(self, mock_send):
        response = self.client.post(
            reverse("booking_notification"),
            data=json.dumps({
                "name": "Asha",
                "email": "asha@example.com",
                "phone": "8891454631",
                "package": "Discovery",
                "date": "2026-07-10",
                "message": "Need equipment",
            }),
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.json()["sent_via_api"])
        mock_send.assert_called_once()

    @patch("dives.views.urllib.request.urlopen")
    @patch.dict("os.environ", {"WHATSAPP_ACCESS_TOKEN": "token", "WHATSAPP_PHONE_NUMBER_ID": "123", "WHATSAPP_TEMPLATE_NAME": "booking_notification", "WHATSAPP_TEMPLATE_LANGUAGE": "en"}, clear=False)
    def test_send_whatsapp_message_retries_with_template_when_needed(self, mock_urlopen):
        class FakeResponse:
            def __init__(self, status, body=b"{}"):
                self.status = status
                self._body = body

            def read(self):
                return self._body

            def __enter__(self):
                return self

            def __exit__(self, exc_type, exc, tb):
                return False

        mock_urlopen.side_effect = [FakeResponse(400, b'{"error":"bad"}'), FakeResponse(200, b'{"messages":[{"id":"mid"}]}')]

        result = send_whatsapp_message("918891454631", "Hello")

        self.assertTrue(result)
        self.assertEqual(mock_urlopen.call_count, 2)


class AnalyticsDashboardTests(TestCase):
    def setUp(self):
        self.user = get_user_model().objects.create_superuser("admin", "admin@example.com", "password123")
        self.client.force_login(self.user)

    def test_booking_notification_creates_enquiry_record(self):
        self.client.post(
            reverse("booking_notification"),
            data=json.dumps({
                "name": "Asha",
                "email": "asha@example.com",
                "phone": "8891454631",
                "package": "Discovery",
                "date": "2026-07-10",
                "message": "Need equipment",
            }),
            content_type="application/json",
        )

        self.assertEqual(Enquiry.objects.count(), 1)
        enquiry = Enquiry.objects.get()
        self.assertEqual(enquiry.enquiry_type, "booking")
        self.assertEqual(enquiry.email, "asha@example.com")

    def test_home_page_visit_is_recorded(self):
        self.client.get(reverse("home"))

        self.assertEqual(WebsiteVisit.objects.count(), 1)
        self.assertEqual(WebsiteVisit.objects.get().path, "/")

    def test_admin_dashboard_shows_summary_counts(self):
        Enquiry.objects.create(name="Asha", email="asha@example.com", enquiry_type="booking")
        WebsiteVisit.objects.create(path="/", user_agent="Mozilla/5.0")

        response = self.client.get(reverse("admin:index"))

        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "Enquiries")
        self.assertContains(response, "Website visits")
        self.assertContains(response, "1")
