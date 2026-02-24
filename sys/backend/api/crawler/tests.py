import pytest
from datetime import datetime, timezone, timedelta
from unittest.mock import patch, MagicMock

from django.contrib.auth import get_user_model

from news.models import Article, Category, Source, Tag
from crawler.models import CrawlLog
from crawler.base import Article as CrawledArticle, BaseCrawler, RSSFeedCrawler
from crawler.service import CrawlerService

User = get_user_model()


# --- CrawlLog Model Tests ---


@pytest.mark.django_db
class TestCrawlLogModel:
    """Tests for CrawlLog model."""

    def test_create_crawl_log(self, source):
        """Test creating a crawl log entry."""
        now = datetime.now(timezone.utc)
        log = CrawlLog.objects.create(
            source=source,
            status=CrawlLog.Status.SUCCESS,
            articles_found=5,
            started_at=now - timedelta(seconds=10),
            finished_at=now,
        )

        assert log.source == source
        assert log.status == "success"
        assert log.articles_found == 5
        assert log.error_message == ""

    def test_crawl_log_failed_status(self, source):
        """Test creating a failed crawl log."""
        now = datetime.now(timezone.utc)
        log = CrawlLog.objects.create(
            source=source,
            status=CrawlLog.Status.FAILED,
            articles_found=0,
            error_message="Connection timeout",
            started_at=now - timedelta(seconds=5),
            finished_at=now,
        )

        assert log.status == "failed"
        assert log.error_message == "Connection timeout"
        assert log.articles_found == 0

    def test_crawl_log_ordering(self, source):
        """Test that crawl logs are ordered by -started_at."""
        now = datetime.now(timezone.utc)
        old_log = CrawlLog.objects.create(
            source=source,
            status=CrawlLog.Status.SUCCESS,
            articles_found=3,
            started_at=now - timedelta(hours=2),
            finished_at=now - timedelta(hours=2) + timedelta(seconds=5),
        )
        new_log = CrawlLog.objects.create(
            source=source,
            status=CrawlLog.Status.SUCCESS,
            articles_found=5,
            started_at=now,
            finished_at=now + timedelta(seconds=5),
        )

        logs = list(CrawlLog.objects.all())
        assert logs[0].id == new_log.id
        assert logs[1].id == old_log.id

    def test_crawl_log_str(self, source):
        """Test string representation of crawl log."""
        now = datetime.now(timezone.utc)
        log = CrawlLog.objects.create(
            source=source,
            status=CrawlLog.Status.SUCCESS,
            articles_found=5,
            started_at=now,
            finished_at=now,
        )

        assert source.name in str(log)
        assert "success" in str(log)

    def test_crawl_log_cascade_delete(self, source):
        """Test that crawl logs are deleted when source is deleted."""
        now = datetime.now(timezone.utc)
        CrawlLog.objects.create(
            source=source,
            status=CrawlLog.Status.SUCCESS,
            articles_found=3,
            started_at=now,
            finished_at=now,
        )

        assert CrawlLog.objects.count() == 1
        source.delete()
        assert CrawlLog.objects.count() == 0


# --- CrawledArticle (data class) Tests ---


class TestCrawledArticle:
    """Tests for the crawled Article data class."""

    def test_create_article(self):
        """Test creating a crawled article."""
        article = CrawledArticle(
            title="Test Article",
            url="https://example.com/article",
            published_at=datetime.now(timezone.utc),
            summary="A summary",
            content="Full content",
        )

        assert article.title == "Test Article"
        assert article.url == "https://example.com/article"
        assert article.summary == "A summary"
        assert article.tags == []

    def test_article_to_dict(self):
        """Test converting article to dictionary."""
        article = CrawledArticle(
            title="Test",
            url="https://example.com",
            published_at=datetime(2026, 1, 1, tzinfo=timezone.utc),
            tags=["python", "django"],
        )
        d = article.to_dict()

        assert d["title"] == "Test"
        assert d["url"] == "https://example.com"
        assert d["tags"] == ["python", "django"]

    def test_article_content_hash(self):
        """Test content hash generation."""
        a1 = CrawledArticle(title="Test", url="https://a.com", published_at=datetime.now(timezone.utc))
        a2 = CrawledArticle(title="Test", url="https://a.com", published_at=datetime.now(timezone.utc))
        a3 = CrawledArticle(title="Different", url="https://b.com", published_at=datetime.now(timezone.utc))

        assert a1.get_content_hash() == a2.get_content_hash()
        assert a1.get_content_hash() != a3.get_content_hash()

    def test_article_default_tags(self):
        """Test default empty tags list."""
        article = CrawledArticle(title="T", url="http://x.com", published_at=datetime.now(timezone.utc))
        assert article.tags == []


