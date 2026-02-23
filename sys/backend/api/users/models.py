from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    class Role(models.TextChoices):
        USER = "user"
        ADMIN = "admin"

    email = models.EmailField(unique=True)
    avatar_url = models.URLField(max_length=500, blank=True)
    role = models.CharField(max_length=20, choices=Role.choices, default=Role.USER)

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["username"]

    def __str__(self):
        return self.email


class UserPreference(models.Model):
    class EmailDigest(models.TextChoices):
        NONE = "none"
        DAILY = "daily"
        WEEKLY = "weekly"

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="preference")
    push_notifications = models.BooleanField(default=True)
    email_digest = models.CharField(
        max_length=20, choices=EmailDigest.choices, default=EmailDigest.NONE
    )
    preferred_categories = models.ManyToManyField(
        "news.Category", blank=True, related_name="preferred_by"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Preferences for {self.user.email}"


class Device(models.Model):
    class Platform(models.TextChoices):
        IOS = "ios"
        ANDROID = "android"
        WEB = "web"

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="devices")
    token = models.CharField(max_length=500, unique=True)
    platform = models.CharField(max_length=10, choices=Platform.choices)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.platform} — {self.user.email}"
