#!/bin/bash
# Script to run the test suite for Phase 2

set -e

echo "🧪 Mobile Dev News - Phase 2 Test Suite"
echo "========================================"
echo ""

# Check if we're in the right directory
if [ ! -f "pytest.ini" ]; then
    echo "❌ Error: Please run this script from sys/backend/api directory"
    exit 1
fi

# Check if Docker services are running
echo "📦 Checking Docker services..."
cd .. && docker compose ps db redis > /dev/null 2>&1
if [ $? -ne 0 ]; then
    echo "⚠️  Docker services not running. Starting db and redis..."
    docker compose up -d db redis
    echo "⏳ Waiting for services to be ready..."
    sleep 5
fi
cd api

echo "✅ Docker services are ready"
echo ""

# Run tests
echo "🏃 Running test suite..."
echo ""

if [ "$1" == "coverage" ]; then
    echo "📊 Running tests with coverage report..."
    pytest --cov=. --cov-report=html --cov-report=term
    echo ""
    echo "📈 Coverage report generated in htmlcov/index.html"
elif [ "$1" == "verbose" ]; then
    echo "📝 Running tests in verbose mode..."
    pytest -v
elif [ "$1" == "quick" ]; then
    echo "⚡ Running quick test (no coverage)..."
    pytest -p no:warnings --tb=short
else
    pytest
fi

echo ""
echo "✨ Test suite complete!"
