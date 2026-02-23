import pytest
from datetime import datetime, timezone
from django.contrib.auth import get_user_model
from rest_framework import status

from news.models import Article, Category, Comment, Like, SavedArticle, Source

User = get_user_model()


@pytest.mark.django_db
class TestCategoryAPI:
    """Tests for category endpoints."""

    def test_list_categories(self, api_client, category):
        """Test listing all categories."""
        # Create additional categories
        Category.objects.create(name="iOS", slug="ios")
        Category.objects.create(name="Flutter", slug="flutter")

        response = api_client.get("/api/v1/categories")

        assert response.status_code == status.HTTP_200_OK
        assert len(response.data["results"]) == 3
        assert "article_count" in response.data["results"][0]

    def test_list_categories_no_pagination(self, api_client, category):
        """Test that categories list has no pagination."""
        response = api_client.get("/api/v1/categories")

        assert response.status_code == status.HTTP_200_OK
        assert "next" not in response.data
        assert "previous" not in response.data


@pytest.mark.django_db
class TestSourceAPI:
    """Tests for source endpoints."""

    def test_list_sources(self, api_client, source, category):
        """Test listing all sources."""
        # Create additional source
        Source.objects.create(
            name="iOS Developer Blog",
            url="https://developer.apple.com/news/",
            source_type=Source.SourceType.BLOG,
            category=category,
        )

        response = api_client.get("/api/v1/sources")

        assert response.status_code == status.HTTP_200_OK
        assert len(response.data["results"]) >= 2
        assert "article_count" in response.data["results"][0]
        assert "category" in response.data["results"][0]


@pytest.mark.django_db
class TestArticleListAPI:
    """Tests for article list endpoint."""

    def test_list_articles(self, api_client, article):
        """Test listing articles."""
        response = api_client.get("/api/v1/articles")

        assert response.status_code == status.HTTP_200_OK
        assert response.data["count"] == 1
        assert len(response.data["results"]) == 1
        assert response.data["results"][0]["title"] == article.title

    def test_list_articles_pagination(self, api_client, category, source):
        """Test article list pagination."""
        # Create 25 articles
        for i in range(25):
            Article.objects.create(
                title=f"Article {i}",
                original_url=f"https://example.com/article-{i}",
                category=category,
                source=source,
                published_at=datetime.now(timezone.utc),
            )

        response = api_client.get("/api/v1/articles?page_size=20")

        assert response.status_code == status.HTTP_200_OK
        assert response.data["count"] == 25
        assert len(response.data["results"]) == 20
        assert response.data["next"] is not None

    def test_list_articles_filter_by_category(self, api_client, article, category):
        """Test filtering articles by category."""
        # Create another category and article
        other_category = Category.objects.create(name="iOS", slug="ios")
        other_source = Source.objects.create(
            name="iOS Blog",
            url="https://ios.example.com",
            source_type=Source.SourceType.BLOG,
            category=other_category,
        )
        Article.objects.create(
            title="iOS Article",
            original_url="https://example.com/ios",
            category=other_category,
            source=other_source,
            published_at=datetime.now(timezone.utc),
        )

        response = api_client.get(f"/api/v1/articles?category={category.id}")

        assert response.status_code == status.HTTP_200_OK
        assert response.data["count"] == 1
        assert response.data["results"][0]["category"]["id"] == category.id

    def test_list_articles_filter_by_source(self, api_client, article, source):
        """Test filtering articles by source."""
        response = api_client.get(f"/api/v1/articles?source={source.id}")

        assert response.status_code == status.HTTP_200_OK
        assert all(a["source"]["id"] == source.id for a in response.data["results"])

    def test_list_articles_ordering(self, api_client, category, source):
        """Test article ordering options."""
        # Create articles with different metrics
        article1 = Article.objects.create(
            title="Popular",
            original_url="https://example.com/popular",
            category=category,
            source=source,
            published_at=datetime(2026, 1, 1, tzinfo=timezone.utc),
            like_count=100,
        )
        article2 = Article.objects.create(
            title="Recent",
            original_url="https://example.com/recent",
            category=category,
            source=source,
            published_at=datetime(2026, 2, 24, tzinfo=timezone.utc),
            like_count=10,
        )

        # Test ordering by like_count
        response = api_client.get("/api/v1/articles?ordering=-like_count")
        assert response.data["results"][0]["id"] == article1.id

        # Test ordering by published_at (default)
        response = api_client.get("/api/v1/articles?ordering=-published_at")
        assert response.data["results"][0]["id"] == article2.id

    def test_list_articles_authenticated_shows_user_state(
        self, authenticated_client, user, article
    ):
        """Test that authenticated requests show is_liked and is_saved."""
        Like.objects.create(user=user, article=article)

        response = authenticated_client.get("/api/v1/articles")

        assert response.status_code == status.HTTP_200_OK
        assert response.data["results"][0]["is_liked"] is True
        assert response.data["results"][0]["is_saved"] is False


