# Mobile Dev News

A mobile development news aggregator that crawls, categorizes, and delivers the latest mobile dev news to developers.

## Tech Stack

| Layer | Technology |
|---|---|
| Backend API | Python / Django REST Framework |
| Backend Admin | Python / Django Admin |
| Frontend Web | Next.js (App Router) |
| Frontend Mobile | React Native (iOS / Android) |
| Database | PostgreSQL |
| Cache / Queue | Redis + Celery |
| Crawling | Python (Scrapy / BeautifulSoup) |

## Project Structure

```
mobile-app-club/
├── doc/                        # Documentation
│   ├── dev-infra.md            # Infrastructure notes
│   ├── development-plan.md     # Development plan
│   └── api-design.md           # API specification
├── memo/                       # Internal notes / runbook
└── sys/
    ├── backend/                # backend.mobile-app.club
    │   ├── docker-compose.yml  # All backend services
    │   ├── .env.example        # Environment variables template
    │   ├── api/                # Django REST API
    │   └── admin/              # Django Admin panel
    └── frontend/               # mobile-app.club
        ├── web/                # Next.js web app
        └── mobile/             # React Native app
```

## Getting Started

### Prerequisites

- Node.js 18+
- Docker & Docker Compose
- Android SDK / Xcode (for mobile development)

### Backend

```bash
cd sys/backend
cp .env.example .env        # configure environment variables
docker compose up -d        # start all backend services
```

Services:
- API: http://localhost:8000
- Admin: http://localhost:8001
- Mailhog: http://localhost:8025

### Frontend Web

```bash
cd sys/frontend/web
npm install
npm run dev                 # http://localhost:3000
```

### Frontend Mobile

```bash
cd sys/frontend/mobile
npm install

# Android
npx react-native run-android

# iOS
bundle install
bundle exec pod install
npx react-native run-ios
```

## Documentation

- [Development Plan](doc/development-plan.md)
- [Infrastructure Notes](doc/dev-infra.md)
