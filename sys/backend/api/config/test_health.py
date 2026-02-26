import pytest
from unittest.mock import patch, MagicMock

from rest_framework import status


HEALTH_URL = "/api/v1/health/"
HEALTH_DETAIL_URL = "/api/v1/health/detail/"


@pytest.mark.django_db
class TestHealthCheck:
    """Tests for the basic health check endpoint."""

    def test_health_check_returns_ok(self, api_client):
        """Basic health check should return 200 with status ok."""
        response = api_client.get(HEALTH_URL)

        assert response.status_code == status.HTTP_200_OK
        assert response.data["status"] == "ok"

    def test_health_check_no_auth_required(self, api_client):
        """Health check should be accessible without authentication."""
        response = api_client.get(HEALTH_URL)

        assert response.status_code == status.HTTP_200_OK

    def test_health_check_only_get_allowed(self, api_client):
        """Health check should reject non-GET methods."""
        assert api_client.post(HEALTH_URL).status_code == status.HTTP_405_METHOD_NOT_ALLOWED
        assert api_client.put(HEALTH_URL).status_code == status.HTTP_405_METHOD_NOT_ALLOWED
        assert api_client.delete(HEALTH_URL).status_code == status.HTTP_405_METHOD_NOT_ALLOWED


@pytest.mark.django_db
class TestHealthCheckDetail:
    """Tests for the detailed health check endpoint."""

    def test_detail_returns_all_checks(self, api_client):
        """Detailed health check should include database, redis, and celery checks."""
        response = api_client.get(HEALTH_DETAIL_URL)

        assert "checks" in response.data
        assert "database" in response.data["checks"]
        assert "redis" in response.data["checks"]
        assert "celery" in response.data["checks"]

    def test_detail_no_auth_required(self, api_client):
        """Detailed health check should be accessible without authentication."""
        response = api_client.get(HEALTH_DETAIL_URL)

        assert response.status_code in (status.HTTP_200_OK, status.HTTP_503_SERVICE_UNAVAILABLE)

    def test_detail_database_ok(self, api_client):
        """Database check should return ok when DB is connected (test DB is running)."""
        response = api_client.get(HEALTH_DETAIL_URL)

        db_check = response.data["checks"]["database"]
        assert db_check["status"] == "ok"
        assert "latency_ms" in db_check

    def test_detail_redis_ok_when_available(self, api_client):
        """Redis check should return ok when Redis is available."""
        response = api_client.get(HEALTH_DETAIL_URL)

        redis_check = response.data["checks"]["redis"]
        # Redis may or may not be running in test env
        assert redis_check["status"] in ("ok", "error")

    def test_detail_celery_check_present(self, api_client):
        """Celery check should return a status (workers may not be running in test)."""
        response = api_client.get(HEALTH_DETAIL_URL)

        celery_check = response.data["checks"]["celery"]
        assert celery_check["status"] in ("ok", "warning", "error")

    @patch("config.health._check_database")
    @patch("config.health._check_redis")
    @patch("config.health._check_celery")
    def test_detail_all_ok(self, mock_celery, mock_redis, mock_db, api_client):
        """Should return 200 with status ok when all services are healthy."""
        mock_db.return_value = {"status": "ok", "latency_ms": 1.0}
        mock_redis.return_value = {"status": "ok", "latency_ms": 0.5}
        mock_celery.return_value = {"status": "ok", "workers": ["celery@worker"], "latency_ms": 100.0}

        response = api_client.get(HEALTH_DETAIL_URL)

        assert response.status_code == status.HTTP_200_OK
        assert response.data["status"] == "ok"

    @patch("config.health._check_database")
    @patch("config.health._check_redis")
    @patch("config.health._check_celery")
    def test_detail_db_error_returns_503(self, mock_celery, mock_redis, mock_db, api_client):
        """Should return 503 when database is down."""
        mock_db.return_value = {"status": "error", "detail": "connection refused"}
        mock_redis.return_value = {"status": "ok", "latency_ms": 0.5}
        mock_celery.return_value = {"status": "ok", "workers": ["celery@worker"], "latency_ms": 100.0}

        response = api_client.get(HEALTH_DETAIL_URL)

        assert response.status_code == status.HTTP_503_SERVICE_UNAVAILABLE
        assert response.data["status"] == "error"

    @patch("config.health._check_database")
    @patch("config.health._check_redis")
    @patch("config.health._check_celery")
    def test_detail_redis_error_returns_503(self, mock_celery, mock_redis, mock_db, api_client):
        """Should return 503 when Redis is down."""
        mock_db.return_value = {"status": "ok", "latency_ms": 1.0}
        mock_redis.return_value = {"status": "error", "detail": "connection refused"}
        mock_celery.return_value = {"status": "ok", "workers": ["celery@worker"], "latency_ms": 100.0}

        response = api_client.get(HEALTH_DETAIL_URL)

        assert response.status_code == status.HTTP_503_SERVICE_UNAVAILABLE
        assert response.data["status"] == "error"

    @patch("config.health._check_database")
    @patch("config.health._check_redis")
    @patch("config.health._check_celery")
    def test_detail_celery_warning_returns_200(self, mock_celery, mock_redis, mock_db, api_client):
        """Should return 200 with warning when Celery has no workers (non-critical)."""
        mock_db.return_value = {"status": "ok", "latency_ms": 1.0}
        mock_redis.return_value = {"status": "ok", "latency_ms": 0.5}
        mock_celery.return_value = {"status": "warning", "detail": "no workers responding"}

        response = api_client.get(HEALTH_DETAIL_URL)

        assert response.status_code == status.HTTP_200_OK
        assert response.data["status"] == "warning"

    @patch("config.health._check_database")
    @patch("config.health._check_redis")
    @patch("config.health._check_celery")
    def test_detail_all_down_returns_503(self, mock_celery, mock_redis, mock_db, api_client):
        """Should return 503 when all services are down."""
        mock_db.return_value = {"status": "error", "detail": "connection refused"}
        mock_redis.return_value = {"status": "error", "detail": "connection refused"}
        mock_celery.return_value = {"status": "error", "detail": "connection refused"}

        response = api_client.get(HEALTH_DETAIL_URL)

        assert response.status_code == status.HTTP_503_SERVICE_UNAVAILABLE
        assert response.data["status"] == "error"

    @patch("config.health._check_database")
    @patch("config.health._check_redis")
    @patch("config.health._check_celery")
    def test_detail_error_takes_precedence_over_warning(self, mock_celery, mock_redis, mock_db, api_client):
        """Error status should take precedence over warning in overall status."""
        mock_db.return_value = {"status": "ok", "latency_ms": 1.0}
        mock_redis.return_value = {"status": "error", "detail": "connection refused"}
        mock_celery.return_value = {"status": "warning", "detail": "no workers responding"}

        response = api_client.get(HEALTH_DETAIL_URL)

        assert response.status_code == status.HTTP_503_SERVICE_UNAVAILABLE
        assert response.data["status"] == "error"


