# Testing Guide

## Phase 2 Test Suite

This document describes the comprehensive test suite created for Phase 2 (Backend Core).

## Test Coverage

### Model Tests

#### User Models (`users/tests.py`)
- **User Model**: 8 tests covering user creation, uniqueness constraints, roles, and authentication
- **UserPreference Model**: 6 tests covering preferences, categories, and cascade deletion
- **Device Model**: 6 tests covering device registration, platforms, and multi-device support

#### News Models (`news/tests.py`)
- **Category Model**: 5 tests
- **Source Model**: 5 tests
- **Tag Model**: 4 tests
- **Article Model**: 7 tests including cascade deletion and ordering
- **Like Model**: 4 tests including unique constraints
- **Comment Model**: 4 tests including ordering
- **SavedArticle Model**: 4 tests including ordering

### API Endpoint Tests

#### Authentication API (`users/test_auth_api.py`)
- Registration (6 tests): success, duplicate validation, missing fields, invalid email
- Login (5 tests): success, wrong password, non-existent user, missing fields
- Token Refresh (3 tests): success, invalid token, missing token
- Logout (4 tests): success, unauthenticated, invalid token, missing token

#### User API (`users/test_users_api.py`)
- User Profile (`/users/me`): 6 tests
- User Preferences (`/users/me/preferences`): 6 tests
- Device Management (`/devices/*`): 8 tests

#### News API (`news/test_api.py`)
- Categories: 2 tests
- Sources: 1 test
- Article List: 5 tests (pagination, filtering, ordering, auth state)
- Article Detail: 3 tests
- Article Trending: 1 test
- Article Search: 4 tests
- Likes: 5 tests
- Comments: 10 tests (CRUD operations, permissions)
- Saved Articles: 6 tests

**Total Tests: 100+**

## Running Tests

### Prerequisites

1. Start the required services:
   ```bash
   cd sys/backend
   docker compose up -d db redis
   ```

2. Install test dependencies:
   ```bash
   cd sys/backend/api
   pip install -r requirements.txt
   ```

### Run All Tests

```bash
cd sys/backend/api
pytest
```

### Run Specific Test Files

```bash
# User model tests
pytest users/tests.py

# News model tests
pytest news/tests.py

# Authentication API tests
pytest users/test_auth_api.py

# User API tests
pytest users/test_users_api.py

# News API tests
pytest news/test_api.py
```

### Run Tests with Coverage

```bash
pytest --cov=. --cov-report=html
```

View coverage report:
```bash
open htmlcov/index.html
```

### Run Tests with Verbose Output

```bash
pytest -v
```

### Run Specific Test Classes or Methods

```bash
# Run a specific test class
pytest users/tests.py::TestUserModel

# Run a specific test method
pytest users/tests.py::TestUserModel::test_create_user
```

## Test Configuration

The test suite is configured via `pytest.ini`:

- **Coverage target**: 80%
- **Test discovery**: `tests.py`, `test_*.py`, `*_tests.py`
- **Django settings**: `config.settings`
- **Coverage reports**: HTML and terminal

## Fixtures

Common test fixtures are defined in `conftest.py`:

- `api_client`: REST API client
- `user`: Regular user
- `admin_user`: Admin user
- `user_tokens`: JWT tokens
- `authenticated_client`: Pre-authenticated API client
- `category`: Sample category
- `source`: Sample news source
- `tag`: Sample tag
- `article`: Sample article
- `user_preference`: User preference with categories
- `device`: Device registration

## Test Database

Tests use a separate test database created by Django's test runner. The database is:
- Created before each test run
- Cleaned between tests
- Destroyed after all tests complete

## Continuous Integration

To run tests in CI/CD pipeline:

```yaml
# Example GitHub Actions workflow
- name: Run tests
  run: |
    cd sys/backend
    docker compose up -d db redis
    cd api
    pip install -r requirements.txt
    pytest --cov=. --cov-report=xml
```

## Troubleshooting

### Database Connection Errors

Ensure PostgreSQL is running:
```bash
docker compose ps db
```

### Redis Connection Errors

Ensure Redis is running:
```bash
docker compose ps redis
```

### Import Errors

Ensure you're in the correct directory:
```bash
cd sys/backend/api
```

### Coverage Too Low

The test suite is configured to fail if coverage is below 80%. To see which files need more tests:
```bash
pytest --cov=. --cov-report=term-missing
```

## Phase 2 Completion Status

✅ **2.1 User authentication** - JWT-based auth (register, login, token refresh)
✅ **2.2 News models & API** - CRUD endpoints for news articles
✅ **2.3 Category & filtering** - Category model, filtering/search endpoints
✅ **2.4 User interaction API** - Like, comment, save/bookmark endpoints
✅ **2.5 Unit tests** - 100+ tests with pytest, targeting 80%+ coverage

**Phase 2 is complete!**
