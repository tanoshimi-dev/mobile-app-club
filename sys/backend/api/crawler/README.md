# News Crawler System

This module implements the automated news crawling and aggregation system for Mobile Dev News.

## Features

- **RSS/Atom Feed Crawling**: Crawls official development blogs via RSS feeds
- **Reddit API Integration**: Crawls mobile development subreddits
- **Auto-Categorization**: Automatically categorizes articles based on content
- **Deduplication**: Prevents duplicate articles using URL-based detection
- **Scheduled Crawling**: Automatic crawling via Celery Beat
- **Tag Extraction**: Extracts and normalizes article tags

## Supported Sources

### Official Blogs (RSS)
- **Android Developers Blog** - Android, Kotlin, Jetpack news
- **Apple Developer News** - iOS, Swift, SwiftUI updates
- **React Native Blog** - React Native framework updates
- **Flutter Blog** - Flutter and Dart news
- **Kotlin Blog** - Kotlin language news
- **Swift.org Blog** - Swift language updates

### Reddit Sources
- **r/androiddev** - Android development community
- **r/iOSProgramming** - iOS development community
- **r/reactnative** - React Native community
- **r/FlutterDev** - Flutter development community

## Architecture

```
crawler/
├── base.py                  # Base crawler classes and Article model
├── blog_crawlers.py         # RSS feed crawlers for blogs
├── reddit_crawler.py        # Reddit API crawlers
├── service.py               # Article processing and DB service
├── tasks.py                 # Celery tasks for scheduled crawling
└── management/
    └── commands/
        └── crawl_news.py    # Django management command
```

## Usage

### Manual Crawling

#### Crawl All Sources
```bash
python manage.py crawl_news
```

#### Crawl Only Blogs
```bash
python manage.py crawl_news --type blog
```

#### Crawl Only Reddit
```bash
python manage.py crawl_news --type reddit --limit 50
```

#### Crawl Specific Source
```bash
# Blog sources
python manage.py crawl_news --source android
python manage.py crawl_news --source ios
python manage.py crawl_news --source react-native
python manage.py crawl_news --source flutter

# Reddit sources
python manage.py crawl_news --source reddit-androiddev --limit 25
python manage.py crawl_news --source reddit-iosprogramming --limit 25
```

### Scheduled Crawling

The crawler runs automatically via Celery Beat:

- **Blogs**: Every 6 hours (00:00, 06:00, 12:00, 18:00 UTC)
- **Reddit**: Every 2 hours at :30 (00:30, 02:30, 04:30, etc. UTC)

#### Start Celery Worker
```bash
celery -A config worker -l info -Q crawler
```

#### Start Celery Beat Scheduler
```bash
celery -A config beat -l info
```

#### Using Docker Compose
```bash
docker compose up -d crawler celery-beat
```

## Configuration

### Environment Variables

#### Reddit API (Required for Reddit crawling)
```bash
REDDIT_CLIENT_ID=your_client_id
REDDIT_CLIENT_SECRET=your_client_secret
REDDIT_USER_AGENT=MobileDevNews/1.0 (by /u/your_username)
```

To get Reddit API credentials:
1. Go to https://www.reddit.com/prefs/apps
2. Create an app (select "script" type)
3. Use the client ID and secret in your .env file

### Celery Beat Schedule

Customize the crawling schedule in `config/settings.py`:

```python
CELERY_BEAT_SCHEDULE = {
    "crawl-blogs-every-6-hours": {
        "task": "crawler.crawl_all_blogs",
        "schedule": crontab(hour="*/6", minute=0),
    },
    "crawl-reddit-every-2-hours": {
        "task": "crawler.crawl_all_reddit",
        "schedule": crontab(hour="*/2", minute=30),
    },
}
```

## Auto-Categorization

Articles are automatically categorized based on keyword matching:

