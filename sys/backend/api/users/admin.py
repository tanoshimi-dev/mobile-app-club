from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin

from .models import User, UserPreference, Device


class UserPreferenceInline(admin.StackedInline):
    model = UserPreference
    can_delete = False
    verbose_name_plural = "Preferences"
    filter_horizontal = ("preferred_categories",)


class DeviceInline(admin.TabularInline):
    model = Device
    extra = 0
    readonly_fields = ("token", "platform", "created_at")


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ("email", "username", "role", "is_active", "is_staff", "date_joined")
    list_filter = ("role", "is_active", "is_staff", "date_joined")
    search_fields = ("email", "username")
    ordering = ("-date_joined",)
    readonly_fields = ("date_joined", "last_login")

    fieldsets = (
        (None, {"fields": ("email", "password")}),
        ("Personal Info", {"fields": ("username", "avatar_url")}),
        ("Role & Permissions", {"fields": ("role", "is_active", "is_staff", "is_superuser")}),
        ("Important Dates", {"fields": ("date_joined", "last_login")}),
    )

    add_fieldsets = (
        (None, {
            "classes": ("wide",),
            "fields": ("email", "username", "password1", "password2", "role"),
        }),
    )

    inlines = [UserPreferenceInline, DeviceInline]

    def get_queryset(self, request):
        return super().get_queryset(request).prefetch_related("preference", "devices")


@admin.register(UserPreference)
class UserPreferenceAdmin(admin.ModelAdmin):
    list_display = ("user", "push_notifications", "email_digest", "updated_at")
    list_filter = ("push_notifications", "email_digest")
    search_fields = ("user__email", "user__username")
    filter_horizontal = ("preferred_categories",)
    readonly_fields = ("created_at", "updated_at")


@admin.register(Device)
class DeviceAdmin(admin.ModelAdmin):
    list_display = ("user", "platform", "created_at")
    list_filter = ("platform",)
    search_fields = ("user__email", "token")
    readonly_fields = ("created_at",)