@pytest.mark.django_db
class TestArticleDetailAPI:
    """Tests for article detail endpoint."""

    def test_get_article_detail(self, api_client, article, tag):
        """Test getting article detail."""
        article.tags.add(tag)

        response = api_client.get(f"/api/v1/articles/{article.id}")

        assert response.status_code == status.HTTP_200_OK
        assert response.data["title"] == article.title
        assert response.data["content"] == article.content
        assert "source" in response.data
        assert "category" in response.data
        assert "tags" in response.data
        assert tag.name in response.data["tags"]

    def test_get_article_not_found(self, api_client):
        """Test getting non-existent article."""
        response = api_client.get("/api/v1/articles/99999")

        assert response.status_code == status.HTTP_404_NOT_FOUND

    def test_get_article_authenticated_shows_user_state(
        self, authenticated_client, user, article
    ):
        """Test that authenticated requests show user's like/save state."""
        SavedArticle.objects.create(user=user, article=article)

        response = authenticated_client.get(f"/api/v1/articles/{article.id}")

        assert response.status_code == status.HTTP_200_OK
        assert response.data["is_liked"] is False
        assert response.data["is_saved"] is True


@pytest.mark.django_db
class TestArticleTrendingAPI:
    """Tests for trending articles endpoint."""

    def test_get_trending_articles(self, api_client, category, source):
        """Test getting trending articles."""
        # Create articles with different like counts
        for i in range(5):
            Article.objects.create(
                title=f"Article {i}",
                original_url=f"https://example.com/{i}",
                category=category,
                source=source,
                published_at=datetime.now(timezone.utc),
                like_count=i * 10,
            )

        response = api_client.get("/api/v1/articles/trending")

        assert response.status_code == status.HTTP_200_OK
        # Should be ordered by like_count descending
        results = response.data["results"]
        if len(results) >= 2:
            assert results[0]["like_count"] >= results[1]["like_count"]


@pytest.mark.django_db
class TestArticleSearchAPI:
    """Tests for article search endpoint."""

    def test_search_articles_by_title(self, api_client, category, source):
        """Test searching articles by title."""
        Article.objects.create(
            title="React Native Performance Tips",
            original_url="https://example.com/rn-perf",
            category=category,
            source=source,
            published_at=datetime.now(timezone.utc),
        )
        Article.objects.create(
            title="Flutter vs React Native",
            original_url="https://example.com/flutter-rn",
            category=category,
            source=source,
            published_at=datetime.now(timezone.utc),
        )

        response = api_client.get("/api/v1/articles/search?q=React Native")

        assert response.status_code == status.HTTP_200_OK
        assert response.data["count"] == 2

    def test_search_articles_empty_query(self, api_client, article):
        """Test search with empty query."""
        response = api_client.get("/api/v1/articles/search?q=")

        assert response.status_code == status.HTTP_200_OK

    def test_search_articles_no_results(self, api_client):
        """Test search with no matching results."""
        response = api_client.get("/api/v1/articles/search?q=nonexistent")

        assert response.status_code == status.HTTP_200_OK
        assert response.data["count"] == 0

    def test_search_articles_filter_by_category(self, api_client, category, source):
        """Test search with category filter."""
        Article.objects.create(
            title="Android Testing",
            original_url="https://example.com/android-test",
            category=category,
            source=source,
            published_at=datetime.now(timezone.utc),
        )

        response = api_client.get(f"/api/v1/articles/search?q=Testing&category={category.id}")

        assert response.status_code == status.HTTP_200_OK
        assert response.data["count"] == 1


