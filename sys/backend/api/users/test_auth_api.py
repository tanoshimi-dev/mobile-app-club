import pytest
from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken

User = get_user_model()


@pytest.mark.django_db
class TestAuthAPI:
    """Tests for authentication API endpoints."""

    def test_register_success(self, api_client):
        """Test successful user registration."""
        data = {
            "email": "newuser@example.com",
            "username": "newuser",
            "password": "securepass123",
        }
        response = api_client.post("/api/v1/auth/register", data)

        assert response.status_code == status.HTTP_201_CREATED
        assert response.data["email"] == "newuser@example.com"
        assert response.data["username"] == "newuser"
        assert "password" not in response.data
        assert "id" in response.data
        assert "created_at" in response.data

        # Verify user was created in database
        user = User.objects.get(email="newuser@example.com")
        assert user.username == "newuser"
        assert user.check_password("securepass123")

    def test_register_duplicate_email(self, api_client, user):
        """Test registration with duplicate email fails."""
        data = {
            "email": user.email,
            "username": "different",
            "password": "pass123",
        }
        response = api_client.post("/api/v1/auth/register", data)

        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_register_duplicate_username(self, api_client, user):
        """Test registration with duplicate username fails."""
        data = {
            "email": "different@example.com",
            "username": user.username,
            "password": "pass123",
        }
        response = api_client.post("/api/v1/auth/register", data)

        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_register_missing_fields(self, api_client):
        """Test registration with missing required fields."""
        # Missing email
        response = api_client.post(
            "/api/v1/auth/register", {"username": "test", "password": "pass123"}
        )
        assert response.status_code == status.HTTP_400_BAD_REQUEST

        # Missing username
        response = api_client.post(
            "/api/v1/auth/register", {"email": "test@example.com", "password": "pass123"}
        )
        assert response.status_code == status.HTTP_400_BAD_REQUEST

        # Missing password
        response = api_client.post(
            "/api/v1/auth/register", {"email": "test@example.com", "username": "test"}
        )
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_register_invalid_email(self, api_client):
        """Test registration with invalid email format."""
        data = {
            "email": "not-an-email",
            "username": "test",
            "password": "pass123",
        }
        response = api_client.post("/api/v1/auth/register", data)

        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_login_success(self, api_client, user):
        """Test successful login."""
        data = {
            "email": user.email,
            "password": "testpass123",
        }
        response = api_client.post("/api/v1/auth/login", data)

        assert response.status_code == status.HTTP_200_OK
        assert "access" in response.data
        assert "refresh" in response.data
        assert "user" in response.data
        assert response.data["user"]["email"] == user.email
        assert response.data["user"]["username"] == user.username

    def test_login_wrong_password(self, api_client, user):
        """Test login with wrong password."""
        data = {
            "email": user.email,
            "password": "wrongpassword",
        }
        response = api_client.post("/api/v1/auth/login", data)

        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_login_nonexistent_user(self, api_client):
        """Test login with non-existent email."""
        data = {
            "email": "nonexistent@example.com",
            "password": "somepass",
        }
        response = api_client.post("/api/v1/auth/login", data)

        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_login_missing_fields(self, api_client):
        """Test login with missing fields."""
        # Missing password
        response = api_client.post("/api/v1/auth/login", {"email": "test@example.com"})
        assert response.status_code == status.HTTP_400_BAD_REQUEST

        # Missing email
        response = api_client.post("/api/v1/auth/login", {"password": "pass123"})
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_refresh_token_success(self, api_client, user):
        """Test successful token refresh."""
        refresh = RefreshToken.for_user(user)
        data = {"refresh": str(refresh)}

        response = api_client.post("/api/v1/auth/refresh", data)

        assert response.status_code == status.HTTP_200_OK
        assert "access" in response.data
        # Should not return a new refresh token
        assert "refresh" not in response.data

    def test_refresh_token_invalid(self, api_client):
        """Test token refresh with invalid token."""
        data = {"refresh": "invalid-token-string"}
        response = api_client.post("/api/v1/auth/refresh", data)

        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_refresh_token_missing(self, api_client):
        """Test token refresh with missing token."""
        response = api_client.post("/api/v1/auth/refresh", {})

        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_logout_success(self, authenticated_client, user_tokens):
        """Test successful logout."""
        data = {"refresh": user_tokens["refresh"]}
        response = authenticated_client.post("/api/v1/auth/logout", data)

        assert response.status_code == status.HTTP_204_NO_CONTENT

    def test_logout_unauthenticated(self, api_client):
        """Test logout without authentication."""
        data = {"refresh": "some-refresh-token"}
        response = api_client.post("/api/v1/auth/logout", data)

        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_logout_invalid_token(self, authenticated_client):
        """Test logout with invalid refresh token."""
        data = {"refresh": "invalid-token"}
        response = authenticated_client.post("/api/v1/auth/logout", data)

        # Should still return 204 even with invalid token (graceful handling)
        assert response.status_code == status.HTTP_204_NO_CONTENT

    def test_logout_missing_token(self, authenticated_client):
        """Test logout with missing refresh token."""
        response = authenticated_client.post("/api/v1/auth/logout", {})

        # Should handle gracefully
        assert response.status_code in [status.HTTP_204_NO_CONTENT, status.HTTP_400_BAD_REQUEST]
