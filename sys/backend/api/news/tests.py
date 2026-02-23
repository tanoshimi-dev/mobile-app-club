import pytest
from datetime import datetime, timezone
from django.contrib.auth import get_user_model
from django.db import IntegrityError

from news.models import Article, Category, Comment, Like, SavedArticle, Source, Tag

User = get_user_model()


@pytest.mark.django_db
class TestCategoryModel:
    """Tests for the Category model."""

    def test_create_category(self):
        """Test creating a category."""
        category = Category.objects.create(
            name="Android",
            slug="android",
            description="Android development news",
        )
        assert category.name == "Android"
        assert category.slug == "android"
        assert category.description == "Android development news"

    def test_category_name_unique(self):
        """Test that category name must be unique."""
        Category.objects.create(name="Android", slug="android")
        with pytest.raises(IntegrityError):
            Category.objects.create(name="Android", slug="android-2")

    def test_category_slug_unique(self):
        """Test that category slug must be unique."""
        Category.objects.create(name="Android", slug="android")
        with pytest.raises(IntegrityError):
            Category.objects.create(name="Android 2", slug="android")

    def test_category_str_representation(self):
        """Test category string representation."""
        category = Category.objects.create(name="Android", slug="android")
        assert str(category) == "Android"

    def test_category_description_optional(self):
        """Test that description is optional."""
        category = Category.objects.create(name="Android", slug="android")
        assert category.description == ""


@pytest.mark.django_db
class TestSourceModel:
    """Tests for the Source model."""

    def test_create_source(self, category):
        """Test creating a news source."""
        source = Source.objects.create(
            name="Android Developers Blog",
            url="https://android-developers.googleblog.com",
            rss_url="https://android-developers.googleblog.com/feeds/posts/default",
            source_type=Source.SourceType.BLOG,
            category=category,
        )
        assert source.name == "Android Developers Blog"
        assert source.url == "https://android-developers.googleblog.com"
        assert source.source_type == Source.SourceType.BLOG
        assert source.category == category
        assert source.is_active is True

    def test_source_url_unique(self, category):
        """Test that source URL must be unique."""
        Source.objects.create(
            name="Source 1",
            url="https://example.com",
            source_type=Source.SourceType.BLOG,
            category=category,
        )
        with pytest.raises(IntegrityError):
            Source.objects.create(
                name="Source 2",
                url="https://example.com",
                source_type=Source.SourceType.BLOG,
                category=category,
            )

    def test_source_str_representation(self, category):
        """Test source string representation."""
        source = Source.objects.create(
            name="Android Blog",
            url="https://example.com",
            source_type=Source.SourceType.BLOG,
            category=category,
        )
        assert str(source) == "Android Blog"

    def test_source_delete_cascade_category(self):
        """Test that sources are deleted when category is deleted."""
        category = Category.objects.create(name="Test", slug="test")
        source = Source.objects.create(
            name="Test Source",
            url="https://example.com",
            source_type=Source.SourceType.BLOG,
            category=category,
        )
        source_id = source.id
        category.delete()
        assert not Source.objects.filter(id=source_id).exists()

    def test_source_type_choices(self, category):
        """Test all source type choices."""
        blog = Source.objects.create(
            name="Blog",
            url="https://blog.example.com",
            source_type=Source.SourceType.BLOG,
            category=category,
        )
        reddit = Source.objects.create(
            name="Reddit",
            url="https://reddit.com/r/example",
            source_type=Source.SourceType.REDDIT,
            category=category,
        )
        forum = Source.objects.create(
            name="Forum",
            url="https://forum.example.com",
            source_type=Source.SourceType.FORUM,
            category=category,
        )

        assert blog.source_type == "blog"
        assert reddit.source_type == "reddit"
        assert forum.source_type == "forum"


@pytest.mark.django_db
class TestTagModel:
    """Tests for the Tag model."""

    def test_create_tag(self):
        """Test creating a tag."""
        tag = Tag.objects.create(name="Kotlin", slug="kotlin")
        assert tag.name == "Kotlin"
        assert tag.slug == "kotlin"

    def test_tag_name_unique(self):
        """Test that tag name must be unique."""
        Tag.objects.create(name="Kotlin", slug="kotlin")
        with pytest.raises(IntegrityError):
            Tag.objects.create(name="Kotlin", slug="kotlin-2")

    def test_tag_slug_unique(self):
        """Test that tag slug must be unique."""
        Tag.objects.create(name="Kotlin", slug="kotlin")
        with pytest.raises(IntegrityError):
            Tag.objects.create(name="Kotlin 2", slug="kotlin")

    def test_tag_str_representation(self):
        """Test tag string representation."""
        tag = Tag.objects.create(name="Kotlin", slug="kotlin")
        assert str(tag) == "Kotlin"


