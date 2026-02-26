import logging
import time

from django.db import connection
from django.core.cache import cache
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

logger = logging.getLogger(__name__)


def _check_database():
    try:
        start = time.monotonic()
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
        latency_ms = round((time.monotonic() - start) * 1000, 1)
        return {"status": "ok", "latency_ms": latency_ms}
    except Exception as e:
        logger.error("Database health check failed: %s", e)
        return {"status": "error", "detail": str(e)}


def _check_redis():
    try:
        start = time.monotonic()
        cache.set("_health_check", "ok", timeout=10)
        value = cache.get("_health_check")
        latency_ms = round((time.monotonic() - start) * 1000, 1)
        if value != "ok":
            return {"status": "error", "detail": "read-back mismatch"}
        return {"status": "ok", "latency_ms": latency_ms}
    except Exception as e:
        logger.error("Redis health check failed: %s", e)
        return {"status": "error", "detail": str(e)}


def _check_celery():
    try:
        from config.celery import app as celery_app

        start = time.monotonic()
        inspect = celery_app.control.inspect(timeout=3)
        ping = inspect.ping()
        latency_ms = round((time.monotonic() - start) * 1000, 1)
        if ping:
            workers = list(ping.keys())
            return {"status": "ok", "workers": workers, "latency_ms": latency_ms}
        return {"status": "warning", "detail": "no workers responding"}
    except Exception as e:
        logger.error("Celery health check failed: %s", e)
        return {"status": "error", "detail": str(e)}


@api_view(["GET"])
@permission_classes([AllowAny])
def health_check(request):
    """Basic health check — verifies the API process is alive."""
    return Response({"status": "ok"})


@api_view(["GET"])
@permission_classes([AllowAny])
def health_check_detail(request):
    """Detailed health check — verifies DB, Redis, and Celery."""
    checks = {
        "database": _check_database(),
        "redis": _check_redis(),
        "celery": _check_celery(),
    }

    overall = "ok"
    for name, result in checks.items():
        if result["status"] == "error":
            overall = "error"
            break
        if result["status"] == "warning":
            overall = "warning"

    status_code = 200 if overall != "error" else 503

    logger.info(
        "Health check: overall=%s db=%s redis=%s celery=%s",
        overall,
        checks["database"]["status"],
        checks["redis"]["status"],
        checks["celery"]["status"],
    )

    return Response({"status": overall, "checks": checks}, status=status_code)
