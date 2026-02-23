"""
Base crawler classes and utilities.
"""
import hashlib
import logging
from abc import ABC, abstractmethod
from datetime import datetime, timezone
from typing import Dict, List, Optional

from django.utils.text import slugify

logger = logging.getLogger(__name__)


class Article:
    """Data class representing a crawled article."""

    def __init__(
        self,
        title: str,
        url: str,
        published_at: datetime,
        summary: str = "",
        content: str = "",
        thumbnail_url: str = "",
        tags: Optional[List[str]] = None,
    ):
        self.title = title
        self.url = url
        self.published_at = published_at
        self.summary = summary
        self.content = content
        self.thumbnail_url = thumbnail_url
        self.tags = tags or []

    def to_dict(self) -> Dict:
        """Convert article to dictionary."""
        return {
            "title": self.title,
            "url": self.url,
            "published_at": self.published_at,
            "summary": self.summary,
            "content": self.content,
            "thumbnail_url": self.thumbnail_url,
            "tags": self.tags,
        }

    def get_content_hash(self) -> str:
        """Generate a hash of the article content for deduplication."""
        content = f"{self.title}|{self.url}"
        return hashlib.md5(content.encode()).hexdigest()


class BaseCrawler(ABC):
    """Base class for all crawlers."""

    def __init__(self, source_name: str, source_url: str):
        self.source_name = source_name
        self.source_url = source_url
        self.logger = logging.getLogger(f"{__name__}.{self.__class__.__name__}")

    @abstractmethod
    def crawl(self) -> List[Article]:
        """
        Crawl the source and return a list of articles.

        Returns:
            List[Article]: List of crawled articles
        """
        pass

    def _clean_html(self, html: str) -> str:
        """
        Clean HTML content and extract plain text.

        Args:
            html: HTML content

        Returns:
            str: Cleaned plain text
        """
        from bs4 import BeautifulSoup

        soup = BeautifulSoup(html, "lxml")
        # Remove script and style elements
        for script in soup(["script", "style"]):
            script.decompose()
        # Get text
        text = soup.get_text()
        # Clean up whitespace
        lines = (line.strip() for line in text.splitlines())
        chunks = (phrase.strip() for line in lines for phrase in line.split("  "))
        text = " ".join(chunk for chunk in chunks if chunk)
        return text

    def _parse_datetime(self, date_string: str) -> Optional[datetime]:
        """
        Parse various date formats into datetime object.

        Args:
            date_string: Date string to parse

        Returns:
            Optional[datetime]: Parsed datetime or None
        """
        from dateutil import parser

        try:
            dt = parser.parse(date_string)
            # Ensure timezone aware
            if dt.tzinfo is None:
                dt = dt.replace(tzinfo=timezone.utc)
            return dt
        except (ValueError, TypeError) as e:
            self.logger.warning(f"Failed to parse date '{date_string}': {e}")
            return None

    def _truncate_text(self, text: str, max_length: int = 500) -> str:
        """
        Truncate text to a maximum length.

        Args:
            text: Text to truncate
            max_length: Maximum length

        Returns:
            str: Truncated text
        """
        if len(text) <= max_length:
            return text
        return text[:max_length].rsplit(" ", 1)[0] + "..."


class RSSFeedCrawler(BaseCrawler):
    """Crawler for RSS/Atom feeds."""

    def __init__(self, source_name: str, source_url: str, feed_url: str):
        super().__init__(source_name, source_url)
        self.feed_url = feed_url

    def crawl(self) -> List[Article]:
        """
        Crawl RSS feed and return articles.

        Returns:
            List[Article]: List of crawled articles
        """
        import feedparser

        self.logger.info(f"Crawling RSS feed: {self.feed_url}")

        try:
            feed = feedparser.parse(self.feed_url)

            if feed.bozo:
                self.logger.warning(f"Feed parsing warning: {feed.bozo_exception}")

            articles = []
            for entry in feed.entries:
                article = self._parse_entry(entry)
                if article:
                    articles.append(article)

            self.logger.info(f"Crawled {len(articles)} articles from {self.source_name}")
            return articles

        except Exception as e:
            self.logger.error(f"Error crawling {self.source_name}: {e}", exc_info=True)
            return []

    def _parse_entry(self, entry) -> Optional[Article]:
        """
        Parse a feed entry into an Article object.

        Args:
            entry: Feed entry from feedparser

        Returns:
            Optional[Article]: Parsed article or None
        """
        try:
            # Extract title
            title = entry.get("title", "").strip()
            if not title:
                self.logger.warning("Entry missing title, skipping")
                return None

            # Extract URL
            url = entry.get("link", "").strip()
            if not url:
                self.logger.warning(f"Entry '{title}' missing link, skipping")
                return None

            # Extract published date
            published_str = entry.get("published", entry.get("updated", ""))
            published_at = self._parse_datetime(published_str)
            if not published_at:
                # Use current time if no date available
                published_at = datetime.now(timezone.utc)

            # Extract summary
            summary = entry.get("summary", entry.get("description", ""))
            if summary:
                summary = self._clean_html(summary)
                summary = self._truncate_text(summary, max_length=500)

            # Extract content
            content = ""
            if "content" in entry:
                content = entry.content[0].value
                content = self._clean_html(content)
            elif summary:
                content = summary

            # Extract thumbnail
            thumbnail_url = ""
            if "media_thumbnail" in entry and entry.media_thumbnail:
                thumbnail_url = entry.media_thumbnail[0].get("url", "")
            elif "media_content" in entry and entry.media_content:
                thumbnail_url = entry.media_content[0].get("url", "")

            # Extract tags
            tags = []
            if "tags" in entry:
                tags = [tag.term for tag in entry.tags if hasattr(tag, "term")]

            return Article(
                title=title,
                url=url,
                published_at=published_at,
                summary=summary,
                content=content,
                thumbnail_url=thumbnail_url,
                tags=tags,
            )

        except Exception as e:
            self.logger.error(f"Error parsing entry: {e}", exc_info=True)
            return None
