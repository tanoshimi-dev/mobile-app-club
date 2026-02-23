@echo off
REM Script to run the test suite for Phase 2 on Windows

echo 🧪 Mobile Dev News - Phase 2 Test Suite
echo ========================================
echo.

REM Check if we're in the right directory
if not exist pytest.ini (
    echo ❌ Error: Please run this script from sys\backend\api directory
    exit /b 1
)

REM Check if Docker services are running
echo 📦 Checking Docker services...
cd ..
docker compose ps db redis >nul 2>&1
if errorlevel 1 (
    echo ⚠️  Docker services not running. Starting db and redis...
    docker compose up -d db redis
    echo ⏳ Waiting for services to be ready...
    timeout /t 5 /nobreak >nul
)
cd api

echo ✅ Docker services are ready
echo.

REM Run tests
echo 🏃 Running test suite...
echo.

if "%1"=="coverage" (
    echo 📊 Running tests with coverage report...
    pytest --cov=. --cov-report=html --cov-report=term
    echo.
    echo 📈 Coverage report generated in htmlcov\index.html
) else if "%1"=="verbose" (
    echo 📝 Running tests in verbose mode...
    pytest -v
) else if "%1"=="quick" (
    echo ⚡ Running quick test (no coverage^)...
    pytest -p no:warnings --tb=short
) else (
    pytest
)

echo.
echo ✨ Test suite complete!