# --- BaseCrawler Tests ---


class TestBaseCrawler:
    """Tests for BaseCrawler utility methods."""

    def _get_crawler(self):
        """Create a concrete crawler for testing."""
        class TestCrawler(BaseCrawler):
            def crawl(self):
                return []
        return TestCrawler("Test Source", "https://test.com")

    def test_truncate_text_short(self):
        """Test truncation does nothing for short text."""
        crawler = self._get_crawler()
        text = "Short text"
        assert crawler._truncate_text(text, 100) == text

    def test_truncate_text_long(self):
        """Test truncation of long text."""
        crawler = self._get_crawler()
        text = "This is a long sentence that exceeds the limit"
        result = crawler._truncate_text(text, 30)
        assert len(result) <= 33  # 30 + "..."
        assert result.endswith("...")

    def test_parse_datetime_valid(self):
        """Test parsing a valid date string."""
        crawler = self._get_crawler()
        dt = crawler._parse_datetime("2026-02-24T12:00:00Z")
        assert dt is not None
        assert dt.year == 2026
        assert dt.month == 2

    def test_parse_datetime_invalid(self):
        """Test parsing an invalid date string."""
        crawler = self._get_crawler()
        dt = crawler._parse_datetime("not-a-date")
        assert dt is None

    def test_parse_datetime_naive(self):
        """Test parsing a naive datetime gets UTC timezone."""
        crawler = self._get_crawler()
        dt = crawler._parse_datetime("2026-01-01 10:00:00")
        assert dt is not None
        assert dt.tzinfo is not None

    def test_determine_source_type_blog(self):
        """Test source type determination for blogs."""
        service = CrawlerService()
        assert service._determine_source_type("https://blog.example.com") == "blog"

    def test_determine_source_type_reddit(self):
        """Test source type determination for Reddit."""
        service = CrawlerService()
        assert service._determine_source_type("https://reddit.com/r/test") == "reddit"


# --- CrawlerService Tests ---


