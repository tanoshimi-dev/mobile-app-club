# API Design — Mobile App Club

> Single source of truth for all REST API endpoints consumed by the web and mobile frontends.

## Overview

| Property | Value |
|---|---|
| Base URL | `/api/v1` |
| Content-Type | `application/json` |
| Authentication | JWT via `Authorization: Bearer <access_token>` |
| CORS Origins | `http://localhost:3000` (web), `http://localhost:8081` (mobile) |

### Endpoint Summary

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/auth/register` | No | Create new account |
| POST | `/auth/login` | No | Obtain JWT pair |
| POST | `/auth/refresh` | No | Refresh access token |
| POST | `/auth/logout` | Yes | Blacklist refresh token |
| GET | `/users/me` | Yes | Get current user profile |
| PUT/PATCH | `/users/me` | Yes | Update profile |
| DELETE | `/users/me` | Yes | Delete account |
| GET | `/users/me/preferences` | Yes | Get preferences (auto-created) |
| PUT/PATCH | `/users/me/preferences` | Yes | Update preferences |
| GET | `/categories` | No | List all categories (unpaginated) |
| GET | `/sources` | No | List sources (paginated) |
| GET | `/articles` | No | List articles (paginated, filterable) |
| GET | `/articles/trending` | No | Top 20 articles by likes |
| GET | `/articles/search` | No | Search articles by title |
| GET | `/articles/<id>` | No | Article detail with full content |
| POST | `/articles/<id>/like` | Yes | Like an article |
| DELETE | `/articles/<id>/like` | Yes | Unlike an article |
| GET | `/articles/<id>/comments` | No | List comments for article |
| POST | `/articles/<id>/comments` | Yes | Add comment |
| GET | `/comments/<id>` | Yes | Get own comment |
| PUT/PATCH | `/comments/<id>` | Yes | Update own comment |
| DELETE | `/comments/<id>` | Yes | Delete own comment |
| POST | `/articles/<id>/save` | Yes | Save article |
| DELETE | `/articles/<id>/save` | Yes | Unsave article |
| GET | `/users/me/saved` | Yes | List saved articles (paginated) |
| POST | `/devices/register` | Yes | Register push device |
| DELETE | `/devices/<token>` | Yes | Unregister push device |

---

## Authentication (JWT)

The API uses **SimpleJWT** (`rest_framework_simplejwt`).

| Setting | Value |
|---|---|
| Access token lifetime | 30 minutes |
| Refresh token lifetime | 7 days |
| Header format | `Authorization: Bearer <access_token>` |

All endpoints marked **Auth: Yes** return `401 Unauthorized` when the header is missing or the token is expired.

> **Known issue:** `rest_framework_simplejwt.token_blacklist` is not in `INSTALLED_APPS`. The logout endpoint calls `token.blacklist()` but swallows the resulting exception, so logout always returns `204` but **does not actually invalidate the refresh token**. Add `"rest_framework_simplejwt.token_blacklist"` to `INSTALLED_APPS` and run its migration to fix.

---

## Pagination

Default pagination: `PageNumberPagination` with `PAGE_SIZE = 20`.

Paginated responses use this envelope:

```json
{
  "count": 57,
  "next": "http://localhost:8000/api/v1/articles?page=2",
  "previous": null,
  "results": [ ... ]
}
```

| Query param | Type | Default | Description |
|---|---|---|---|
| `page` | integer | `1` | Page number |

**Exceptions:**
- `GET /categories` — returns a plain JSON array (pagination disabled).
- `GET /articles/trending` — returns at most 20 results (queryset slice), still wrapped in the pagination envelope.

---

## Error Responses

Standard DRF error shapes:

**400 Bad Request** (validation)
```json
{
  "field_name": ["This field is required."],
  "non_field_errors": ["..."]
}
```

**401 Unauthorized**
```json
{
  "detail": "Authentication credentials were not provided."
}
```

**403 Forbidden**
```json
{
  "detail": "You do not have permission to perform this action."
}
```

**404 Not Found**
```json
{
  "detail": "Not found."
}
```

---

## Auth Endpoints

### POST `/auth/register`

Create a new user account.

- **Auth:** No
- **View:** `RegisterView` (CreateAPIView)

**Request body:**
```json
{
  "email": "user@example.com",
  "username": "johndoe",
  "password": "securepass123"
}
```

| Field | Type | Constraints |
|---|---|---|
| email | string | Required, unique, valid email |
| username | string | Required, unique |
| password | string | Write-only, min 8 chars, Django password validators |

**201 Created:**
```json
{
  "id": 1,
  "email": "user@example.com",
  "username": "johndoe",
  "created_at": "2025-01-15T10:00:00Z"
}
```

> **Known issue:** The serializer declares `created_at` but `AbstractUser` has `date_joined`, not `created_at`. This will raise an error at runtime. Fix by adding `source="date_joined"` to the field or renaming it to `date_joined`.

**400 Bad Request:** Validation errors (duplicate email, weak password, etc.)

---

### POST `/auth/login`

Obtain a JWT access/refresh pair. Uses SimpleJWT's `TokenObtainPairView`.

- **Auth:** No
- **Login field:** `email` (not `username` — the custom User model sets `USERNAME_FIELD = "email"`)

**Request body:**
```json
{
  "email": "user@example.com",
  "password": "securepass123"
}
```

**200 OK:**
```json
{
  "access": "eyJ...",
  "refresh": "eyJ..."
}
```

> **Note:** The response contains **only tokens**, no user data. Clients must call `GET /users/me` separately to fetch the user profile after login.

**401 Unauthorized:** Invalid credentials.

---

### POST `/auth/refresh`

Refresh an expired access token. Uses SimpleJWT's `TokenRefreshView`.

- **Auth:** No

**Request body:**
```json
{
  "refresh": "eyJ..."
}
```

**200 OK:**
```json
{
  "access": "eyJ..."
}
```

**401 Unauthorized:** Refresh token is invalid or expired.

---

### POST `/auth/logout`

Blacklist a refresh token (see known issue above).

- **Auth:** Yes

**Request body:**
```json
{
  "refresh": "eyJ..."
}
```

**204 No Content:** Always returned (even if blacklisting fails silently).

---

## User Endpoints

### GET `/users/me`

Get the authenticated user's profile.

- **Auth:** Yes
- **View:** `UserMeView` (RetrieveUpdateDestroyAPIView)

**200 OK:**
```json
{
  "id": 1,
  "email": "user@example.com",
  "username": "johndoe",
  "avatar_url": "https://example.com/avatar.jpg",
  "preferred_categories": [1, 3, 5],
  "created_at": "2025-01-15T10:00:00Z"
}
```

| Field | Type | Notes |
|---|---|---|
| id | integer | Read-only |
| email | string | Read-only |
| username | string | Editable |
| avatar_url | string | Editable, may be empty `""` |
| preferred_categories | integer[] | Derived from `UserPreference.preferred_categories` |
| created_at | string (ISO 8601) | Read-only (same `source="date_joined"` issue as register) |

---

### PUT/PATCH `/users/me`

Update the authenticated user's profile.

- **Auth:** Yes

**Request body (PATCH — partial):**
```json
{
  "username": "newname",
  "avatar_url": "https://example.com/new-avatar.jpg"
}
```

**200 OK:** Same shape as `GET /users/me`.

---

### DELETE `/users/me`

Delete the authenticated user's account.

- **Auth:** Yes

**204 No Content.**

---

### GET `/users/me/preferences`

Get the authenticated user's preferences. If no preference record exists, one is **auto-created** with defaults.

- **Auth:** Yes
- **View:** `UserPreferenceView` (RetrieveUpdateAPIView)

**200 OK:**
```json
{
  "preferred_categories": [1, 3],
  "push_notifications": true,
  "email_digest": "none"
}
```

| Field | Type | Default | Options |
|---|---|---|---|
| preferred_categories | integer[] | `[]` | Array of category IDs |
| push_notifications | boolean | `true` | — |
| email_digest | string | `"none"` | `"none"`, `"daily"`, `"weekly"` |

---

### PUT/PATCH `/users/me/preferences`

Update preferences.

- **Auth:** Yes

**Request body (PATCH — partial):**
```json
{
  "push_notifications": false,
  "email_digest": "weekly",
  "preferred_categories": [2, 4]
}
```

**200 OK:** Same shape as `GET /users/me/preferences`.

---

## Categories

### GET `/categories`

List all categories. Returns an **unpaginated** plain JSON array.

- **Auth:** No
- **View:** `CategoryListView` (pagination_class = None)

**200 OK:**
```json
[
  {
    "id": 1,
    "name": "iOS",
    "slug": "ios",
    "article_count": 42
  },
  {
    "id": 2,
    "name": "Android",
    "slug": "android",
    "article_count": 35
  }
]
```

| Field | Type | Notes |
|---|---|---|
| id | integer | — |
| name | string | — |
| slug | string | — |
| article_count | integer | Annotated count of related articles |

---

## Sources

### GET `/sources`

List news sources. Paginated.

- **Auth:** No
- **View:** `SourceListView`

**200 OK:** Paginated envelope with results:
```json
{
  "count": 12,
  "next": null,
  "previous": null,
  "results": [
    {
      "id": 1,
      "name": "Swift Blog",
      "url": "https://swift.org/blog",
      "category": {
        "id": 1,
        "name": "iOS",
        "slug": "ios",
        "article_count": 42
      },
      "article_count": 18
    }
  ]
}
```

| Field | Type | Notes |
|---|---|---|
| id | integer | — |
| name | string | — |
| url | string | Source website URL |
| category | object | Nested `CategorySerializer` |
| article_count | integer | Annotated count of related articles |

---

## Articles

### GET `/articles`

List articles. Paginated, filterable, sortable.

- **Auth:** No (but authenticated users get `is_liked`/`is_saved` annotations)
- **View:** `ArticleListView`

**Query parameters:**

| Param | Type | Default | Description |
|---|---|---|---|
| `page` | integer | `1` | Page number |
| `category` | integer | — | Filter by category ID |
| `source` | integer | — | Filter by source ID |
| `ordering` | string | `-published_at` | Sort order: `-published_at`, `-like_count`, `-comment_count` |

**200 OK:** Paginated envelope with results:
```json
{
  "count": 150,
  "next": "http://localhost:8000/api/v1/articles?page=2",
  "previous": null,
  "results": [
    {
      "id": 1,
      "title": "SwiftUI Navigation in 2025",
      "summary": "A deep dive into NavigationStack...",
      "thumbnail_url": "https://example.com/thumb.jpg",
      "source": {
        "id": 1,
        "name": "Swift Blog",
        "url": "https://swift.org/blog",
        "category": {
          "id": 1,
          "name": "iOS",
          "slug": "ios",
          "article_count": 42
        },
        "article_count": 18
      },
      "category": {
        "id": 1,
        "name": "iOS",
        "slug": "ios",
        "article_count": 42
      },
      "published_at": "2025-06-15T08:30:00Z",
      "like_count": 23,
      "comment_count": 5,
      "is_liked": false,
      "is_saved": true
    }
  ]
}
```

| Field | Type | Notes |
|---|---|---|
| id | integer | — |
| title | string | — |
| summary | string | May be empty |
| thumbnail_url | string | May be empty |
| source | object | Nested `SourceSerializer` |
| category | object | Nested `CategorySerializer` |
| published_at | string (ISO 8601) | — |
| like_count | integer | — |
| comment_count | integer | — |
| is_liked | boolean | `true` if current user liked it; `false` for anonymous |
| is_saved | boolean | `true` if current user saved it; `false` for anonymous |

---

### GET `/articles/trending`

Top articles by like count. Returns at most **20** results (queryset sliced).

- **Auth:** No (authenticated users get `is_liked`/`is_saved` annotations)
- **View:** `ArticleTrendingView`

**200 OK:** Same response shape as `GET /articles` (paginated envelope, article list serializer). Max 20 items.

---

### GET `/articles/search`

Search articles by title (case-insensitive `icontains`).

- **Auth:** No (authenticated users get `is_liked`/`is_saved` annotations)
- **View:** `ArticleSearchView`

**Query parameters:**

| Param | Type | Default | Description |
|---|---|---|---|
| `q` | string | `""` | Search query (matched against title) |
| `category` | integer | — | Filter by category ID |
| `page` | integer | `1` | Page number |

**200 OK:** Same paginated response shape as `GET /articles`.

> **Note:** If `q` is empty/omitted, all articles are returned (no filtering applied).

---

### GET `/articles/<id>`

Get full article detail including content, original URL, and tags.

- **Auth:** No (authenticated users get `is_liked`/`is_saved` annotations)
- **View:** `ArticleDetailView`

**200 OK:**
```json
{
  "id": 1,
  "title": "SwiftUI Navigation in 2025",
  "summary": "A deep dive into NavigationStack...",
  "thumbnail_url": "https://example.com/thumb.jpg",
  "source": { "id": 1, "name": "Swift Blog", "url": "...", "category": { ... }, "article_count": 18 },
  "category": { "id": 1, "name": "iOS", "slug": "ios", "article_count": 42 },
  "published_at": "2025-06-15T08:30:00Z",
  "like_count": 23,
  "comment_count": 5,
  "is_liked": false,
  "is_saved": false,
  "content": "<p>Full article HTML content...</p>",
  "original_url": "https://swift.org/blog/swiftui-navigation",
  "tags": [
    { "name": "SwiftUI", "slug": "swiftui" },
    { "name": "Navigation", "slug": "navigation" }
  ]
}
```

Additional fields compared to list serializer:

| Field | Type | Notes |
|---|---|---|
| content | string | Full article body, may be empty |
| original_url | string | Link to original source |
| tags | object[] | Array of `{ name, slug }` |

**404 Not Found:** Article does not exist.

---

## Likes

### POST `/articles/<id>/like`

Like an article.

- **Auth:** Yes
- **View:** `LikeView`

**Request body:** None.

**201 Created** (new like):
```json
{
  "article_id": 1,
  "like_count": 24
}
```

**200 OK** (already liked — idempotent):
```json
{
  "article_id": 1,
  "like_count": 23
}
```

**404 Not Found:** Article does not exist.

---

### DELETE `/articles/<id>/like`

Unlike an article.

- **Auth:** Yes

**204 No Content.** Returned even if no like existed (idempotent).

---

## Comments

### GET `/articles/<id>/comments`

List comments for an article. Paginated. Ordered by `created_at` ascending.

- **Auth:** No
- **View:** `CommentListCreateView`

**200 OK:** Paginated envelope with results:
```json
{
  "count": 3,
  "next": null,
  "previous": null,
  "results": [
    {
      "id": 1,
      "user": {
        "id": 5,
        "username": "johndoe",
        "avatar_url": "https://example.com/avatar.jpg"
      },
      "body": "Great article!",
      "created_at": "2025-06-16T12:00:00Z",
      "updated_at": "2025-06-16T12:00:00Z"
    }
  ]
}
```

| Field | Type | Notes |
|---|---|---|
| id | integer | Read-only |
| user | object | `{ id, username, avatar_url }` — via `SerializerMethodField` |
| body | string | Comment text |
| created_at | string (ISO 8601) | Read-only |
| updated_at | string (ISO 8601) | Read-only |

---

### POST `/articles/<id>/comments`

Add a comment to an article. Increments `article.comment_count`.

- **Auth:** Yes

**Request body:**
```json
{
  "body": "Great article!"
}
```

**201 Created:**
```json
{
  "id": 4,
  "user": {
    "id": 5,
    "username": "johndoe",
    "avatar_url": "https://example.com/avatar.jpg"
  },
  "body": "Great article!",
  "created_at": "2025-06-16T14:30:00Z",
  "updated_at": "2025-06-16T14:30:00Z"
}
```

**404 Not Found:** Article does not exist.

---

### GET `/comments/<id>`

Get a single comment. **Owner-only** — the queryset is filtered to `user=request.user`, so only the comment author can retrieve it.

- **Auth:** Yes
- **View:** `CommentDetailView` (RetrieveUpdateDestroyAPIView)

**200 OK:** Same comment shape as above.

**404 Not Found:** Comment does not exist or belongs to another user.

---

### PUT/PATCH `/comments/<id>`

Update own comment.

- **Auth:** Yes (owner-only)

**Request body (PATCH — partial):**
```json
{
  "body": "Updated comment text"
}
```

**200 OK:** Updated comment object.

**404 Not Found:** Comment does not exist or belongs to another user.

---

### DELETE `/comments/<id>`

Delete own comment. Decrements `article.comment_count`.

- **Auth:** Yes (owner-only)

**204 No Content.**

**404 Not Found:** Comment does not exist or belongs to another user.

---

## Saved Articles

### POST `/articles/<id>/save`

Save an article to the user's reading list.

- **Auth:** Yes
- **View:** `SaveArticleView`

**Request body:** None.

**201 Created:** Empty body. Idempotent (uses `get_or_create`).

**404 Not Found:** Article does not exist.

---

### DELETE `/articles/<id>/save`

Remove an article from the user's saved list.

- **Auth:** Yes

**204 No Content.** Returned even if the article wasn't saved (idempotent).

---

### GET `/users/me/saved`

List the user's saved articles. Paginated. Articles include `is_liked`/`is_saved` annotations.

- **Auth:** Yes
- **View:** `SavedArticleListView`

**200 OK:** Same paginated response shape as `GET /articles` (article list serializer).

---

## Devices

### POST `/devices/register`

Register a device for push notifications.

- **Auth:** Yes
- **View:** `DeviceRegisterView` (CreateAPIView)

**Request body:**
```json
{
  "token": "fcm-or-apns-device-token",
  "platform": "ios"
}
```

| Field | Type | Constraints |
|---|---|---|
| token | string | Required, unique (max 500 chars) |
| platform | string | Required, one of: `"ios"`, `"android"`, `"web"` |

**201 Created:**
```json
{
  "id": 1,
  "token": "fcm-or-apns-device-token",
  "platform": "ios"
}
```

---

### DELETE `/devices/<token>`

Unregister a device. Lookup by token string. Owner-only (queryset filtered to current user).

- **Auth:** Yes
- **View:** `DeviceDeleteView` (DestroyAPIView, `lookup_field = "token"`)

**204 No Content.**

**404 Not Found:** Device not found or belongs to another user.

---

## Appendix A: Data Models Reference

### `users.User` (extends `AbstractUser`)

| Field | Type | Constraints |
|---|---|---|
| id | BigAutoField | PK |
| email | EmailField | Unique, used as `USERNAME_FIELD` |
| username | CharField | Unique (inherited) |
| password | CharField | Hashed (inherited) |
| avatar_url | URLField(500) | Blank allowed |
| role | CharField(20) | Choices: `user`, `admin`; default `user` |
| date_joined | DateTimeField | Auto (inherited from AbstractUser) |
| is_active | BooleanField | Default `True` (inherited) |

### `users.UserPreference`

| Field | Type | Constraints |
|---|---|---|
| id | BigAutoField | PK |
| user | OneToOneField → User | Cascade delete |
| push_notifications | BooleanField | Default `True` |
| email_digest | CharField(20) | Choices: `none`, `daily`, `weekly`; default `none` |
| preferred_categories | M2M → Category | Blank allowed |
| created_at | DateTimeField | Auto |
| updated_at | DateTimeField | Auto |

### `users.Device`

| Field | Type | Constraints |
|---|---|---|
| id | BigAutoField | PK |
| user | ForeignKey → User | Cascade delete |
| token | CharField(500) | Unique |
| platform | CharField(10) | Choices: `ios`, `android`, `web` |
| created_at | DateTimeField | Auto |

### `news.Category`

| Field | Type | Constraints |
|---|---|---|
| id | BigAutoField | PK |
| name | CharField(100) | Unique |
| slug | SlugField(100) | Unique |
| description | TextField | Blank allowed |
| created_at | DateTimeField | Auto |
| updated_at | DateTimeField | Auto |

### `news.Source`

| Field | Type | Constraints |
|---|---|---|
| id | BigAutoField | PK |
| name | CharField(200) | — |
| url | URLField(500) | Unique |
| rss_url | URLField(500) | Blank allowed |
| source_type | CharField(20) | Choices: `blog`, `reddit`, `forum` |
| category | ForeignKey → Category | Cascade delete |
| is_active | BooleanField | Default `True` |
| last_crawled_at | DateTimeField | Nullable |
| created_at | DateTimeField | Auto |
| updated_at | DateTimeField | Auto |

### `news.Tag`

| Field | Type | Constraints |
|---|---|---|
| id | BigAutoField | PK |
| name | CharField(100) | Unique |
| slug | SlugField(100) | Unique |

### `news.Article`

| Field | Type | Constraints |
|---|---|---|
| id | BigAutoField | PK |
| title | CharField(500) | — |
| summary | TextField | Blank allowed |
| content | TextField | Blank allowed |
| original_url | URLField(500) | Unique |
| thumbnail_url | URLField(500) | Blank allowed |
| category | ForeignKey → Category | Cascade delete |
| source | ForeignKey → Source | Cascade delete |
| tags | M2M → Tag | Blank allowed |
| published_at | DateTimeField | — |
| like_count | IntegerField | Default `0` |
| comment_count | IntegerField | Default `0` |
| created_at | DateTimeField | Auto |
| updated_at | DateTimeField | Auto |

Default ordering: `-published_at`. Indexes on `-published_at` and `-like_count`.

### `news.Like`

| Field | Type | Constraints |
|---|---|---|
| id | BigAutoField | PK |
| user | ForeignKey → User | Cascade delete |
| article | ForeignKey → Article | Cascade delete |
| created_at | DateTimeField | Auto |

Unique constraint: `(user, article)`.

### `news.Comment`

| Field | Type | Constraints |
|---|---|---|
| id | BigAutoField | PK |
| user | ForeignKey → User | Cascade delete |
| article | ForeignKey → Article | Cascade delete |
| body | TextField | — |
| created_at | DateTimeField | Auto |
| updated_at | DateTimeField | Auto |

Default ordering: `created_at` (ascending).

### `news.SavedArticle`

| Field | Type | Constraints |
|---|---|---|
| id | BigAutoField | PK |
| user | ForeignKey → User | Cascade delete |
| article | ForeignKey → Article | Cascade delete |
| created_at | DateTimeField | Auto |

Unique constraint: `(user, article)`. Default ordering: `-created_at`.

### `crawler.CrawlLog`

| Field | Type | Constraints |
|---|---|---|
| id | BigAutoField | PK |
| source | ForeignKey → Source | Cascade delete |
| status | CharField(10) | Choices: `success`, `failed` |
| articles_found | IntegerField | Default `0` |
| error_message | TextField | Blank allowed |
| started_at | DateTimeField | — |
| finished_at | DateTimeField | — |

Default ordering: `-started_at`. Not exposed via API (internal crawler use only).

---

## Appendix B: Frontend Integration Notes

### Auth Flow

1. **Login:** `POST /auth/login` with `{ email, password }` → receive `{ access, refresh }`.
2. **Fetch profile:** `GET /users/me` → receive user object.
3. **Store:** Save `access` and `refresh` in local/secure storage. Store user object in Redux state.
4. **Attach token:** Every subsequent request includes `Authorization: Bearer <access>` header (configured in Axios interceptor).
5. **Token refresh:** When a request returns `401`, use the stored refresh token via `POST /auth/refresh` to get a new access token.
6. **Logout:** `POST /auth/logout` with `{ refresh }`, then clear local state.

### Redux State Shapes

**Auth state** (`authSlice`):
```typescript
interface User {
  id: number;
  email: string;
  username: string;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isLoading: boolean;
}
```

> **Note:** The frontend `User` interface is a subset of the API response — it omits `avatar_url`, `preferred_categories`, and `created_at`. Extend it as needed.

**News state** (`newsSlice`):
```typescript
interface Article {
  id: number;
  title: string;
  summary: string;
  thumbnail_url: string;
  published_at: string;
  like_count: number;
  comment_count: number;
}

interface Category {
  id: number;
  name: string;
  slug: string;
  article_count: number;
}

interface NewsState {
  articles: Article[];
  categories: Category[];
  isLoading: boolean;
}
```

> **Note:** The frontend `Article` interface omits `source`, `category`, `is_liked`, and `is_saved` fields that the API provides. Extend it to match the full API response shape.

### API Client Configuration

Base URL: `http://localhost:8000/api/v1` (configured in `src/services/api.ts`).

The Axios instance automatically attaches the access token from `localStorage` via a request interceptor.
