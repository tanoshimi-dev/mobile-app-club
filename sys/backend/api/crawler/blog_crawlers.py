"""
Crawlers for official development blogs.
"""
from .base import RSSFeedCrawler


class AndroidDevelopersBlogCrawler(RSSFeedCrawler):
    """Crawler for Android Developers Blog."""

    def __init__(self):
        super().__init__(
            source_name="Android Developers Blog",
            source_url="https://android-developers.googleblog.com/",
            feed_url="https://android-developers.googleblog.com/feeds/posts/default",
        )


class iOSDeveloperBlogCrawler(RSSFeedCrawler):
    """Crawler for Apple Developer News and Updates."""

    def __init__(self):
        super().__init__(
            source_name="Apple Developer News",
            source_url="https://developer.apple.com/news/",
            feed_url="https://developer.apple.com/news/rss/news.rss",
        )


class ReactNativeBlogCrawler(RSSFeedCrawler):
    """Crawler for React Native Blog."""

    def __init__(self):
        super().__init__(
            source_name="React Native Blog",
            source_url="https://reactnative.dev/blog",
            feed_url="https://reactnative.dev/blog/rss.xml",
        )


class FlutterBlogCrawler(RSSFeedCrawler):
    """Crawler for Flutter Blog."""

    def __init__(self):
        super().__init__(
            source_name="Flutter Blog",
            source_url="https://medium.com/flutter",
            feed_url="https://medium.com/feed/flutter",
        )


class KotlinBlogCrawler(RSSFeedCrawler):
    """Crawler for Kotlin Blog."""

    def __init__(self):
        super().__init__(
            source_name="Kotlin Blog",
            source_url="https://blog.jetbrains.com/kotlin/",
            feed_url="https://blog.jetbrains.com/kotlin/feed/",
        )


class SwiftBlogCrawler(RSSFeedCrawler):
    """Crawler for Swift.org Blog."""

    def __init__(self):
        super().__init__(
            source_name="Swift.org Blog",
            source_url="https://www.swift.org/blog/",
            feed_url="https://www.swift.org/blog/rss.xml",
        )


# Registry of all blog crawlers
BLOG_CRAWLERS = {
    "android": AndroidDevelopersBlogCrawler,
    "ios": iOSDeveloperBlogCrawler,
    "react-native": ReactNativeBlogCrawler,
    "flutter": FlutterBlogCrawler,
    "kotlin": KotlinBlogCrawler,
    "swift": SwiftBlogCrawler,
}


def get_crawler(crawler_name: str):
    """
    Get a crawler instance by name.

    Args:
        crawler_name: Name of the crawler

    Returns:
        BaseCrawler: Crawler instance

    Raises:
        ValueError: If crawler name is not found
    """
    crawler_class = BLOG_CRAWLERS.get(crawler_name)
    if not crawler_class:
        raise ValueError(
            f"Unknown crawler: {crawler_name}. "
            f"Available crawlers: {', '.join(BLOG_CRAWLERS.keys())}"
        )
    return crawler_class()


def get_all_crawlers():
    """
    Get instances of all blog crawlers.

    Returns:
        List[BaseCrawler]: List of all crawler instances
    """
    return [crawler_class() for crawler_class in BLOG_CRAWLERS.values()]
