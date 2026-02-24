from django.contrib import admin
from django.db.models import Count
from django.utils.html import format_html

from .models import Category, Source, Tag, Article, Like, Comment, SavedArticle


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ("name", "slug", "article_count", "created_at")
    search_fields = ("name",)
    prepopulated_fields = {"slug": ("name",)}
    readonly_fields = ("created_at", "updated_at")

    def get_queryset(self, request):
        return super().get_queryset(request).annotate(_article_count=Count("articles"))

    def article_count(self, obj):
        return obj._article_count
    article_count.short_description = "Articles"
    article_count.admin_order_field = "_article_count"


@admin.register(Source)
class SourceAdmin(admin.ModelAdmin):
    list_display = ("name", "source_type", "category", "is_active", "article_count", "last_crawled_at")
    list_filter = ("source_type", "is_active", "category")
    search_fields = ("name", "url")
    readonly_fields = ("last_crawled_at", "created_at", "updated_at")
    list_editable = ("is_active",)

    fieldsets = (
        (None, {"fields": ("name", "url", "rss_url")}),
        ("Classification", {"fields": ("source_type", "category")}),
        ("Status", {"fields": ("is_active", "last_crawled_at")}),
        ("Timestamps", {"fields": ("created_at", "updated_at")}),
    )

    def get_queryset(self, request):
        return super().get_queryset(request).select_related("category").annotate(_article_count=Count("articles"))

    def article_count(self, obj):
        return obj._article_count
    article_count.short_description = "Articles"
    article_count.admin_order_field = "_article_count"

    actions = ["activate_sources", "deactivate_sources"]

    @admin.action(description="Activate selected sources")
    def activate_sources(self, request, queryset):
        count = queryset.update(is_active=True)
        self.message_user(request, f"{count} source(s) activated.")

    @admin.action(description="Deactivate selected sources")
    def deactivate_sources(self, request, queryset):
        count = queryset.update(is_active=False)
        self.message_user(request, f"{count} source(s) deactivated.")


@admin.register(Tag)
class TagAdmin(admin.ModelAdmin):
    list_display = ("name", "slug")
    search_fields = ("name",)
    prepopulated_fields = {"slug": ("name",)}


class CommentInline(admin.TabularInline):
    model = Comment
    extra = 0
    readonly_fields = ("user", "body", "created_at")
    can_delete = True


class LikeInline(admin.TabularInline):
    model = Like
    extra = 0
    readonly_fields = ("user", "created_at")
    can_delete = True


@admin.register(Article)
class ArticleAdmin(admin.ModelAdmin):
    list_display = (
        "title_short",
        "source",
        "category",
        "like_count",
        "comment_count",
        "published_at",
    )
    list_filter = ("category", "source", "published_at")
    search_fields = ("title", "summary", "content")
    readonly_fields = ("like_count", "comment_count", "created_at", "updated_at")
    filter_horizontal = ("tags",)
    date_hierarchy = "published_at"
    ordering = ("-published_at",)

    fieldsets = (
        (None, {"fields": ("title", "original_url", "thumbnail_url")}),
        ("Content", {"fields": ("summary", "content")}),
        ("Classification", {"fields": ("category", "source", "tags")}),
        ("Engagement", {"fields": ("like_count", "comment_count")}),
        ("Dates", {"fields": ("published_at", "created_at", "updated_at")}),
    )

    inlines = [CommentInline, LikeInline]

    def get_queryset(self, request):
        return super().get_queryset(request).select_related("source", "category")

    def title_short(self, obj):
        return obj.title[:80] + "..." if len(obj.title) > 80 else obj.title
    title_short.short_description = "Title"

    def original_url_link(self, obj):
        return format_html('<a href="{}" target="_blank">{}</a>', obj.original_url, obj.original_url[:60])
    original_url_link.short_description = "Original URL"

    actions = ["delete_with_relations"]

    @admin.action(description="Delete selected articles and their likes/comments/saves")
    def delete_with_relations(self, request, queryset):
        count = queryset.count()
        queryset.delete()
        self.message_user(request, f"{count} article(s) and their related data deleted.")


@admin.register(Like)
class LikeAdmin(admin.ModelAdmin):
    list_display = ("user", "article_title", "created_at")
    list_filter = ("created_at",)
    search_fields = ("user__email", "article__title")
    readonly_fields = ("created_at",)

    def get_queryset(self, request):
        return super().get_queryset(request).select_related("user", "article")

    def article_title(self, obj):
        return obj.article.title[:60]
    article_title.short_description = "Article"


@admin.register(Comment)
class CommentAdmin(admin.ModelAdmin):
    list_display = ("user", "article_title", "body_short", "created_at")
    list_filter = ("created_at",)
    search_fields = ("user__email", "body", "article__title")
    readonly_fields = ("created_at", "updated_at")

    def get_queryset(self, request):
        return super().get_queryset(request).select_related("user", "article")

    def article_title(self, obj):
        return obj.article.title[:60]
    article_title.short_description = "Article"

    def body_short(self, obj):
        return obj.body[:100] + "..." if len(obj.body) > 100 else obj.body
    body_short.short_description = "Comment"


@admin.register(SavedArticle)
class SavedArticleAdmin(admin.ModelAdmin):
    list_display = ("user", "article_title", "created_at")
    list_filter = ("created_at",)
    search_fields = ("user__email", "article__title")
    readonly_fields = ("created_at",)

    def get_queryset(self, request):
        return super().get_queryset(request).select_related("user", "article")

    def article_title(self, obj):
        return obj.article.title[:60]
    article_title.short_description = "Article"
