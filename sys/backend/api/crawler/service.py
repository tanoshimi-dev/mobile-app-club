"""
Crawler service for processing and saving articles.
"""
import logging
from datetime import datetime, timezone
from typing import Dict, List, Optional

from django.db import transaction
from django.utils.text import slugify

from news.models import Article as DBArticle
from news.models import Category, Source, Tag

from .base import Article as CrawledArticle

logger = logging.getLogger(__name__)


class CrawlerService:
    """Service for processing crawled articles and saving to database."""

    # Keyword mapping for auto-categorization
    CATEGORY_KEYWORDS = {
        "android": ["android", "kotlin", "jetpack", "compose", "gradle"],
        "ios": ["ios", "swift", "swiftui", "xcode", "cocoapods"],
        "react-native": ["react native", "expo", "metro"],
        "flutter": ["flutter", "dart", "widget"],
        "cross-platform": [
            "cross-platform",
            "multiplatform",
            "hybrid",
            "cordova",
            "ionic",
        ],
    }

    def __init__(self):
        self.logger = logging.getLogger(f"{__name__}.{self.__class__.__name__}")

    def process_articles(
        self,
        articles: List[CrawledArticle],
        source_name: str,
        source_url: str,
        default_category_slug: str = "cross-platform",
    ) -> Dict:
        """
        Process and save crawled articles to database.

        Args:
            articles: List of crawled articles
            source_name: Name of the source
            source_url: URL of the source
            default_category_slug: Default category if auto-categorization fails

        Returns:
            Dict: Statistics about processed articles
        """
        stats = {
            "total": len(articles),
            "created": 0,
            "skipped": 0,
            "errors": 0,
        }

        # Get or create source
        source = self._get_or_create_source(
            source_name, source_url, default_category_slug
        )
        if not source:
            self.logger.error(f"Failed to get/create source: {source_name}")
            stats["errors"] = len(articles)
            return stats

        for article in articles:
            try:
                created = self._save_article(article, source, default_category_slug)
                if created:
                    stats["created"] += 1
                else:
                    stats["skipped"] += 1
            except Exception as e:
                self.logger.error(f"Error saving article '{article.title}': {e}")
                stats["errors"] += 1

        # Update source last_crawled_at
        source.last_crawled_at = datetime.now(timezone.utc)
        source.save(update_fields=["last_crawled_at"])

        self.logger.info(
            f"Processed {stats['total']} articles from {source_name}: "
            f"{stats['created']} created, {stats['skipped']} skipped, "
            f"{stats['errors']} errors"
        )

        return stats

    def _get_or_create_source(
        self, source_name: str, source_url: str, category_slug: str
    ) -> Optional[Source]:
        """
        Get or create a source in the database.

        Args:
            source_name: Name of the source
            source_url: URL of the source
            category_slug: Category slug

        Returns:
            Optional[Source]: Source object or None
        """
        try:
            # Get category
            category = Category.objects.filter(slug=category_slug).first()
            if not category:
                self.logger.warning(
                    f"Category '{category_slug}' not found, using 'cross-platform'"
                )
                category = Category.objects.filter(slug="cross-platform").first()
                if not category:
                    self.logger.error("Cross-platform category not found!")
                    return None

            # Get or create source
            source, created = Source.objects.get_or_create(
                url=source_url,
                defaults={
                    "name": source_name,
                    "source_type": self._determine_source_type(source_url),
                    "category": category,
                },
            )

            if created:
                self.logger.info(f"Created new source: {source_name}")

            return source

        except Exception as e:
            self.logger.error(f"Error getting/creating source: {e}", exc_info=True)
            return None

    def _determine_source_type(self, url: str) -> str:
        """
        Determine source type from URL.

        Args:
            url: Source URL

        Returns:
            str: Source type (blog/reddit/forum)
        """
        if "reddit.com" in url:
            return Source.SourceType.REDDIT
        return Source.SourceType.BLOG

    def _save_article(
        self,
        article: CrawledArticle,
        source: Source,
        default_category_slug: str,
    ) -> bool:
        """
        Save a single article to database.

        Args:
            article: Crawled article
            source: Source object
            default_category_slug: Default category slug

        Returns:
            bool: True if article was created, False if skipped (duplicate)
        """
        # Check if article already exists (deduplication)
        if DBArticle.objects.filter(original_url=article.url).exists():
            self.logger.debug(f"Article already exists: {article.url}")
            return False

        # Auto-categorize article
        category = self._categorize_article(article, default_category_slug)

        with transaction.atomic():
            # Create article
            db_article = DBArticle.objects.create(
                title=article.title[:500],  # Respect max_length
                summary=article.summary,
                content=article.content,
                original_url=article.url,
                thumbnail_url=article.thumbnail_url,
                category=category,
                source=source,
                published_at=article.published_at,
            )

            # Add tags
            if article.tags:
                self._add_tags(db_article, article.tags)

            self.logger.debug(f"Created article: {article.title}")
            return True

    def _categorize_article(
        self, article: CrawledArticle, default_category_slug: str
    ) -> Category:
        """
        Auto-categorize article based on title and content.

        Args:
            article: Crawled article
            default_category_slug: Default category slug

        Returns:
            Category: Category object
        """
        # Combine title and content for analysis
        text = f"{article.title} {article.summary} {article.content}".lower()

        # Check each category's keywords
        scores = {}
        for category_slug, keywords in self.CATEGORY_KEYWORDS.items():
            score = sum(1 for keyword in keywords if keyword in text)
            if score > 0:
                scores[category_slug] = score

        # Get category with highest score
        if scores:
            best_category_slug = max(scores, key=scores.get)
            category = Category.objects.filter(slug=best_category_slug).first()
            if category:
                return category

        # Fall back to default category
        category = Category.objects.filter(slug=default_category_slug).first()
        if not category:
            # Ultimate fallback
            category = Category.objects.first()

        return category

    def _add_tags(self, article: DBArticle, tag_names: List[str]) -> None:
        """
        Add tags to an article.

        Args:
            article: Database article object
            tag_names: List of tag names
        """
        for tag_name in tag_names[:10]:  # Limit to 10 tags
            tag_name = tag_name.strip()
            if not tag_name or len(tag_name) > 100:
                continue

            tag, _ = Tag.objects.get_or_create(
                slug=slugify(tag_name)[:100],
                defaults={"name": tag_name[:100]},
            )
            article.tags.add(tag)