@pytest.mark.django_db
class TestArticleModel:
    """Tests for the Article model."""

    def test_create_article(self, category, source):
        """Test creating an article."""
        article = Article.objects.create(
            title="Test Article",
            summary="Summary here",
            content="Full content here",
            original_url="https://example.com/article1",
            thumbnail_url="https://example.com/thumb.jpg",
            category=category,
            source=source,
            published_at=datetime(2026, 2, 24, 12, 0, 0, tzinfo=timezone.utc),
        )
        assert article.title == "Test Article"
        assert article.category == category
        assert article.source == source
        assert article.like_count == 0
        assert article.comment_count == 0

    def test_article_original_url_unique(self, category, source):
        """Test that article original_url must be unique."""
        Article.objects.create(
            title="Article 1",
            original_url="https://example.com/article",
            category=category,
            source=source,
            published_at=datetime.now(timezone.utc),
        )
        with pytest.raises(IntegrityError):
            Article.objects.create(
                title="Article 2",
                original_url="https://example.com/article",
                category=category,
                source=source,
                published_at=datetime.now(timezone.utc),
            )

    def test_article_str_representation(self, category, source):
        """Test article string representation."""
        article = Article.objects.create(
            title="Test Article",
            original_url="https://example.com/article",
            category=category,
            source=source,
            published_at=datetime.now(timezone.utc),
        )
        assert str(article) == "Test Article"

    def test_article_many_to_many_tags(self, article, tag):
        """Test adding tags to an article."""
        tag2 = Tag.objects.create(name="Android", slug="android")
        article.tags.add(tag, tag2)

        assert article.tags.count() == 2
        assert tag in article.tags.all()
        assert tag2 in article.tags.all()

    def test_article_delete_cascade_category(self, source):
        """Test that articles are deleted when category is deleted."""
        category = Category.objects.create(name="Test", slug="test")
        article = Article.objects.create(
            title="Test",
            original_url="https://example.com/test",
            category=category,
            source=source,
            published_at=datetime.now(timezone.utc),
        )
        article_id = article.id
        category.delete()
        assert not Article.objects.filter(id=article_id).exists()

    def test_article_delete_cascade_source(self, category):
        """Test that articles are deleted when source is deleted."""
        source = Source.objects.create(
            name="Test Source",
            url="https://example.com",
            source_type=Source.SourceType.BLOG,
            category=category,
        )
        article = Article.objects.create(
            title="Test",
            original_url="https://example.com/test",
            category=category,
            source=source,
            published_at=datetime.now(timezone.utc),
        )
        article_id = article.id
        source.delete()
        assert not Article.objects.filter(id=article_id).exists()

    def test_article_ordering(self, category, source):
        """Test that articles are ordered by published_at descending."""
        article1 = Article.objects.create(
            title="Old Article",
            original_url="https://example.com/old",
            category=category,
            source=source,
            published_at=datetime(2026, 1, 1, tzinfo=timezone.utc),
        )
        article2 = Article.objects.create(
            title="New Article",
            original_url="https://example.com/new",
            category=category,
            source=source,
            published_at=datetime(2026, 2, 1, tzinfo=timezone.utc),
        )

        articles = list(Article.objects.all())
        assert articles[0] == article2
        assert articles[1] == article1


