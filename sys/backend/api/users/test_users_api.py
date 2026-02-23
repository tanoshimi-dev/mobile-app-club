import pytest
from django.contrib.auth import get_user_model
from rest_framework import status

from users.models import Device, UserPreference

User = get_user_model()


@pytest.mark.django_db
class TestUserMeAPI:
    """Tests for /users/me endpoint."""

    def test_get_me_authenticated(self, authenticated_client, user):
        """Test getting current user profile."""
        response = authenticated_client.get("/api/v1/users/me")

        assert response.status_code == status.HTTP_200_OK
        assert response.data["email"] == user.email
        assert response.data["username"] == user.username
        assert "password" not in response.data

    def test_get_me_unauthenticated(self, api_client):
        """Test getting profile without authentication."""
        response = api_client.get("/api/v1/users/me")

        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_update_me_success(self, authenticated_client, user):
        """Test updating current user profile."""
        data = {
            "username": "updatedname",
            "avatar_url": "https://example.com/avatar.jpg",
        }
        response = authenticated_client.patch("/api/v1/users/me", data)

        assert response.status_code == status.HTTP_200_OK
        assert response.data["username"] == "updatedname"
        assert response.data["avatar_url"] == "https://example.com/avatar.jpg"

        user.refresh_from_db()
        assert user.username == "updatedname"

    def test_update_me_duplicate_username(self, authenticated_client, user):
        """Test updating username to an existing username."""
        # Create another user
        User.objects.create_user(
            email="other@example.com",
            username="existinguser",
            password="pass123",
        )

        data = {"username": "existinguser"}
        response = authenticated_client.patch("/api/v1/users/me", data)

        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_update_me_email_not_allowed(self, authenticated_client, user):
        """Test that email cannot be changed via this endpoint."""
        original_email = user.email
        data = {"email": "newemail@example.com"}
        response = authenticated_client.patch("/api/v1/users/me", data)

        user.refresh_from_db()
        # Email should remain unchanged
        assert user.email == original_email

    def test_delete_me_success(self, authenticated_client, user):
        """Test deleting current user account."""
        user_id = user.id
        response = authenticated_client.delete("/api/v1/users/me")

        assert response.status_code == status.HTTP_204_NO_CONTENT
        assert not User.objects.filter(id=user_id).exists()

    def test_delete_me_unauthenticated(self, api_client):
        """Test deleting account without authentication."""
        response = api_client.delete("/api/v1/users/me")

        assert response.status_code == status.HTTP_401_UNAUTHORIZED


@pytest.mark.django_db
class TestUserPreferenceAPI:
    """Tests for /users/me/preferences endpoint."""

    def test_get_preferences_authenticated(self, authenticated_client, user, category):
        """Test getting user preferences."""
        # Create preference
        pref = UserPreference.objects.create(
            user=user,
            push_notifications=True,
            email_digest=UserPreference.EmailDigest.WEEKLY,
        )
        pref.preferred_categories.add(category)

        response = authenticated_client.get("/api/v1/users/me/preferences")

        assert response.status_code == status.HTTP_200_OK
        assert response.data["push_notifications"] is True
        assert response.data["email_digest"] == "weekly"
        assert category.id in response.data["preferred_categories"]

    def test_get_preferences_creates_if_not_exists(self, authenticated_client, user):
        """Test that preferences are created if they don't exist."""
        assert not UserPreference.objects.filter(user=user).exists()

        response = authenticated_client.get("/api/v1/users/me/preferences")

        assert response.status_code == status.HTTP_200_OK
        assert UserPreference.objects.filter(user=user).exists()

    def test_get_preferences_unauthenticated(self, api_client):
        """Test getting preferences without authentication."""
        response = api_client.get("/api/v1/users/me/preferences")

        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_update_preferences_success(self, authenticated_client, user, category):
        """Test updating user preferences."""
        data = {
            "push_notifications": False,
            "email_digest": "daily",
            "preferred_categories": [category.id],
        }
        response = authenticated_client.put("/api/v1/users/me/preferences", data)

        assert response.status_code == status.HTTP_200_OK
        assert response.data["push_notifications"] is False
        assert response.data["email_digest"] == "daily"
        assert category.id in response.data["preferred_categories"]

        pref = UserPreference.objects.get(user=user)
        assert pref.push_notifications is False
        assert pref.email_digest == "daily"
        assert category in pref.preferred_categories.all()

    def test_update_preferences_partial(self, authenticated_client, user):
        """Test partial update of preferences."""
        UserPreference.objects.create(
            user=user,
            push_notifications=True,
            email_digest=UserPreference.EmailDigest.WEEKLY,
        )

        data = {"push_notifications": False}
        response = authenticated_client.patch("/api/v1/users/me/preferences", data)

        assert response.status_code == status.HTTP_200_OK
        assert response.data["push_notifications"] is False
        assert response.data["email_digest"] == "weekly"  # Should remain unchanged

    def test_update_preferences_invalid_digest(self, authenticated_client, user):
        """Test updating with invalid email_digest value."""
        data = {"email_digest": "invalid"}
        response = authenticated_client.patch("/api/v1/users/me/preferences", data)

        assert response.status_code == status.HTTP_400_BAD_REQUEST