@pytest.mark.django_db
class TestLikeAPI:
    """Tests for like endpoints."""

    def test_like_article_success(self, authenticated_client, article):
        """Test liking an article."""
        response = authenticated_client.post(f"/api/v1/articles/{article.id}/like")

        assert response.status_code == status.HTTP_201_CREATED
        assert response.data["article_id"] == article.id
        assert response.data["like_count"] == 1

        article.refresh_from_db()
        assert article.like_count == 1

    def test_like_article_unauthenticated(self, api_client, article):
        """Test liking without authentication."""
        response = api_client.post(f"/api/v1/articles/{article.id}/like")

        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_like_article_twice(self, authenticated_client, user, article):
        """Test liking the same article twice."""
        authenticated_client.post(f"/api/v1/articles/{article.id}/like")
        response = authenticated_client.post(f"/api/v1/articles/{article.id}/like")

        assert response.status_code == status.HTTP_200_OK
        # Like count should not increase
        article.refresh_from_db()
        assert article.like_count == 1

    def test_unlike_article_success(self, authenticated_client, user, article):
        """Test unliking an article."""
        Like.objects.create(user=user, article=article)
        article.like_count = 1
        article.save()

        response = authenticated_client.delete(f"/api/v1/articles/{article.id}/like")

        assert response.status_code == status.HTTP_204_NO_CONTENT

        article.refresh_from_db()
        assert article.like_count == 0

    def test_unlike_article_not_liked(self, authenticated_client, article):
        """Test unliking an article that was not liked."""
        response = authenticated_client.delete(f"/api/v1/articles/{article.id}/like")

        assert response.status_code == status.HTTP_204_NO_CONTENT


