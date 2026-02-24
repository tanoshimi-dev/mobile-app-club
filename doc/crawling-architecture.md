# Crawling Architecture

## Overview

The crawling system automatically aggregates mobile development news from **10 sources** (6 RSS blog feeds + 4 Reddit subreddits) on a schedule, processes articles with deduplication and auto-categorization, and stores them in PostgreSQL.

## Project Structure

```
sys/backend/api/
├── config/
│   ├── celery.py              # Celery app initialization
│   └── settings.py            # CELERY_BEAT_SCHEDULE config
│
├── crawler/                   # Core crawling module
│   ├── base.py                # Article dataclass, BaseCrawler ABC, RSSFeedCrawler
│   ├── blog_crawlers.py       # 6 RSS feed crawlers
│   ├── reddit_crawler.py      # 4 Reddit API crawlers
│   ├── service.py             # CrawlerService (processing & storage)
│   ├── tasks.py               # Celery tasks (3 scheduled tasks)
│   ├── models.py              # CrawlLog audit model
│   ├── admin.py               # Django admin interface
│   └── management/commands/
│       └── crawl_news.py      # Django CLI for manual crawling
│
└── news/
    └── models.py              # Category, Source, Article, Tag, Comment, Like, SavedArticle
```

## Data Flow

```
Celery Beat (scheduler)
    │
    ├─ Every 6h ─→ crawl_all_blogs task
    │                ├─ 6 RSS crawlers (feedparser + BeautifulSoup)
    │                └─ CrawlerService.process_articles()
    │
    └─ Every 2h ─→ crawl_all_reddit task
                     ├─ 4 Reddit crawlers (PRAW)
                     └─ CrawlerService.process_articles()
                              │
                              ├─ Deduplication (by original_url unique constraint)
                              ├─ Auto-categorization (keyword scoring)
                              ├─ Tag extraction (max 10 per article)
                              ├─ Source get_or_create
                              └─ Atomic DB write ─→ PostgreSQL
```

## Data Sources

### RSS Blog Feeds (crawled every 6 hours)

| Crawler Class | Source | Feed URL |
|---|---|---|
| `AndroidDevelopersBlogCrawler` | Android Developers Blog | android-developers.googleblog.com/feeds |
| `iOSDeveloperBlogCrawler` | Apple Developer News | developer.apple.com/news/rss |
| `ReactNativeBlogCrawler` | React Native Blog | reactnative.dev/blog/rss.xml |
| `FlutterBlogCrawler` | Flutter Blog | medium.com/feed/flutter |
| `KotlinBlogCrawler` | Kotlin Blog | blog.jetbrains.com/kotlin/feed |
| `SwiftBlogCrawler` | Swift.org Blog | swift.org/blog/rss.xml |

### Reddit Subreddits (crawled every 2 hours)

| Crawler Class | Subreddit | Default Limit |
|---|---|---|
| `AndroidDevRedditCrawler` | r/androiddev | 25 posts |
| `iOSProgrammingRedditCrawler` | r/iOSProgramming | 25 posts |
| `ReactNativeRedditCrawler` | r/reactnative | 25 posts |
| `FlutterDevRedditCrawler` | r/FlutterDev | 25 posts |

## Crawler Layer

### Class Hierarchy

```
BaseCrawler (ABC)                    # base.py:54
├── RSSFeedCrawler                   # base.py:134
│   ├── AndroidDevelopersBlogCrawler # blog_crawlers.py
│   ├── iOSDeveloperBlogCrawler
│   ├── ReactNativeBlogCrawler
│   ├── FlutterBlogCrawler
│   ├── KotlinBlogCrawler
│   └── SwiftBlogCrawler
│
└── RedditCrawler                    # reddit_crawler.py
    ├── AndroidDevRedditCrawler
    ├── iOSProgrammingRedditCrawler
    ├── ReactNativeRedditCrawler
    └── FlutterDevRedditCrawler
```

### `BaseCrawler` (Abstract)

- `crawl() -> List[Article]` — abstract method, each subclass implements
- `_clean_html(html)` — strips scripts/styles via BeautifulSoup, collapses whitespace
- `_parse_datetime(date_string)` — flexible date parsing via `python-dateutil`, ensures timezone-aware
- `_truncate_text(text, max_length=500)` — word-boundary-aware truncation

### `Article` Data Class (base.py:15)

In-memory representation of a crawled article before DB persistence:

| Field | Type | Notes |
|---|---|---|
| `title` | str | Required |
| `url` | str | Required, used as dedup key |
| `published_at` | datetime | Required, fallback to UTC now |
| `summary` | str | Cleaned HTML, truncated to 500 chars |
| `content` | str | Cleaned HTML, full text |
| `thumbnail_url` | str | From media_thumbnail or media_content |
| `tags` | list[str] | From RSS `<category>` or Reddit flair |