@pytest.mark.django_db
class TestCrawlerService:
    """Tests for CrawlerService."""

    @pytest.fixture
    def service(self):
        return CrawlerService()

    @pytest.fixture
    def setup_categories(self, db):
        """Create categories needed for auto-categorization."""
        android = Category.objects.create(name="Android", slug="android")
        ios = Category.objects.create(name="iOS", slug="ios")
        flutter = Category.objects.create(name="Flutter", slug="flutter")
        rn = Category.objects.create(name="React Native", slug="react-native")
        cp = Category.objects.create(name="Cross-platform", slug="cross-platform")
        return {"android": android, "ios": ios, "flutter": flutter, "react-native": rn, "cross-platform": cp}

    def _make_crawled_article(self, title="Test Article", url="https://example.com/article"):
        return CrawledArticle(
            title=title,
            url=url,
            published_at=datetime.now(timezone.utc),
            summary="A summary about the article",
            content="Full content of the article",
            tags=["test", "article"],
        )

    def test_process_articles_creates_articles(self, service, setup_categories):
        """Test that process_articles creates new articles."""
        articles = [
            self._make_crawled_article("Article 1", "https://example.com/1"),
            self._make_crawled_article("Article 2", "https://example.com/2"),
        ]

        stats = service.process_articles(articles, "Test Blog", "https://testblog.com", "android")

        assert stats["total"] == 2
        assert stats["created"] == 2
        assert stats["skipped"] == 0
        assert stats["errors"] == 0
        assert Article.objects.count() == 2

    def test_process_articles_deduplication(self, service, setup_categories):
        """Test that duplicate articles are skipped."""
        articles = [
            self._make_crawled_article("Article 1", "https://example.com/1"),
        ]

        stats1 = service.process_articles(articles, "Test Blog", "https://testblog.com", "android")
        stats2 = service.process_articles(articles, "Test Blog", "https://testblog.com", "android")

        assert stats1["created"] == 1
        assert stats2["created"] == 0
        assert stats2["skipped"] == 1
        assert Article.objects.count() == 1

    def test_process_articles_updates_source_last_crawled(self, service, setup_categories):
        """Test that source last_crawled_at is updated."""
        articles = [self._make_crawled_article()]

        service.process_articles(articles, "Test Blog", "https://testblog.com", "android")

        source = Source.objects.get(url="https://testblog.com")
        assert source.last_crawled_at is not None

    def test_process_articles_creates_source(self, service, setup_categories):
        """Test that a new source is created if it doesn't exist."""
        articles = [self._make_crawled_article()]

        service.process_articles(articles, "New Blog", "https://newblog.com", "android")

        assert Source.objects.filter(url="https://newblog.com").exists()
        source = Source.objects.get(url="https://newblog.com")
        assert source.name == "New Blog"

    def test_process_articles_reuses_existing_source(self, service, setup_categories):
        """Test that existing source is reused."""
        # Create source manually using setup_categories to avoid fixture conflict
        existing_source = Source.objects.create(
            name="Android Developers Blog",
            url="https://android-developers.googleblog.com",
            rss_url="https://android-developers.googleblog.com/feeds/posts/default",
            source_type=Source.SourceType.BLOG,
            category=setup_categories["android"],
            is_active=True,
        )
        articles = [self._make_crawled_article()]

        service.process_articles(
            articles, "Android Developers Blog",
            "https://android-developers.googleblog.com", "android",
        )

        assert Source.objects.filter(url="https://android-developers.googleblog.com").count() == 1

    def test_categorize_article_android(self, service, setup_categories):
        """Test auto-categorization for Android articles."""
        article = CrawledArticle(
            title="New Jetpack Compose features for Android",
            url="https://example.com/android",
            published_at=datetime.now(timezone.utc),
            summary="Android Kotlin development",
        )
        category = service._categorize_article(article, "cross-platform")
        assert category.slug == "android"

    def test_categorize_article_ios(self, service, setup_categories):
        """Test auto-categorization for iOS articles."""
        article = CrawledArticle(
            title="SwiftUI improvements in iOS",
            url="https://example.com/ios",
            published_at=datetime.now(timezone.utc),
            summary="New Xcode features for Swift",
        )
        category = service._categorize_article(article, "cross-platform")
        assert category.slug == "ios"

    def test_categorize_article_flutter(self, service, setup_categories):
        """Test auto-categorization for Flutter articles."""
        article = CrawledArticle(
            title="Flutter Widget testing with Dart",
            url="https://example.com/flutter",
            published_at=datetime.now(timezone.utc),
        )
        category = service._categorize_article(article, "cross-platform")
        assert category.slug == "flutter"

    def test_categorize_article_fallback(self, service, setup_categories):
        """Test fallback to default category when no keywords match."""
        article = CrawledArticle(
            title="General tech news",
            url="https://example.com/general",
            published_at=datetime.now(timezone.utc),
        )
        category = service._categorize_article(article, "cross-platform")
        assert category.slug == "cross-platform"

    def test_add_tags(self, service, setup_categories):
        """Test that tags are added to articles."""
        articles = [
            CrawledArticle(
                title="Tagged Article",
                url="https://example.com/tagged",
                published_at=datetime.now(timezone.utc),
                tags=["kotlin", "android", "jetpack"],
            )
        ]

        service.process_articles(articles, "Test Blog", "https://testblog.com", "android")

        db_article = Article.objects.first()
        assert db_article.tags.count() == 3

    def test_add_tags_limit_10(self, service, setup_categories):
        """Test that only 10 tags are added maximum."""
        tags = [f"tag{i}" for i in range(15)]
        articles = [
            CrawledArticle(
                title="Many Tags",
                url="https://example.com/manytags",
                published_at=datetime.now(timezone.utc),
                tags=tags,
            )
        ]

        service.process_articles(articles, "Test Blog", "https://testblog.com", "android")

        db_article = Article.objects.first()
        assert db_article.tags.count() == 10

    def test_process_articles_missing_category(self, service, db):
        """Test handling when category doesn't exist."""
        articles = [self._make_crawled_article()]

        stats = service.process_articles(articles, "Test Blog", "https://testblog.com", "nonexistent")

        assert stats["errors"] == 1

    def test_title_truncation(self, service, setup_categories):
        """Test that long titles are truncated to 500 chars."""
        long_title = "A" * 600
        articles = [
            CrawledArticle(
                title=long_title,
                url="https://example.com/long",
                published_at=datetime.now(timezone.utc),
            )
        ]

        service.process_articles(articles, "Test Blog", "https://testblog.com", "android")

        db_article = Article.objects.first()
        assert len(db_article.title) == 500
