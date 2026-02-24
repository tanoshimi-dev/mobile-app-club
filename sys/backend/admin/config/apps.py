"""
Custom AdminConfig to use our custom admin site as the default.
"""
from django.contrib.admin.apps import AdminConfig


class MobileDevNewsAdminConfig(AdminConfig):
    default_site = "config.admin_site.MobileDevNewsAdminSite"
