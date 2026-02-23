# Mobile Dev News - Development Plan

## 1. Project Overview

**Project Name:** Mobile Dev News
**Goal:** Build a mobile application that aggregates mobile development news from various sources and delivers it to developers in a user-friendly format.

**Key Features:**
- News crawling and aggregation from official blogs, Reddit, etc.
- Categorization and filtering (Android, iOS, Cross-platform)
- User interaction (like, share, comment, save, personalized recommendations)
- Push notifications for real-time updates

---

## 2. Technology Stack

| Layer | Technology | URL |
|---|---|---|
| Backend API | Python / Django (REST API) | backend.mobile-app.club |
| Backend Admin | Python / Django (Admin panel) | backend.mobile-app.club |
| Frontend Mobile | React Native + Redux (iOS / Android) | — |
| Frontend Web | React (Web user) | mobile-app.club |
| Database | PostgreSQL (Docker) | — |
| Cache | Redis (Docker) | — |
| Mail | Mail server (Docker) | — |
| Crawling | Python (Scrapy / BeautifulSoup) | — |
| Push Notifications | Firebase Cloud Messaging | — |
| CI/CD | GitHub Actions | — |
| Containerization | Docker / Docker Compose | — |

**Development Environment:**
- Host OS: Windows / Linux / MacOS
- Native tools: Python, Node.js (React Native)
- Dockerized services: PostgreSQL, Redis, Mail server

---

## 3. Repository Structure (Planned)

```
mobile-app-club/
├── doc/                          # Documentation
│   ├── spec.md                   # System specification
│   ├── dev-infra.md              # Infrastructure notes
│   ├── development-plan.md       # This file
│   └── api-design.md             # API specification (to be created)
├── sys/
│   ├── backend/                  # URL: backend.mobile-app.club
│   │   ├── api/                  # Django REST API server
│   │   │   ├── config/           # Django project settings
│   │   │   ├── apps/
│   │   │   │   ├── news/         # News models, views, serializers
│   │   │   │   ├── users/        # User management
│   │   │   │   └── crawler/      # Crawling & aggregation logic
│   │   │   ├── requirements.txt
│   │   │   └── manage.py
│   │   └── admin/                # Django admin panel
│   │       ├── config/
│   │       ├── requirements.txt
│   │       └── manage.py
│   └── frontend/                 # URL: mobile-app.club
│       ├── mobile/               # React Native app (iOS / Android user)
│       │   ├── src/
│       │   │   ├── components/
│       │   │   ├── screens/
│       │   │   ├── store/        # Redux state management
│       │   │   ├── services/     # API client
│       │   │   └── navigation/
│       │   └── package.json
│       └── web/                  # React web app (Web user)
│           ├── src/
│           └── package.json
```

---

## 4. Development Phases

### Phase 1: Foundation (Week 1-2)

**Goal:** Set up development environment and project scaffolding.

| # | Task | Detail |
|---|---|---|
| 1.1 | Docker environment setup | Create `docker-compose.yml` with PostgreSQL, Redis, Mailhog |
| 1.2 | Backend API project setup | Initialize Django project in `sys/backend/api/` with DRF |
| 1.3 | Backend Admin project setup | Initialize Django project in `sys/backend/admin/` |
| 1.4 | Frontend Mobile project setup | Initialize React Native project in `sys/frontend/mobile/` |
| 1.5 | Frontend Web project setup | Initialize React project in `sys/frontend/web/` |
| 1.6 | Database schema design | Design models for News, Category, Source, User |
| 1.7 | API specification | Define REST API endpoints in `doc/api-design.md` |

**Deliverable:** Running dev environment, empty app shells for all 4 components, API spec document.

---

### Phase 2: Backend Core (Week 3-4)

**Goal:** Build the backend API and data models.

| # | Task | Detail |
|---|---|---|
| 2.1 | User authentication | JWT-based auth (register, login, token refresh) |
| 2.2 | News models & API | CRUD endpoints for news articles |
| 2.3 | Category & filtering | Category model, filtering/search endpoints |
| 2.4 | User interaction API | Like, comment, save/bookmark endpoints |
| 2.5 | Unit tests | Write tests for models and API endpoints using pytest |

**Deliverable:** Fully functional REST API with authentication.

---

### Phase 3: News Crawler (Week 5-6)

**Goal:** Build the crawling and aggregation system.

| # | Task | Detail |
|---|---|---|
| 3.1 | Crawler framework | Set up Scrapy or custom crawlers |
| 3.2 | Official blog crawlers | Android Developers Blog, iOS Dev Blog, React Native Blog, Flutter Blog |
| 3.3 | Reddit crawler | r/androiddev, r/iOSProgramming via Reddit API |
| 3.4 | Scheduling | Django management command + cron / Celery Beat for periodic crawling |
| 3.5 | Deduplication & categorization | Auto-categorize articles, detect duplicates |

**Deliverable:** Automated news collection pipeline running on schedule.