@pytest.mark.django_db
class TestCommentAPI:
    """Tests for comment endpoints."""

    def test_list_comments(self, api_client, user, article):
        """Test listing comments on an article."""
        Comment.objects.create(user=user, article=article, body="Great article!")
        Comment.objects.create(user=user, article=article, body="Very helpful!")

        response = api_client.get(f"/api/v1/articles/{article.id}/comments")

        assert response.status_code == status.HTTP_200_OK
        assert response.data["count"] == 2

    def test_create_comment_success(self, authenticated_client, user, article):
        """Test creating a comment."""
        data = {"body": "Great article!"}
        response = authenticated_client.post(f"/api/v1/articles/{article.id}/comments", data)

        assert response.status_code == status.HTTP_201_CREATED
        assert response.data["body"] == "Great article!"
        assert response.data["user"]["username"] == user.username

        article.refresh_from_db()
        assert article.comment_count == 1

    def test_create_comment_unauthenticated(self, api_client, article):
        """Test creating comment without authentication."""
        data = {"body": "Great article!"}
        response = api_client.post(f"/api/v1/articles/{article.id}/comments", data)

        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_create_comment_empty_body(self, authenticated_client, article):
        """Test creating comment with empty body."""
        data = {"body": ""}
        response = authenticated_client.post(f"/api/v1/articles/{article.id}/comments", data)

        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_create_comment_article_not_found(self, authenticated_client):
        """Test creating comment on non-existent article."""
        data = {"body": "Test"}
        response = authenticated_client.post("/api/v1/articles/99999/comments", data)

        assert response.status_code == status.HTTP_404_NOT_FOUND

    def test_update_comment_success(self, authenticated_client, user, article):
        """Test updating own comment."""
        comment = Comment.objects.create(user=user, article=article, body="Original")

        data = {"body": "Updated comment"}
        response = authenticated_client.patch(f"/api/v1/comments/{comment.id}", data)

        assert response.status_code == status.HTTP_200_OK
        assert response.data["body"] == "Updated comment"

    def test_update_other_user_comment(self, api_client, article):
        """Test updating another user's comment."""
        other_user = User.objects.create_user(
            email="other@example.com",
            username="other",
            password="pass123",
        )
        comment = Comment.objects.create(user=other_user, article=article, body="Test")

        # Authenticate as different user
        current_user = User.objects.create_user(
            email="current@example.com",
            username="current",
            password="pass123",
        )
        from rest_framework_simplejwt.tokens import RefreshToken

        refresh = RefreshToken.for_user(current_user)
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {refresh.access_token}")

        data = {"body": "Hacked"}
        response = api_client.patch(f"/api/v1/comments/{comment.id}", data)

        assert response.status_code == status.HTTP_404_NOT_FOUND

    def test_delete_comment_success(self, authenticated_client, user, article):
        """Test deleting own comment."""
        comment = Comment.objects.create(user=user, article=article, body="Test")
        article.comment_count = 1
        article.save()

        response = authenticated_client.delete(f"/api/v1/comments/{comment.id}")

        assert response.status_code == status.HTTP_204_NO_CONTENT
        assert not Comment.objects.filter(id=comment.id).exists()

        article.refresh_from_db()
        assert article.comment_count == 0


@pytest.mark.django_db
class TestSavedArticleAPI:
    """Tests for saved article endpoints."""

    def test_list_saved_articles(self, authenticated_client, user, article):
        """Test listing saved articles."""
        SavedArticle.objects.create(user=user, article=article)

        response = authenticated_client.get("/api/v1/users/me/saved")

        assert response.status_code == status.HTTP_200_OK
        assert response.data["count"] == 1
        assert response.data["results"][0]["id"] == article.id

    def test_list_saved_articles_unauthenticated(self, api_client):
        """Test listing saved articles without authentication."""
        response = api_client.get("/api/v1/users/me/saved")

        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_save_article_success(self, authenticated_client, article):
        """Test saving an article."""
        response = authenticated_client.post(f"/api/v1/articles/{article.id}/save")

        assert response.status_code == status.HTTP_201_CREATED
        assert SavedArticle.objects.filter(article=article).exists()

    def test_save_article_unauthenticated(self, api_client, article):
        """Test saving article without authentication."""
        response = api_client.post(f"/api/v1/articles/{article.id}/save")

        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_save_article_twice(self, authenticated_client, user, article):
        """Test saving the same article twice."""
        authenticated_client.post(f"/api/v1/articles/{article.id}/save")
        response = authenticated_client.post(f"/api/v1/articles/{article.id}/save")

        assert response.status_code == status.HTTP_201_CREATED
        # Should only have one saved article record
        assert SavedArticle.objects.filter(user=user, article=article).count() == 1

    def test_unsave_article_success(self, authenticated_client, user, article):
        """Test unsaving an article."""
        SavedArticle.objects.create(user=user, article=article)

        response = authenticated_client.delete(f"/api/v1/articles/{article.id}/save")

        assert response.status_code == status.HTTP_204_NO_CONTENT
        assert not SavedArticle.objects.filter(user=user, article=article).exists()

    def test_unsave_article_not_saved(self, authenticated_client, article):
        """Test unsaving an article that was not saved."""
        response = authenticated_client.delete(f"/api/v1/articles/{article.id}/save")

        assert response.status_code == status.HTTP_204_NO_CONTENT