- **Android**: android, kotlin, jetpack, compose, gradle
- **iOS**: ios, swift, swiftui, xcode, cocoapods
- **React Native**: react native, expo, metro
- **Flutter**: flutter, dart, widget
- **Cross-Platform**: cross-platform, multiplatform, hybrid, cordova, ionic

If no keywords match, articles default to the source's category.

## Deduplication

Duplicate articles are detected using the `original_url` field:
- Before saving, the system checks if the URL already exists
- Duplicate articles are skipped and logged
- Each crawl reports: created, skipped (duplicates), errors

## Error Handling

The crawler includes comprehensive error handling:
- Network errors are logged and retried on next schedule
- Parse errors skip the problematic entry
- Database errors rollback transactions
- All errors are logged with full stack traces

## Monitoring

### View Crawler Logs
```bash
# In Docker
docker logs mdn-crawler

# Local development
# Logs are written to console with logger name
```

### Celery Monitoring
```bash
# Monitor Celery tasks
celery -A config inspect active

# View scheduled tasks
celery -A config inspect scheduled

# Task statistics
celery -A config inspect stats
```

## Testing

Run crawler tests:
```bash
pytest crawler/tests.py -v
```

## Extending the Crawler

### Adding a New Blog Source

1. **Add to `blog_crawlers.py`**:
```python
class NewBlogCrawler(RSSFeedCrawler):
    def __init__(self):
        super().__init__(
            source_name="New Blog",
            source_url="https://example.com/blog",
            feed_url="https://example.com/feed.xml",
        )

# Add to registry
BLOG_CRAWLERS["new-blog"] = NewBlogCrawler
```

2. **Add category mapping in `crawl_news.py`**:
```python
def _get_default_category(self, source_name: str) -> str:
    category_map = {
        # ... existing mappings ...
        "new-blog": "android",  # or appropriate category
    }
    return category_map.get(source_name, "cross-platform")
```

### Adding a New Reddit Source

1. **Add to `reddit_crawler.py`**:
```python
class NewSubredditCrawler(RedditCrawler):
    def __init__(self):
        super().__init__("newsubreddit")

REDDIT_CRAWLERS["reddit-newsubreddit"] = NewSubredditCrawler
```

## Troubleshooting

### No Articles Being Created

1. **Check if categories exist in database**:
```bash
python manage.py shell
>>> from news.models import Category
>>> Category.objects.all()
```

2. **Create missing categories**:
```bash
python manage.py shell
>>> from news.models import Category
>>> Category.objects.create(name="Android", slug="android")
>>> Category.objects.create(name="iOS", slug="ios")
>>> Category.objects.create(name="React Native", slug="react-native")
>>> Category.objects.create(name="Flutter", slug="flutter")
>>> Category.objects.create(name="Cross-Platform", slug="cross-platform")
```

### Reddit API Errors

- Verify environment variables are set
- Check Reddit API rate limits (60 requests/minute)
- Ensure user agent string is descriptive

### RSS Feed Parse Errors

- Some feeds may have malformed XML - check logs for details
- Feed URLs may have changed - verify URLs are current
- Network timeouts - increase timeout in feedparser if needed

## Performance

- **Blog crawling**: ~1-2 seconds per source (6 sources = 6-12 seconds)
- **Reddit crawling**: ~2-3 seconds per subreddit (4 sources = 8-12 seconds)
- **Total crawl time**: ~15-25 seconds for all sources
- **Database operations**: Optimized with transaction.atomic()
- **Memory usage**: Minimal (~50-100MB per worker)

## Future Enhancements

Potential improvements for future versions:

- [ ] Web scraping for sources without RSS feeds
- [ ] Image download and local storage
- [ ] Content enrichment (readability, summary generation)
- [ ] Machine learning for better categorization
- [ ] Sentiment analysis
- [ ] Trending detection algorithms
- [ ] Email/Slack notifications for new articles
- [ ] Admin dashboard for crawler management
- [ ] Crawler health monitoring and alerting

---

*Last updated: 2026-02-24*