### RSS Feed Parsing (RSSFeedCrawler)

The `_parse_entry()` method extracts data from each feed entry:

1. **Title**: `entry.title` (required, skip if missing)
2. **URL**: `entry.link` (required, skip if missing)
3. **Date**: `entry.published` or `entry.updated`, fallback to UTC now
4. **Summary**: `entry.summary` or `entry.description`, cleaned and truncated
5. **Content**: `entry.content[0].value` if available, else summary
6. **Thumbnail**: `entry.media_thumbnail[0].url` or `entry.media_content[0].url`
7. **Tags**: `[tag.term for tag in entry.tags]`

## Service Layer — `CrawlerService`

### `process_articles()` — The Orchestrator

Single entry point called by every Celery task and CLI command:

```
process_articles(articles, source_name, source_url, default_category_slug)
    │
    ├─ 1. _get_or_create_source()     → ensures Source row exists
    │
    ├─ 2. FOR each article:
    │      └─ _save_article()
    │          ├─ Dedup: original_url exists? → skip
    │          ├─ _categorize_article() → keyword scoring
    │          └─ transaction.atomic()
    │              ├─ Article.objects.create(...)
    │              └─ _add_tags(article, tags)
    │
    ├─ 3. Update source.last_crawled_at
    │
    └─ 4. Return {total, created, skipped, errors}
```

Each article is processed in its own try/except — one bad article never kills the batch.

### Deduplication Strategy

Two layers of protection:

1. **Application-level**: `DBArticle.objects.filter(original_url=article.url).exists()` — cheap check before any work
2. **Database-level**: `original_url` has `unique=True` constraint — safety net against race conditions between concurrent workers

Additionally, `Article.get_content_hash()` generates an MD5 of `title|url` (available but not currently used in the save path).

### Source Management

`_get_or_create_source()` uses Django's `get_or_create` keyed on `url` (unique). Category lookup has a fallback chain:

```
Requested category slug → found? → use it
                        → not found? → try "cross-platform"
                                     → not found? → return None (abort all articles)
```

Source type is auto-detected: `"reddit.com"` in URL → `reddit`, otherwise → `blog`.

## Auto-Categorization

### How It Works

`_categorize_article()` uses a keyword-frequency scoring system.

**Step 1 — Build search text:**

```python
text = f"{article.title} {article.summary} {article.content}".lower()
```

**Step 2 — Score each category:**

```python
CATEGORY_KEYWORDS = {
    "android":        ["android", "kotlin", "jetpack", "compose", "gradle"],
    "ios":            ["ios", "swift", "swiftui", "xcode", "cocoapods"],
    "react-native":   ["react native", "expo", "metro"],
    "flutter":        ["flutter", "dart", "widget"],
    "cross-platform": ["cross-platform", "multiplatform", "hybrid", "cordova", "ionic"],
}
```

For each category, count how many keywords appear as substrings in the text. Score = number of matching keywords.

**Step 3 — Pick the winner:**

```python
best_category_slug = max(scores, key=scores.get)
```

Highest score wins. On ties, dict insertion order breaks it: `android > ios > react-native > flutter > cross-platform`.

**Step 4 — Fallback chain:**

```
Highest-scoring category → found in DB? → use it
No scores at all? → use default_category_slug from caller
                  → not found? → Category.objects.first()
```

### Example

Article: `"Building Android apps with Jetpack Compose and Kotlin"`

| Category | Matching Keywords | Score |
|---|---|---|
| android | android, kotlin, jetpack, compose | **4** |
| ios | — | 0 |
| react-native | — | 0 |
| flutter | — | 0 |
| cross-platform | — | 0 |

Result: categorized as **android**.

### Known Limitations

1. **Substring matching** — `"ios"` matches inside words like "cur**ios**ity" or "scener**ios**" (false positives)
2. **No weighting** — a keyword in the title counts the same as one buried deep in content
3. **Boolean per keyword** — `keyword in text` checks presence, not frequency. An article mentioning "flutter" 50 times scores the same as mentioning it once
4. **Implicit tie-breaking** — relies on dict insertion order, not explicit priority

## Tag System

Tags originate from crawlers (RSS `<category>` elements, Reddit flair). Processing:

1. **Cap at 10 tags** per article
2. **Skip empty or >100 char** tags
3. **Normalize via `slugify()`** — `"React Native"` → `"react-native"`, deduplicates across casing
4. **`get_or_create` on slug** — tags are shared across articles via M2M

## Scheduling (Celery Beat)

Configuration in `config/settings.py`:

