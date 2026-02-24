from django.contrib import admin

from .models import CrawlLog


@admin.register(CrawlLog)
class CrawlLogAdmin(admin.ModelAdmin):
    list_display = ("source", "status", "articles_found", "started_at", "duration")
    list_filter = ("status", "source", "started_at")
    search_fields = ("source__name", "error_message")
    readonly_fields = ("source", "status", "articles_found", "error_message", "started_at", "finished_at")
    ordering = ("-started_at",)
    date_hierarchy = "started_at"

    def duration(self, obj):
        if obj.started_at and obj.finished_at:
            delta = obj.finished_at - obj.started_at
            return f"{delta.total_seconds():.1f}s"
        return "-"
    duration.short_description = "Duration"

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False
