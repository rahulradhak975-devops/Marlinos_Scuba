from django.contrib import admin
from django.utils import timezone

from .models import Enquiry, WebsiteVisit


class EnquiryAdmin(admin.ModelAdmin):
    list_display = ("name", "email", "phone", "enquiry_type", "package", "preferred_date", "created_at")
    list_filter = ("enquiry_type", "created_at")
    search_fields = ("name", "email", "phone", "message", "package")
    readonly_fields = ("created_at", "updated_at")


class WebsiteVisitAdmin(admin.ModelAdmin):
    list_display = ("path", "ip_address", "created_at")
    list_filter = ("created_at",)
    search_fields = ("path", "ip_address", "user_agent", "referrer")
    readonly_fields = ("created_at",)


class AnalyticsAdminSite(admin.AdminSite):
    site_header = "Marlinos Diventures Admin"
    site_title = "Marlinos Diventures Admin"
    index_title = "Dashboard"
    index_template = "admin/analytics_index.html"

    def index(self, request, extra_context=None):
        extra_context = extra_context or {}
        extra_context.update({
            "enquiry_count": Enquiry.objects.count(),
            "visit_count": WebsiteVisit.objects.count(),
            "today_enquiries": Enquiry.objects.filter(created_at__date=timezone.localdate()).count(),
            "today_visits": WebsiteVisit.objects.filter(created_at__date=timezone.localdate()).count(),
        })
        return super().index(request, extra_context=extra_context)


admin_site = AnalyticsAdminSite(name="admin")
admin_site.register(Enquiry, EnquiryAdmin)
admin_site.register(WebsiteVisit, WebsiteVisitAdmin)

# Make the custom admin site the default one used by the project.
admin.site = admin_site
