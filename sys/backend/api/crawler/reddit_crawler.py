"""
Reddit crawler for mobile development subreddits.
"""
import os
from datetime import datetime, timezone
from typing import List

from .base import Article, BaseCrawler


class RedditCrawler(BaseCrawler):
    """Crawler for Reddit subreddits."""

    def __init__(self, subreddit_name: str):
        super().__init__(
            source_name=f"Reddit: r/{subreddit_name}",
            source_url=f"https://reddit.com/r/{subreddit_name}",
        )
        self.subreddit_name = subreddit_name

    def crawl(self, limit: int = 25) -> List[Article]:
        """
        Crawl subreddit and return articles.

        Args:
            limit: Maximum number of posts to fetch

        Returns:
            List[Article]: List of crawled articles
        """
        try:
            import praw

            # Initialize Reddit client
            reddit = praw.Reddit(
                client_id=os.getenv("REDDIT_CLIENT_ID", ""),
                client_secret=os.getenv("REDDIT_CLIENT_SECRET", ""),
                user_agent=os.getenv(
                    "REDDIT_USER_AGENT", "MobileDevNews/1.0 (by /u/mobile_dev_news)"
                ),
            )

            self.logger.info(f"Crawling r/{self.subreddit_name}")

            subreddit = reddit.subreddit(self.subreddit_name)
            articles = []

            # Fetch hot posts
            for submission in subreddit.hot(limit=limit):
                article = self._parse_submission(submission)
                if article:
                    articles.append(article)

            self.logger.info(
                f"Crawled {len(articles)} posts from r/{self.subreddit_name}"
            )
            return articles

        except Exception as e:
            self.logger.error(
                f"Error crawling r/{self.subreddit_name}: {e}", exc_info=True
            )
            return []

    def _parse_submission(self, submission) -> Article:
        """
        Parse a Reddit submission into an Article object.

        Args:
            submission: Reddit submission object

        Returns:
            Article: Parsed article
        """
        # Extract title
        title = submission.title.strip()

        # Extract URL
        url = f"https://reddit.com{submission.permalink}"

        # Extract published date
        published_at = datetime.fromtimestamp(submission.created_utc, tz=timezone.utc)

        # Extract summary from selftext
        summary = ""
        if submission.selftext:
            summary = self._truncate_text(submission.selftext, max_length=500)

        # Extract content
        content = submission.selftext or ""

        # Extract thumbnail
        thumbnail_url = ""
        if submission.thumbnail and submission.thumbnail.startswith("http"):
            thumbnail_url = submission.thumbnail

        # Extract tags from flair
        tags = []
        if submission.link_flair_text:
            tags.append(submission.link_flair_text)

        return Article(
            title=title,
            url=url,
            published_at=published_at,
            summary=summary,
            content=content,
            thumbnail_url=thumbnail_url,
            tags=tags,
        )


class AndroidDevRedditCrawler(RedditCrawler):
    """Crawler for r/androiddev."""

    def __init__(self):
        super().__init__("androiddev")


class iOSProgrammingRedditCrawler(RedditCrawler):
    """Crawler for r/iOSProgramming."""

    def __init__(self):
        super().__init__("iOSProgramming")


class ReactNativeRedditCrawler(RedditCrawler):
    """Crawler for r/reactnative."""

    def __init__(self):
        super().__init__("reactnative")


class FlutterDevRedditCrawler(RedditCrawler):
    """Crawler for r/FlutterDev."""

    def __init__(self):
        super().__init__("FlutterDev")


# Registry of Reddit crawlers
REDDIT_CRAWLERS = {
    "reddit-androiddev": AndroidDevRedditCrawler,
    "reddit-iosprogramming": iOSProgrammingRedditCrawler,
    "reddit-reactnative": ReactNativeRedditCrawler,
    "reddit-flutterdev": FlutterDevRedditCrawler,
}


def get_reddit_crawler(crawler_name: str):
    """
    Get a Reddit crawler instance by name.

    Args:
        crawler_name: Name of the crawler

    Returns:
        RedditCrawler: Crawler instance

    Raises:
        ValueError: If crawler name is not found
    """
    crawler_class = REDDIT_CRAWLERS.get(crawler_name)
    if not crawler_class:
        raise ValueError(
            f"Unknown Reddit crawler: {crawler_name}. "
            f"Available crawlers: {', '.join(REDDIT_CRAWLERS.keys())}"
        )
    return crawler_class()


def get_all_reddit_crawlers():
    """
    Get instances of all Reddit crawlers.

    Returns:
        List[RedditCrawler]: List of all crawler instances
    """
    return [crawler_class() for crawler_class in REDDIT_CRAWLERS.values()]
