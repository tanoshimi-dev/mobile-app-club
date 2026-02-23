import pytest
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken

from news.models import Article, Category, Source, Tag
from users.models import Device, UserPreference

User = get_user_model()


@pytest.fixture
def api_client():
    """Return an API client for making requests."""
    return APIClient()


@pytest.fixture
def user(db):
    """Create and return a regular user."""
    return User.objects.create_user(
        email="user@example.com",
        username="testuser",
        password="testpass123",
    )


@pytest.fixture
def admin_user(db):
    """Create and return an admin user."""
    return User.objects.create_user(
        email="admin@example.com",
        username="adminuser",
        password="adminpass123",
        role=User.Role.ADMIN,
    )


@pytest.fixture
def user_tokens(user):
    """Generate JWT tokens for a user."""
    refresh = RefreshToken.for_user(user)
    return {
        "refresh": str(refresh),
        "access": str(refresh.access_token),
    }


@pytest.fixture
def authenticated_client(api_client, user_tokens):
    """Return an authenticated API client."""
    api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {user_tokens['access']}")
    return api_client


@pytest.fixture
def category(db):
    """Create and return a category."""
    return Category.objects.create(
        name="Android",
        slug="android",
        description="Android development news",
    )


@pytest.fixture
def source(db, category):
    """Create and return a news source."""
    return Source.objects.create(
        name="Android Developers Blog",
        url="https://android-developers.googleblog.com",
        rss_url="https://android-developers.googleblog.com/feeds/posts/default",
        source_type=Source.SourceType.BLOG,
        category=category,
        is_active=True,
    )


@pytest.fixture
def tag(db):
    """Create and return a tag."""
    return Tag.objects.create(
        name="Kotlin",
        slug="kotlin",
    )


@pytest.fixture
def article(db, category, source):
    """Create and return an article."""
    from datetime import datetime, timezone

    return Article.objects.create(
        title="What's New in Android 16",
        summary="Google announced new features",
        content="Full article content here...",
        original_url="https://android-developers.googleblog.com/2026/02/android-16.html",
        thumbnail_url="https://example.com/thumb.jpg",
        category=category,
        source=source,
        published_at=datetime(2026, 2, 24, 12, 0, 0, tzinfo=timezone.utc),
    )


@pytest.fixture
def user_preference(db, user, category):
    """Create and return a user preference."""
    pref = UserPreference.objects.create(
        user=user,
        push_notifications=True,
        email_digest=UserPreference.EmailDigest.WEEKLY,
    )
    pref.preferred_categories.add(category)
    return pref


@pytest.fixture
def device(db, user):
    """Create and return a device."""
    return Device.objects.create(
        user=user,
        token="fcm-device-token-12345",
        platform=Device.Platform.IOS,
    )
