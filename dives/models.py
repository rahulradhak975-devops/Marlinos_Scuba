from django.db import models


class Enquiry(models.Model):
    ENQUIRY_TYPES = [
        ("booking", "Booking"),
        ("contact", "Contact"),
        ("other", "Other"),
    ]

    name = models.CharField(max_length=255, blank=True)
    email = models.EmailField(blank=True)
    phone = models.CharField(max_length=30, blank=True)
    package = models.CharField(max_length=255, blank=True)
    preferred_date = models.CharField(max_length=100, blank=True)
    message = models.TextField(blank=True)
    enquiry_type = models.CharField(max_length=20, choices=ENQUIRY_TYPES, default="contact")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return self.name or self.email or self.get_enquiry_type_display()


class WebsiteVisit(models.Model):
    path = models.CharField(max_length=500)
    ip_address = models.GenericIPAddressField(blank=True, null=True)
    user_agent = models.TextField(blank=True)
    referrer = models.URLField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return self.path
