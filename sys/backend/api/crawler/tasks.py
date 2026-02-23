"""
Celery tasks for scheduled news crawling.
"""
import logging

from celery import shared_task

from .blog_crawlers import get_all_crawlers
from .reddit_crawler import get_all_reddit_crawlers
from .service import CrawlerService

logger = logging.getLogger(__name__)


@shared_task(name="crawler.crawl_all_blogs")
def crawl_all_blogs():
    """
    Celery task to crawl all blog sources.
    """
    logger.info("Starting scheduled blog crawl")
    service = CrawlerService()
    total_stats = {"total": 0, "created": 0, "skipped": 0, "errors": 0}

    # Get all blog crawlers
    crawlers = get_all_crawlers()

    for crawler in crawlers:
        try:
            logger.info(f"Crawling {crawler.source_name}")
            articles = crawler.crawl()

            # Determine default category
            category_map = {
                "Android Developers Blog": "android",
                "Apple Developer News": "ios",
                "React Native Blog": "react-native",
                "Flutter Blog": "flutter",
                "Kotlin Blog": "android",
                "Swift.org Blog": "ios",
            }
            default_category = category_map.get(crawler.source_name, "cross-platform")

            stats = service.process_articles(
                articles,
                crawler.source_name,
                crawler.source_url,
                default_category,
            )

            # Accumulate stats
            for key in total_stats:
                total_stats[key] += stats[key]

        except Exception as e:
            logger.error(f"Error crawling {crawler.source_name}: {e}", exc_info=True)
            total_stats["errors"] += 1

    logger.info(
        f"Blog crawl completed: {total_stats['created']} created, "
        f"{total_stats['skipped']} skipped, {total_stats['errors']} errors"
    )

    return total_stats


@shared_task(name="crawler.crawl_all_reddit")
def crawl_all_reddit(limit=25):
    """
    Celery task to crawl all Reddit sources.

    Args:
        limit: Maximum number of posts to fetch per subreddit
    """
    logger.info(f"Starting scheduled Reddit crawl (limit={limit})")
    service = CrawlerService()
    total_stats = {"total": 0, "created": 0, "skipped": 0, "errors": 0}

    # Get all Reddit crawlers
    crawlers = get_all_reddit_crawlers()

    category_map = {
        "Reddit: r/androiddev": "android",
        "Reddit: r/iOSProgramming": "ios",
        "Reddit: r/reactnative": "react-native",
        "Reddit: r/FlutterDev": "flutter",
    }

    for crawler in crawlers:
        try:
            logger.info(f"Crawling {crawler.source_name}")
            articles = crawler.crawl(limit=limit)
            default_category = category_map.get(
                crawler.source_name, "cross-platform"
            )

            stats = service.process_articles(
                articles,
                crawler.source_name,
                crawler.source_url,
                default_category,
            )

            # Accumulate stats
            for key in total_stats:
                total_stats[key] += stats[key]

        except Exception as e:
            logger.error(f"Error crawling {crawler.source_name}: {e}", exc_info=True)
            total_stats["errors"] += 1

    logger.info(
        f"Reddit crawl completed: {total_stats['created']} created, "
        f"{total_stats['skipped']} skipped, {total_stats['errors']} errors"
    )

    return total_stats


@shared_task(name="crawler.crawl_all_sources")
def crawl_all_sources():
    """
    Celery task to crawl all sources (blogs + Reddit).
    """
    logger.info("Starting scheduled crawl of all sources")

    blog_stats = crawl_all_blogs()
    reddit_stats = crawl_all_reddit()

    total_stats = {
        "total": blog_stats["total"] + reddit_stats["total"],
        "created": blog_stats["created"] + reddit_stats["created"],
        "skipped": blog_stats["skipped"] + reddit_stats["skipped"],
        "errors": blog_stats["errors"] + reddit_stats["errors"],
    }

    logger.info(
        f"All sources crawl completed: {total_stats['created']} created, "
        f"{total_stats['skipped']} skipped, {total_stats['errors']} errors"
    )

    return total_stats
