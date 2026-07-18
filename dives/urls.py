from django.urls import path

from . import views


urlpatterns = [
    path("", views.home, name="home"),
    path("index.html", views.home, name="index_html"),
    path("index", views.home, name="index"),
    path("about/", views.about, name="about"),
    path("services/", views.services, name="services"),
    path("services/<slug:slug>/", views.service_detail, name="service_detail"),
    path("gallery/", views.gallery, name="gallery"),
    path("faq/", views.faq, name="faq"),
    path("contact/", views.contact, name="contact"),
    path("experiences/", views.experiences, name="experiences"),
    path("packages/", views.packages, name="packages"),
    path("sites/", views.sites, name="sites"),
    path("stories/", views.stories, name="stories"),
    path("booking/", views.booking, name="booking"),
    path("packages/<slug:package_name>/", views.package_detail, name="package_detail"),
    path("booking-confirmation/", views.booking_confirmation, name="booking_confirmation"),
    path("booking-notification/", views.booking_notification, name="booking_notification"),
    path("webhook/", views.whatsapp_webhook, name="whatsapp_webhook"),
]