@pytest.mark.django_db
class TestLikeModel:
    """Tests for the Like model."""

    def test_create_like(self, user, article):
        """Test creating a like."""
        like = Like.objects.create(user=user, article=article)
        assert like.user == user
        assert like.article == article

    def test_like_unique_constraint(self, user, article):
        """Test that a user can only like an article once."""
        Like.objects.create(user=user, article=article)
        with pytest.raises(IntegrityError):
            Like.objects.create(user=user, article=article)

    def test_like_delete_cascade_user(self, article):
        """Test that likes are deleted when user is deleted."""
        user = User.objects.create_user(
            email="test@example.com",
            username="test",
            password="pass123",
        )
        like = Like.objects.create(user=user, article=article)
        like_id = like.id
        user.delete()
        assert not Like.objects.filter(id=like_id).exists()

    def test_like_delete_cascade_article(self, user, category, source):
        """Test that likes are deleted when article is deleted."""
        article = Article.objects.create(
            title="Test",
            original_url="https://example.com/test",
            category=category,
            source=source,
            published_at=datetime.now(timezone.utc),
        )
        like = Like.objects.create(user=user, article=article)
        like_id = like.id
        article.delete()
        assert not Like.objects.filter(id=like_id).exists()


@pytest.mark.django_db
class TestCommentModel:
    """Tests for the Comment model."""

    def test_create_comment(self, user, article):
        """Test creating a comment."""
        comment = Comment.objects.create(
            user=user,
            article=article,
            body="Great article!",
        )
        assert comment.user == user
        assert comment.article == article
        assert comment.body == "Great article!"

    def test_comment_delete_cascade_user(self, article):
        """Test that comments are deleted when user is deleted."""
        user = User.objects.create_user(
            email="test@example.com",
            username="test",
            password="pass123",
        )
        comment = Comment.objects.create(user=user, article=article, body="Test")
        comment_id = comment.id
        user.delete()
        assert not Comment.objects.filter(id=comment_id).exists()

    def test_comment_delete_cascade_article(self, user, category, source):
        """Test that comments are deleted when article is deleted."""
        article = Article.objects.create(
            title="Test",
            original_url="https://example.com/test",
            category=category,
            source=source,
            published_at=datetime.now(timezone.utc),
        )
        comment = Comment.objects.create(user=user, article=article, body="Test")
        comment_id = comment.id
        article.delete()
        assert not Comment.objects.filter(id=comment_id).exists()

    def test_comment_ordering(self, user, article):
        """Test that comments are ordered by created_at ascending."""
        comment1 = Comment.objects.create(user=user, article=article, body="First")
        comment2 = Comment.objects.create(user=user, article=article, body="Second")

        comments = list(Comment.objects.all())
        assert comments[0] == comment1
        assert comments[1] == comment2


@pytest.mark.django_db
class TestSavedArticleModel:
    """Tests for the SavedArticle model."""

    def test_create_saved_article(self, user, article):
        """Test saving an article."""
        saved = SavedArticle.objects.create(user=user, article=article)
        assert saved.user == user
        assert saved.article == article

    def test_saved_article_unique_constraint(self, user, article):
        """Test that a user can only save an article once."""
        SavedArticle.objects.create(user=user, article=article)
        with pytest.raises(IntegrityError):
            SavedArticle.objects.create(user=user, article=article)

    def test_saved_article_delete_cascade_user(self, article):
        """Test that saved articles are deleted when user is deleted."""
        user = User.objects.create_user(
            email="test@example.com",
            username="test",
            password="pass123",
        )
        saved = SavedArticle.objects.create(user=user, article=article)
        saved_id = saved.id
        user.delete()
        assert not SavedArticle.objects.filter(id=saved_id).exists()

    def test_saved_article_delete_cascade_article(self, user, category, source):
        """Test that saved articles are deleted when article is deleted."""
        article = Article.objects.create(
            title="Test",
            original_url="https://example.com/test",
            category=category,
            source=source,
            published_at=datetime.now(timezone.utc),
        )
        saved = SavedArticle.objects.create(user=user, article=article)
        saved_id = saved.id
        article.delete()
        assert not SavedArticle.objects.filter(id=saved_id).exists()

    def test_saved_article_ordering(self, user, category, source):
        """Test that saved articles are ordered by created_at descending."""
        article1 = Article.objects.create(
            title="Article 1",
            original_url="https://example.com/1",
            category=category,
            source=source,
            published_at=datetime.now(timezone.utc),
        )
        article2 = Article.objects.create(
            title="Article 2",
            original_url="https://example.com/2",
            category=category,
            source=source,
            published_at=datetime.now(timezone.utc),
        )

        saved1 = SavedArticle.objects.create(user=user, article=article1)
        saved2 = SavedArticle.objects.create(user=user, article=article2)

        saved_articles = list(SavedArticle.objects.all())
        assert saved_articles[0] == saved2
        assert saved_articles[1] == saved1
