from ipaddress import ip_address

from django.db import DatabaseError
from django.utils.deprecation import MiddlewareMixin

from .models import WebsiteVisit


class AnalyticsMiddleware(MiddlewareMixin):
    def process_response(self, request, response):
        if getattr(request, "_analytics_skipped", False):
            return response

        if request.path.startswith("/admin"):
            return response

        try:
            path = request.path or "/"
            client_ip = request.META.get("REMOTE_ADDR") or None
            user_agent = request.META.get("HTTP_USER_AGENT", "") or ""
            referrer = request.META.get("HTTP_REFERER") or ""
            try:
                ip_address(client_ip) if client_ip else None
            except ValueError:
                client_ip = None

            WebsiteVisit.objects.create(
                path=path,
                ip_address=client_ip,
                user_agent=user_agent,
                referrer=referrer or None,
            )
        except (DatabaseError, Exception):
            # Avoid breaking page rendering if analytics recording fails.
            pass
        return response
