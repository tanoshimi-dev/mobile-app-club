from django.conf import settings
from django.db import models


class Category(models.Model):
    name = models.CharField(max_length=100, unique=True)
    slug = models.SlugField(max_length=100, unique=True)
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name_plural = "categories"

    def __str__(self):
        return self.name


class Source(models.Model):
    class SourceType(models.TextChoices):
        BLOG = "blog"
        REDDIT = "reddit"
        FORUM = "forum"

    name = models.CharField(max_length=200)
    url = models.URLField(max_length=500, unique=True)
    rss_url = models.URLField(max_length=500, blank=True)
    source_type = models.CharField(max_length=20, choices=SourceType.choices)
    category = models.ForeignKey(Category, on_delete=models.CASCADE, related_name="sources", db_index=True)
    is_active = models.BooleanField(default=True, db_index=True)
    last_crawled_at = models.DateTimeField(null=True, blank=True, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name


class Tag(models.Model):
    name = models.CharField(max_length=100, unique=True)
    slug = models.SlugField(max_length=100, unique=True)

    def __str__(self):
        return self.name


class Article(models.Model):
    title = models.CharField(max_length=500)
    summary = models.TextField(blank=True)
    content = models.TextField(blank=True)
    original_url = models.URLField(max_length=500, unique=True)
    thumbnail_url = models.URLField(max_length=500, blank=True)
    category = models.ForeignKey(Category, on_delete=models.CASCADE, related_name="articles", db_index=True)
    source = models.ForeignKey(Source, on_delete=models.CASCADE, related_name="articles", db_index=True)
    tags = models.ManyToManyField(Tag, blank=True, related_name="articles")
    published_at = models.DateTimeField(db_index=True)
    like_count = models.IntegerField(default=0)
    comment_count = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-published_at"]
        indexes = [
            models.Index(fields=["-published_at"]),
            models.Index(fields=["-like_count"]),
        ]

    def __str__(self):
        return self.title


class Like(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="likes", db_index=True)
    article = models.ForeignKey(Article, on_delete=models.CASCADE, related_name="likes", db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=["user", "article"], name="unique_like"),
        ]


class Comment(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="comments", db_index=True)
    article = models.ForeignKey(Article, on_delete=models.CASCADE, related_name="comments", db_index=True)
    body = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["created_at"]


class SavedArticle(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="saved_articles", db_index=True)
    article = models.ForeignKey(Article, on_delete=models.CASCADE, related_name="saved_by", db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=["user", "article"], name="unique_saved"),
        ]
        ordering = ["-created_at"]