@pytest.mark.django_db
class TestDeviceAPI:
    """Tests for device registration endpoints."""

    def test_register_device_success(self, authenticated_client, user):
        """Test registering a new device."""
        data = {
            "token": "fcm-token-12345",
            "platform": "ios",
        }
        response = authenticated_client.post("/api/v1/devices/register", data)

        assert response.status_code == status.HTTP_201_CREATED
        assert response.data["token"] == "fcm-token-12345"
        assert response.data["platform"] == "ios"

        device = Device.objects.get(user=user, token="fcm-token-12345")
        assert device.platform == "ios"

    def test_register_device_unauthenticated(self, api_client):
        """Test registering device without authentication."""
        data = {"token": "fcm-token-12345", "platform": "ios"}
        response = api_client.post("/api/v1/devices/register", data)

        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_register_device_missing_fields(self, authenticated_client):
        """Test registering device with missing fields."""
        # Missing token
        response = authenticated_client.post("/api/v1/devices/register", {"platform": "ios"})
        assert response.status_code == status.HTTP_400_BAD_REQUEST

        # Missing platform
        response = authenticated_client.post(
            "/api/v1/devices/register", {"token": "fcm-token-12345"}
        )
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_register_device_invalid_platform(self, authenticated_client):
        """Test registering device with invalid platform."""
        data = {"token": "fcm-token-12345", "platform": "invalid"}
        response = authenticated_client.post("/api/v1/devices/register", data)

        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_register_device_duplicate_token(self, authenticated_client, user):
        """Test registering a device with duplicate token."""
        Device.objects.create(
            user=user,
            token="fcm-token-12345",
            platform=Device.Platform.IOS,
        )

        data = {"token": "fcm-token-12345", "platform": "android"}
        response = authenticated_client.post("/api/v1/devices/register", data)

        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_delete_device_success(self, authenticated_client, user):
        """Test deleting a device."""
        device = Device.objects.create(
            user=user,
            token="fcm-token-12345",
            platform=Device.Platform.IOS,
        )

        response = authenticated_client.delete("/api/v1/devices/fcm-token-12345")

        assert response.status_code == status.HTTP_204_NO_CONTENT
        assert not Device.objects.filter(id=device.id).exists()

    def test_delete_device_unauthenticated(self, api_client):
        """Test deleting device without authentication."""
        response = api_client.delete("/api/v1/devices/some-token")

        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_delete_device_not_found(self, authenticated_client):
        """Test deleting a non-existent device."""
        response = authenticated_client.delete("/api/v1/devices/nonexistent-token")

        assert response.status_code == status.HTTP_404_NOT_FOUND

    def test_delete_device_other_user(self, api_client, user):
        """Test deleting another user's device."""
        # Create another user and their device
        other_user = User.objects.create_user(
            email="other@example.com",
            username="other",
            password="pass123",
        )
        device = Device.objects.create(
            user=other_user,
            token="fcm-token-other",
            platform=Device.Platform.IOS,
        )

        # Authenticate as the first user
        from rest_framework_simplejwt.tokens import RefreshToken

        refresh = RefreshToken.for_user(user)
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {refresh.access_token}")

        response = api_client.delete(f"/api/v1/devices/{device.token}")

        assert response.status_code == status.HTTP_404_NOT_FOUND
        # Device should still exist
        assert Device.objects.filter(id=device.id).exists()
