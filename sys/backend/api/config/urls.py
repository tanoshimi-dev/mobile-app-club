from django.contrib import admin
from django.urls import include, path

from config.health import health_check, health_check_detail

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/v1/auth/", include("users.urls.auth")),
    path("api/v1/users/", include("users.urls.users")),
    path("api/v1/", include("news.urls")),
    # Health checks
    path("api/v1/health/", health_check, name="health-check"),
    path("api/v1/health/detail/", health_check_detail, name="health-check-detail"),
]