```python
CELERY_BEAT_SCHEDULE = {
    "crawl-blogs-every-6-hours": {
        "task": "crawler.crawl_all_blogs",
        "schedule": crontab(hour="*/6", minute=0),    # 00:00, 06:00, 12:00, 18:00 UTC
    },
    "crawl-reddit-every-2-hours": {
        "task": "crawler.crawl_all_reddit",
        "schedule": crontab(hour="*/2", minute=30),   # 00:30, 02:30, 04:30, ... UTC
    },
}
```

| Task | Schedule | Sources |
|---|---|---|
| `crawl_all_blogs` | Every 6 hours | 6 blog RSS feeds |
| `crawl_all_reddit` | Every 2 hours | 4 Reddit subreddits |
| `crawl_all_sources` | Manual only | Both blogs + Reddit |

## Database Schema

### Core Tables (Crawling-Related)

```
┌──────────────────────┐     ┌──────────────────────┐
│     Category         │     │       Source          │
├──────────────────────┤     ├──────────────────────┤
│ id (PK)              │◄────│ category (FK)        │
│ name (unique)        │     │ id (PK)              │
│ slug (unique)        │     │ name                 │
│ description          │     │ url (unique)         │
│ created_at           │     │ rss_url              │
│ updated_at           │     │ source_type          │
└──────────────────────┘     │ is_active            │
        ▲                    │ last_crawled_at      │
        │ (FK)               └──────────────────────┘
        │                           ▲
┌───────┴──────────────┐            │ (FK)
│      Article         │────────────┘
├──────────────────────┤
│ id (PK)              │     ┌──────────────────────┐
│ title                │     │        Tag           │
│ summary              │     ├──────────────────────┤
│ content              │     │ id (PK)              │
│ original_url (unique)│◄───►│ name (unique)        │
│ thumbnail_url        │ M2M │ slug (unique)        │
│ category (FK)        │     └──────────────────────┘
│ source (FK)          │
│ published_at (index) │     ┌──────────────────────┐
│ like_count (index)   │     │     CrawlLog         │
│ comment_count        │     ├──────────────────────┤
│ created_at           │     │ id (PK)              │
│ updated_at           │     │ source (FK)          │
└──────────────────────┘     │ status (success/fail)│
                             │ articles_found       │
                             │ error_message        │
                             │ started_at (index)   │
                             │ finished_at          │
                             └──────────────────────┘
```

### Data Type Mapping: Crawled → DB

| `Article` (base.py) | `DBArticle` (news/models.py) | Notes |
|---|---|---|
| `title` | `title` | Truncated to 500 chars |
| `url` | `original_url` | Unique, dedup key |
| `published_at` | `published_at` | Indexed for ordering |
| `summary` | `summary` | Cleaned HTML text |
| `content` | `content` | Full cleaned text |
| `thumbnail_url` | `thumbnail_url` | From media elements |
| `tags` (list[str]) | `tags` (M2M via Tag) | Max 10, slugified |
| *(auto-detected)* | `category` (FK) | From keyword scoring |
| *(from caller)* | `source` (FK) | get_or_create by URL |

## Infrastructure (Docker)

```
docker-compose.yml
├── db         (PostgreSQL 16)      — data storage
├── redis      (Redis 7)            — message broker & result backend
├── api        (Django)             — REST API server
├── admin      (Django)             — admin interface
├── crawler    (Celery worker)      — task execution, queue: "crawler"
└── celery-beat (Celery Beat)       — scheduled task dispatch
```

## Error Handling

| Layer | Strategy |
|---|---|
| **Per-entry** (RSSFeedCrawler) | try/except around each feed entry, skip and continue |
| **Per-article** (CrawlerService) | try/except in the loop, count errors in stats |
| **Per-crawler** (Celery tasks) | try/except around each crawler instance |
| **DB writes** | `transaction.atomic()` per article — failed tag creation rolls back article |
| **Network errors** | Retried on next scheduled crawl (no explicit retry) |

## CLI Usage

```bash
# All sources
python manage.py crawl_news

# Only blogs
python manage.py crawl_news --type blog

# Only Reddit (custom limit)
python manage.py crawl_news --type reddit --limit 50

# Single source
python manage.py crawl_news --source android
python manage.py crawl_news --source reddit-androiddev --limit 25
```

## Key Libraries

| Library | Version | Purpose |
|---|---|---|
| celery | 5.6+ | Distributed task queue |
| redis | 7+ | Message broker & result backend |
| feedparser | 6+ | RSS/Atom feed parsing |
| praw | 7.8+ | Reddit API client |
| beautifulsoup4 | 4.12+ | HTML parsing & cleanup |
| lxml | 5+ | XML/HTML parsing backend |
| python-dateutil | 2.9+ | Flexible date parsing |
