from django.urls import include, path

from dives.admin import admin_site


urlpatterns = [
    path("admin/", admin_site.urls),
    path("", include("dives.urls")),
]

handler404 = "dives.views.custom_404"