---

### Phase 4: Frontend — Mobile App (Week 7-9)

**Goal:** Build the React Native mobile application (`sys/frontend/mobile/`).

| # | Task | Detail |
|---|---|---|
| 4.1 | Navigation setup | Tab navigation (Home, Categories, Saved, Profile) |
| 4.2 | News feed screen | Infinite scroll list, pull-to-refresh |
| 4.3 | Article detail screen | Full article view, like/comment/share actions |
| 4.4 | Category screen | Browse by category, filter/search |
| 4.5 | User auth screens | Login, register, profile |
| 4.6 | Saved articles | Bookmark list, offline reading |
| 4.7 | Push notifications | Firebase Cloud Messaging integration |
| 4.8 | Responsive design | Tablet and various screen size support |

**Deliverable:** Feature-complete mobile app connected to backend API.

---

### Phase 5: Frontend — Web App (Week 10-11)

**Goal:** Build the web application for browser users (`sys/frontend/web/`).

| # | Task | Detail |
|---|---|---|
| 5.1 | User auth pages | Login, register, profile |
| 5.2 | News feed page | Article list with infinite scroll, search |
| 5.3 | Article detail page | Full article view, like/comment/share |
| 5.4 | Category browsing | Browse and filter by category |
| 5.5 | Saved articles | Bookmark list |
| 5.6 | Responsive layout | Desktop and mobile browser support |

**Deliverable:** Feature-complete web app at `mobile-app.club`.

---

### Phase 6: Backend — Admin Panel (Week 12)

**Goal:** Build admin panel for content and operations management (`sys/backend/admin/`).

| # | Task | Detail |
|---|---|---|
| 6.1 | Admin authentication | Admin login with role-based access |
| 6.2 | News source management | Add/edit/remove crawl sources |
| 6.3 | Article management | Review, edit, delete articles |
| 6.4 | User management | View users, manage accounts |
| 6.5 | Dashboard | Stats overview (users, articles, sources) |

**Deliverable:** Working admin panel at `backend.mobile-app.club`.

---

### Phase 7: Testing & Optimization (Week 13-14)

**Goal:** Ensure quality, performance, and security.

| # | Task | Detail |
|---|---|---|
| 7.1 | Backend API testing | pytest, coverage > 80% |
| 7.2 | Frontend Mobile testing | Jest + React Native Testing Library |
| 7.3 | Frontend Web testing | Jest + React Testing Library |
| 7.4 | E2E testing | Detox or Appium for mobile, Playwright for web |
| 7.5 | Performance tuning | DB indexing, query optimization, caching strategy |
| 7.6 | Security audit | HTTPS, data encryption, dependency audit, OWASP check |

**Deliverable:** Test suite passing, performance benchmarks met.

---

### Phase 8: Deployment & Release (Week 15-16)

**Goal:** Deploy to production and publish to app stores.

| # | Task | Detail |
|---|---|---|
| 8.1 | CI/CD pipeline | GitHub Actions for test, build, deploy |
| 8.2 | Backend deployment | Deploy API + Admin to `backend.mobile-app.club` |
| 8.3 | Web deployment | Deploy web app to `mobile-app.club` |
| 8.4 | iOS release | TestFlight beta, App Store submission |
| 8.5 | Android release | Internal testing, Google Play Store submission |
| 8.6 | Monitoring | Error tracking (Sentry), uptime monitoring |

**Deliverable:** All services live — backend, web, and mobile apps on both stores.

---

## 5. Development Priorities

```
HIGH   ██████████  Backend API + Auth (Phase 2)
HIGH   ██████████  News Crawler (Phase 3)
HIGH   ██████████  Frontend Mobile App (Phase 4)
HIGH   ██████████  Frontend Web App (Phase 5)
MEDIUM ███████     Backend Admin Panel (Phase 6)
MEDIUM ███████     Push Notifications (Phase 4.7)
LOW    ████        Personalized Recommendations (Post-launch)
```

---

## 6. Immediate Next Steps

1. **Create `docker-compose.yml`** in `sys/` — PostgreSQL, Redis, Mailhog
2. **Initialize Django API project** in `sys/backend/api/`
3. **Initialize Django Admin project** in `sys/backend/admin/`
4. **Initialize React Native project** in `sys/frontend/mobile/`
5. **Initialize React project** in `sys/frontend/web/`
6. **Design database schema** and document in `doc/`
7. **Define API endpoints** in `doc/api-design.md`

---

## 7. Risks & Mitigations

| Risk | Mitigation |
|---|---|
| Crawl targets change HTML structure | Use RSS feeds where available; implement alerting for failed crawls |
| Reddit API rate limits | Respect rate limits, cache responses, use official API with auth |
| App store rejection | Follow platform guidelines from day one, plan review cycles |
| Scope creep | Stick to MVP features per phase, defer enhancements to post-launch |

---

*Document created: 2026-02-23*
*Status: Draft — Ready for review*
