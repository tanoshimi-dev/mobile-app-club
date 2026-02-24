"""
Custom Admin Site with role-based access and dashboard stats.
"""
from django.contrib.admin import AdminSite
from django.db.models import Count, Q
from django.utils import timezone


class MobileDevNewsAdminSite(AdminSite):
    site_header = "Mobile Dev News Admin"
    site_title = "MDN Admin"
    index_title = "Dashboard"

    def has_permission(self, request):
        """Only allow users with admin role (or superusers) to access the admin."""
        if not super().has_permission(request):
            return False
        return request.user.is_superuser or getattr(request.user, "role", "") == "admin"

    def index(self, request, extra_context=None):
        """Override index to inject dashboard statistics."""
        extra_context = extra_context or {}

        from users.models import User, Device
        from news.models import Category, Source, Article, Like, Comment, SavedArticle
        from crawler.models import CrawlLog

        now = timezone.now()
        last_24h = now - timezone.timedelta(hours=24)
        last_7d = now - timezone.timedelta(days=7)
        last_30d = now - timezone.timedelta(days=30)

        # --- User stats ---
        total_users = User.objects.count()
        new_users_24h = User.objects.filter(date_joined__gte=last_24h).count()
        new_users_7d = User.objects.filter(date_joined__gte=last_7d).count()
        admin_users = User.objects.filter(role="admin").count()

        # --- Article stats ---
        total_articles = Article.objects.count()
        articles_24h = Article.objects.filter(created_at__gte=last_24h).count()
        articles_7d = Article.objects.filter(created_at__gte=last_7d).count()

        # --- Engagement stats ---
        total_likes = Like.objects.count()
        likes_24h = Like.objects.filter(created_at__gte=last_24h).count()
        total_comments = Comment.objects.count()
        comments_24h = Comment.objects.filter(created_at__gte=last_24h).count()
        total_saves = SavedArticle.objects.count()

        # --- Source stats ---
        total_sources = Source.objects.count()
        active_sources = Source.objects.filter(is_active=True).count()
        inactive_sources = total_sources - active_sources

        # --- Category stats ---
        total_categories = Category.objects.count()
        categories_with_counts = (
            Category.objects.annotate(num_articles=Count("articles"))
            .order_by("-num_articles")[:10]
        )

        # --- Crawler stats ---
        recent_crawls = CrawlLog.objects.filter(started_at__gte=last_24h)
        crawl_success = recent_crawls.filter(status="success").count()
        crawl_failed = recent_crawls.filter(status="failed").count()
        articles_crawled_24h = (
            recent_crawls.filter(status="success")
            .aggregate(total=Count("articles_found"))["total"]
            or 0
        )
        last_crawl = CrawlLog.objects.order_by("-started_at").first()

        # --- Top articles (last 7 days) ---
        top_articles = (
            Article.objects.filter(published_at__gte=last_7d)
            .order_by("-like_count")[:5]
        )

        # --- Top sources by article count ---
        top_sources = (
            Source.objects.filter(is_active=True)
            .annotate(num_articles=Count("articles"))
            .order_by("-num_articles")[:5]
        )

        extra_context.update({
            # Users
            "total_users": total_users,
            "new_users_24h": new_users_24h,
            "new_users_7d": new_users_7d,
            "admin_users": admin_users,
            # Articles
            "total_articles": total_articles,
            "articles_24h": articles_24h,
            "articles_7d": articles_7d,
            # Engagement
            "total_likes": total_likes,
            "likes_24h": likes_24h,
            "total_comments": total_comments,
            "comments_24h": comments_24h,
            "total_saves": total_saves,
            # Sources
            "total_sources": total_sources,
            "active_sources": active_sources,
            "inactive_sources": inactive_sources,
            # Categories
            "total_categories": total_categories,
            "categories_with_counts": categories_with_counts,
            # Crawler
            "crawl_success": crawl_success,
            "crawl_failed": crawl_failed,
            "articles_crawled_24h": articles_crawled_24h,
            "last_crawl": last_crawl,
            # Top content
            "top_articles": top_articles,
            "top_sources": top_sources,
        })

        return super().index(request, extra_context=extra_context)


admin_site = MobileDevNewsAdminSite(name="mdn_admin")
