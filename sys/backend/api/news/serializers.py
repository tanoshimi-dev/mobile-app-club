from rest_framework import serializers

from .models import Article, Category, Comment, Source, Tag


class CategorySerializer(serializers.ModelSerializer):
    article_count = serializers.IntegerField(read_only=True, default=0)

    class Meta:
        model = Category
        fields = ["id", "name", "slug", "article_count"]


class SourceSerializer(serializers.ModelSerializer):
    category = CategorySerializer(read_only=True)
    article_count = serializers.IntegerField(read_only=True, default=0)

    class Meta:
        model = Source
        fields = ["id", "name", "url", "category", "article_count"]


class TagSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tag
        fields = ["name", "slug"]


class ArticleListSerializer(serializers.ModelSerializer):
    source = SourceSerializer(read_only=True)
    category = CategorySerializer(read_only=True)
    is_liked = serializers.BooleanField(read_only=True, default=False)
    is_saved = serializers.BooleanField(read_only=True, default=False)

    class Meta:
        model = Article
        fields = [
            "id", "title", "summary", "thumbnail_url",
            "source", "category", "published_at",
            "like_count", "comment_count", "is_liked", "is_saved",
        ]


class ArticleDetailSerializer(ArticleListSerializer):
    tags = TagSerializer(many=True, read_only=True)

    class Meta(ArticleListSerializer.Meta):
        fields = ArticleListSerializer.Meta.fields + [
            "content", "original_url", "tags",
        ]


class CommentSerializer(serializers.ModelSerializer):
    user = serializers.SerializerMethodField()

    class Meta:
        model = Comment
        fields = ["id", "user", "body", "created_at", "updated_at"]
        read_only_fields = ["id", "user", "created_at", "updated_at"]

    def get_user(self, obj):
        return {
            "id": obj.user.id,
            "username": obj.user.username,
            "avatar_url": obj.user.avatar_url,
        }
