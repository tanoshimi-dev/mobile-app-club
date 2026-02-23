"""
Django management command to crawl news from various sources.
"""
from django.core.management.base import BaseCommand

from crawler.blog_crawlers import BLOG_CRAWLERS, get_all_crawlers, get_crawler
from crawler.reddit_crawler import (
    REDDIT_CRAWLERS,
    get_all_reddit_crawlers,
    get_reddit_crawler,
)
from crawler.service import CrawlerService


class Command(BaseCommand):
    help = "Crawl news articles from blogs and Reddit"

    def add_arguments(self, parser):
        parser.add_argument(
            "--source",
            type=str,
            help="Specific source to crawl (e.g., 'android', 'ios', 'reddit-androiddev')",
        )
        parser.add_argument(
            "--type",
            type=str,
            choices=["blog", "reddit", "all"],
            default="all",
            help="Type of sources to crawl (default: all)",
        )
        parser.add_argument(
            "--limit",
            type=int,
            default=25,
            help="Limit number of posts to fetch from Reddit (default: 25)",
        )

    def handle(self, *args, **options):
        source = options["source"]
        source_type = options["type"]
        limit = options["limit"]

        service = CrawlerService()

        if source:
            # Crawl specific source
            self._crawl_source(service, source, limit)
        else:
            # Crawl multiple sources based on type
            if source_type in ["blog", "all"]:
                self._crawl_all_blogs(service)

            if source_type in ["reddit", "all"]:
                self._crawl_all_reddit(service, limit)

        self.stdout.write(
            self.style.SUCCESS("Crawling completed successfully!")
        )

    def _crawl_source(self, service: CrawlerService, source_name: str, limit: int):
        """Crawl a specific source."""
        try:
            # Try blog crawlers first
            if source_name in BLOG_CRAWLERS:
                crawler = get_crawler(source_name)
                self._crawl_with_crawler(service, crawler, source_name)
                return

            # Try Reddit crawlers
            if source_name in REDDIT_CRAWLERS:
                crawler = get_reddit_crawler(source_name)
                articles = crawler.crawl(limit=limit)
                stats = service.process_articles(
                    articles,
                    crawler.source_name,
                    crawler.source_url,
                    self._get_default_category(source_name),
                )
                self._print_stats(source_name, stats)
                return

            # Source not found
            self.stdout.write(
                self.style.ERROR(f"Unknown source: {source_name}")
            )
            self.stdout.write("Available sources:")
            for name in list(BLOG_CRAWLERS.keys()) + list(REDDIT_CRAWLERS.keys()):
                self.stdout.write(f"  - {name}")

        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f"Error crawling {source_name}: {e}")
            )

    def _crawl_all_blogs(self, service: CrawlerService):
        """Crawl all blog sources."""
        self.stdout.write(self.style.SUCCESS("Crawling blog sources..."))

        for crawler_name, crawler_class in BLOG_CRAWLERS.items():
            try:
                crawler = crawler_class()
                self._crawl_with_crawler(service, crawler, crawler_name)
            except Exception as e:
                self.stdout.write(
                    self.style.ERROR(f"Error crawling {crawler_name}: {e}")
                )

    def _crawl_all_reddit(self, service: CrawlerService, limit: int):
        """Crawl all Reddit sources."""
        self.stdout.write(self.style.SUCCESS("Crawling Reddit sources..."))

        for crawler_name, crawler_class in REDDIT_CRAWLERS.items():
            try:
                crawler = crawler_class()
                articles = crawler.crawl(limit=limit)
                stats = service.process_articles(
                    articles,
                    crawler.source_name,
                    crawler.source_url,
                    self._get_default_category(crawler_name),
                )
                self._print_stats(crawler_name, stats)
            except Exception as e:
                self.stdout.write(
                    self.style.ERROR(f"Error crawling {crawler_name}: {e}")
                )

    def _crawl_with_crawler(self, service: CrawlerService, crawler, source_name: str):
        """Crawl with a specific crawler instance."""
        articles = crawler.crawl()
        stats = service.process_articles(
            articles,
            crawler.source_name,
            crawler.source_url,
            self._get_default_category(source_name),
        )
        self._print_stats(source_name, stats)

    def _get_default_category(self, source_name: str) -> str:
        """Get default category slug for a source."""
        category_map = {
            "android": "android",
            "ios": "ios",
            "react-native": "react-native",
            "flutter": "flutter",
            "kotlin": "android",
            "swift": "ios",
            "reddit-androiddev": "android",
            "reddit-iosprogramming": "ios",
            "reddit-reactnative": "react-native",
            "reddit-flutterdev": "flutter",
        }
        return category_map.get(source_name, "cross-platform")

    def _print_stats(self, source_name: str, stats: dict):
        """Print crawling statistics."""
        self.stdout.write(
            f"  {source_name}: "
            f"{stats['created']} created, "
            f"{stats['skipped']} skipped, "
            f"{stats['errors']} errors "
            f"(total: {stats['total']})"
        )
