import pytest
from django.contrib.auth import get_user_model
from django.db import IntegrityError

from users.models import Device, UserPreference

User = get_user_model()


@pytest.mark.django_db
class TestUserModel:
    """Tests for the User model."""

    def test_create_user(self):
        """Test creating a regular user."""
        user = User.objects.create_user(
            email="test@example.com",
            username="testuser",
            password="testpass123",
        )
        assert user.email == "test@example.com"
        assert user.username == "testuser"
        assert user.role == User.Role.USER
        assert user.check_password("testpass123")
        assert user.is_active
        assert not user.is_staff
        assert not user.is_superuser

    def test_create_superuser(self):
        """Test creating a superuser."""
        admin = User.objects.create_superuser(
            email="admin@example.com",
            username="admin",
            password="adminpass123",
        )
        assert admin.is_superuser
        assert admin.is_staff
        assert admin.is_active

    def test_user_email_unique(self):
        """Test that email must be unique."""
        User.objects.create_user(
            email="test@example.com",
            username="testuser1",
            password="testpass123",
        )
        with pytest.raises(IntegrityError):
            User.objects.create_user(
                email="test@example.com",
                username="testuser2",
                password="testpass123",
            )

    def test_user_username_unique(self):
        """Test that username must be unique."""
        User.objects.create_user(
            email="test1@example.com",
            username="testuser",
            password="testpass123",
        )
        with pytest.raises(IntegrityError):
            User.objects.create_user(
                email="test2@example.com",
                username="testuser",
                password="testpass123",
            )

    def test_user_str_representation(self):
        """Test user string representation."""
        user = User.objects.create_user(
            email="test@example.com",
            username="testuser",
            password="testpass123",
        )
        assert str(user) == "test@example.com"

    def test_user_avatar_url_optional(self):
        """Test that avatar_url is optional."""
        user = User.objects.create_user(
            email="test@example.com",
            username="testuser",
            password="testpass123",
        )
        assert user.avatar_url == ""

    def test_user_role_default(self):
        """Test that role defaults to USER."""
        user = User.objects.create_user(
            email="test@example.com",
            username="testuser",
            password="testpass123",
        )
        assert user.role == User.Role.USER

    def test_user_role_admin(self):
        """Test creating a user with ADMIN role."""
        user = User.objects.create_user(
            email="admin@example.com",
            username="adminuser",
            password="adminpass123",
            role=User.Role.ADMIN,
        )
        assert user.role == User.Role.ADMIN


@pytest.mark.django_db
class TestUserPreferenceModel:
    """Tests for the UserPreference model."""

    def test_create_user_preference(self, user, category):
        """Test creating a user preference."""
        pref = UserPreference.objects.create(
            user=user,
            push_notifications=True,
            email_digest=UserPreference.EmailDigest.DAILY,
        )
        pref.preferred_categories.add(category)

        assert pref.user == user
        assert pref.push_notifications is True
        assert pref.email_digest == UserPreference.EmailDigest.DAILY
        assert category in pref.preferred_categories.all()

    def test_user_preference_defaults(self, user):
        """Test default values for user preference."""
        pref = UserPreference.objects.create(user=user)
        assert pref.push_notifications is True
        assert pref.email_digest == UserPreference.EmailDigest.NONE

    def test_user_preference_one_to_one(self, user):
        """Test that user preference has a one-to-one relationship with user."""
        UserPreference.objects.create(user=user)
        with pytest.raises(IntegrityError):
            UserPreference.objects.create(user=user)

    def test_user_preference_str_representation(self, user):
        """Test user preference string representation."""
        pref = UserPreference.objects.create(user=user)
        assert str(pref) == f"Preferences for {user.email}"

    def test_user_preference_delete_cascade(self, user):
        """Test that user preference is deleted when user is deleted."""
        pref = UserPreference.objects.create(user=user)
        pref_id = pref.id
        user.delete()
        assert not UserPreference.objects.filter(id=pref_id).exists()

    def test_user_preference_multiple_categories(self, user, category):
        """Test that a user can have multiple preferred categories."""
        from news.models import Category

        category2 = Category.objects.create(
            name="iOS",
            slug="ios",
            description="iOS development news",
        )
        pref = UserPreference.objects.create(user=user)
        pref.preferred_categories.add(category, category2)

        assert pref.preferred_categories.count() == 2


@pytest.mark.django_db
class TestDeviceModel:
    """Tests for the Device model."""

    def test_create_device(self, user):
        """Test creating a device."""
        device = Device.objects.create(
            user=user,
            token="fcm-token-12345",
            platform=Device.Platform.IOS,
        )
        assert device.user == user
        assert device.token == "fcm-token-12345"
        assert device.platform == Device.Platform.IOS

    def test_device_token_unique(self, user):
        """Test that device token must be unique."""
        Device.objects.create(
            user=user,
            token="fcm-token-12345",
            platform=Device.Platform.IOS,
        )

        user2 = User.objects.create_user(
            email="user2@example.com",
            username="user2",
            password="pass123",
        )

        with pytest.raises(IntegrityError):
            Device.objects.create(
                user=user2,
                token="fcm-token-12345",
                platform=Device.Platform.ANDROID,
            )

    def test_device_multiple_per_user(self, user):
        """Test that a user can have multiple devices."""
        Device.objects.create(
            user=user,
            token="fcm-token-ios",
            platform=Device.Platform.IOS,
        )
        Device.objects.create(
            user=user,
            token="fcm-token-android",
            platform=Device.Platform.ANDROID,
        )

        assert user.devices.count() == 2

    def test_device_str_representation(self, user):
        """Test device string representation."""
        device = Device.objects.create(
            user=user,
            token="fcm-token-12345",
            platform=Device.Platform.IOS,
        )
        assert str(device) == f"{device.platform} — {user.email}"

    def test_device_delete_cascade(self, user):
        """Test that devices are deleted when user is deleted."""
        device = Device.objects.create(
            user=user,
            token="fcm-token-12345",
            platform=Device.Platform.IOS,
        )
        device_id = device.id
        user.delete()
        assert not Device.objects.filter(id=device_id).exists()

    def test_device_platform_choices(self, user):
        """Test all platform choices."""
        ios_device = Device.objects.create(
            user=user,
            token="fcm-token-ios",
            platform=Device.Platform.IOS,
        )
        android_device = Device.objects.create(
            user=user,
            token="fcm-token-android",
            platform=Device.Platform.ANDROID,
        )
        web_device = Device.objects.create(
            user=user,
            token="fcm-token-web",
            platform=Device.Platform.WEB,
        )

        assert ios_device.platform == "ios"
        assert android_device.platform == "android"
        assert web_device.platform == "web"