class TestCheckDatabase:
    """Tests for the _check_database helper."""

    @pytest.mark.django_db
    def test_returns_ok_with_latency(self):
        """Should return ok with latency when DB is accessible."""
        from config.health import _check_database

        result = _check_database()

        assert result["status"] == "ok"
        assert "latency_ms" in result
        assert result["latency_ms"] >= 0

    @patch("config.health.connection")
    def test_returns_error_on_exception(self, mock_connection):
        """Should return error when DB query fails."""
        from config.health import _check_database

        mock_connection.cursor.side_effect = Exception("connection refused")

        result = _check_database()

        assert result["status"] == "error"
        assert "connection refused" in result["detail"]


class TestCheckRedis:
    """Tests for the _check_redis helper."""

    @patch("config.health.cache")
    def test_returns_ok_when_redis_works(self, mock_cache):
        """Should return ok when Redis set/get succeeds."""
        from config.health import _check_redis

        mock_cache.get.return_value = "ok"

        result = _check_redis()

        assert result["status"] == "ok"
        assert "latency_ms" in result
        mock_cache.set.assert_called_once_with("_health_check", "ok", timeout=10)

    @patch("config.health.cache")
    def test_returns_error_on_readback_mismatch(self, mock_cache):
        """Should return error when Redis read-back value doesn't match."""
        from config.health import _check_redis

        mock_cache.get.return_value = "wrong_value"

        result = _check_redis()

        assert result["status"] == "error"
        assert "mismatch" in result["detail"]

    @patch("config.health.cache")
    def test_returns_error_on_exception(self, mock_cache):
        """Should return error when Redis connection fails."""
        from config.health import _check_redis

        mock_cache.set.side_effect = Exception("connection refused")

        result = _check_redis()

        assert result["status"] == "error"
        assert "connection refused" in result["detail"]


class TestCheckCelery:
    """Tests for the _check_celery helper."""

    @patch("config.health.celery_app", create=True)
    @patch("config.celery.app")
    def test_returns_ok_with_workers(self, mock_celery_app, _):
        """Should return ok with worker list when workers are responding."""
        from config.health import _check_celery

        mock_inspect = MagicMock()
        mock_inspect.ping.return_value = {"celery@worker1": {"ok": "pong"}}
        mock_celery_app.control.inspect.return_value = mock_inspect

        result = _check_celery()

        assert result["status"] == "ok"
        assert "celery@worker1" in result["workers"]
        assert "latency_ms" in result

    @patch("config.celery.app")
    def test_returns_warning_when_no_workers(self, mock_celery_app):
        """Should return warning when no workers respond to ping."""
        from config.health import _check_celery

        mock_inspect = MagicMock()
        mock_inspect.ping.return_value = None
        mock_celery_app.control.inspect.return_value = mock_inspect

        result = _check_celery()

        assert result["status"] == "warning"
        assert "no workers" in result["detail"]

    @patch("config.celery.app")
    def test_returns_error_on_exception(self, mock_celery_app):
        """Should return error when Celery broker is unreachable."""
        from config.health import _check_celery

        mock_celery_app.control.inspect.side_effect = Exception("broker unreachable")

        result = _check_celery()

        assert result["status"] == "error"
        assert "broker unreachable" in result["detail"]
