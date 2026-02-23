Node.js（React Native）development on Windows, Linux, MacOS.
All backend components run in Docker containers (managed via Docker Compose).

## Development Environment

| Component | Environment | Notes |
|---|---|---|
| Backend API (Django) | Docker | `docker-compose` service |
| Backend Admin (Django) | Docker | `docker-compose` service |
| News Crawler (Python) | Docker | `docker-compose` service |
| PostgreSQL | Docker | `docker-compose` service |
| Redis | Docker | `docker-compose` service |
| Mail Server (Mailhog) | Docker | `docker-compose` service |
| Frontend Mobile (React Native) | Host (native) | Requires native SDKs (Android/iOS) |
| Frontend Web (Next.js) | Host (native) | Node.js dev server |

## Component Structure

```
sys/
├── backend/                # URL: backend.mobile-app.club
|   ├── docker-compose.yml  # All backend services orchestration
|   ├── .env.example        # Environment variables template
|   ├── api/                # Django REST API (Dockerized)
|   |   └── Dockerfile
|   └── admin/              # Django Admin panel (Dockerized)
|       └── Dockerfile
└── frontend/               # URL: mobile-app.club
    ├── mobile/             # React Native mobile application (iOS / Android user)
    └── web/                # Next.js web application (Web user)
```
