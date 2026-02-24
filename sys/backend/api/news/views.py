from django.db.models import Count, Exists, F, OuterRef
from django.utils.decorators import method_decorator
from django.views.decorators.cache import cache_page
from rest_framework import generics, permissions, status
from rest_framework.response import Response

from .models import Article, Category, Comment, Like, SavedArticle, Source
from .serializers import (
    ArticleDetailSerializer,
    ArticleListSerializer,
    CategorySerializer,
    CommentSerializer,
    SourceSerializer,
)


class _AnnotateUserMixin:
    """Annotate articles with is_liked / is_saved for the current user."""

    def get_queryset(self):
        qs = super().get_queryset()
        user = self.request.user
        if user.is_authenticated:
            qs = qs.annotate(
                is_liked=Exists(Like.objects.filter(user=user, article=OuterRef("pk"))),
                is_saved=Exists(SavedArticle.objects.filter(user=user, article=OuterRef("pk"))),
            )
        return qs


# --- Categories ---


class CategoryListView(generics.ListAPIView):
    serializer_class = CategorySerializer
    permission_classes = [permissions.AllowAny]
    pagination_class = None

    def get_queryset(self):
        return Category.objects.annotate(article_count=Count("articles"))

    @method_decorator(cache_page(60 * 5))  # 5 minutes
    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)
        return Response({"results": serializer.data})


# --- Sources ---


@method_decorator(cache_page(60 * 10), name="dispatch")  # 10 minutes
class SourceListView(generics.ListAPIView):
    serializer_class = SourceSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        return Source.objects.select_related("category").annotate(
            article_count=Count("articles")
        )


# --- Articles ---


class ArticleListView(_AnnotateUserMixin, generics.ListAPIView):
    serializer_class = ArticleListSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        qs = Article.objects.select_related("source", "category")
        # Call super to apply user annotations
        self.queryset = qs
        qs = super().get_queryset()

        category = self.request.query_params.get("category")
        source = self.request.query_params.get("source")
        ordering = self.request.query_params.get("ordering", "-published_at")

        if category:
            qs = qs.filter(category_id=category)
        if source:
            qs = qs.filter(source_id=source)

        allowed_orderings = {"-published_at", "-like_count", "-comment_count"}
        if ordering in allowed_orderings:
            qs = qs.order_by(ordering)

        return qs


class ArticleDetailView(_AnnotateUserMixin, generics.RetrieveAPIView):
    serializer_class = ArticleDetailSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        self.queryset = Article.objects.select_related("source", "category").prefetch_related("tags")
        return super().get_queryset()


class ArticleTrendingView(_AnnotateUserMixin, generics.ListAPIView):
    serializer_class = ArticleListSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        self.queryset = Article.objects.select_related("source", "category").order_by("-like_count")[:20]
        return super().get_queryset()


class ArticleSearchView(_AnnotateUserMixin, generics.ListAPIView):
    serializer_class = ArticleListSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        self.queryset = Article.objects.select_related("source", "category")
        qs = super().get_queryset()

        q = self.request.query_params.get("q", "")
        category = self.request.query_params.get("category")

        if q:
            qs = qs.filter(title__icontains=q)
        if category:
            qs = qs.filter(category_id=category)

        return qs


# --- Likes ---


class LikeView(generics.GenericAPIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        article = generics.get_object_or_404(Article, pk=pk)
        _, created = Like.objects.get_or_create(user=request.user, article=article)
        if created:
            Article.objects.filter(pk=pk).update(like_count=F("like_count") + 1)
            article.refresh_from_db()
        return Response(
            {"article_id": pk, "like_count": article.like_count},
            status=status.HTTP_201_CREATED if created else status.HTTP_200_OK,
        )

    def delete(self, request, pk):
        deleted, _ = Like.objects.filter(user=request.user, article_id=pk).delete()
        if deleted:
            Article.objects.filter(pk=pk).update(like_count=F("like_count") - 1)
        return Response(status=status.HTTP_204_NO_CONTENT)


# --- Comments ---


class CommentListCreateView(generics.ListCreateAPIView):
    serializer_class = CommentSerializer

    def get_permissions(self):
        if self.request.method == "GET":
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated()]

    def get_queryset(self):
        return Comment.objects.filter(article_id=self.kwargs["pk"]).select_related("user")

    def perform_create(self, serializer):
        article = generics.get_object_or_404(Article, pk=self.kwargs["pk"])
        serializer.save(user=self.request.user, article=article)
        Article.objects.filter(pk=article.pk).update(comment_count=F("comment_count") + 1)


class CommentDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = CommentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Comment.objects.filter(user=self.request.user)

    def perform_destroy(self, instance):
        Article.objects.filter(pk=instance.article_id).update(comment_count=F("comment_count") - 1)
        instance.delete()


# --- Saved Articles ---


class SavedArticleListView(_AnnotateUserMixin, generics.ListAPIView):
    serializer_class = ArticleListSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        self.queryset = (
            Article.objects.filter(saved_by__user=self.request.user)
            .select_related("source", "category")
            .distinct()
        )
        return super().get_queryset()


class SaveArticleView(generics.GenericAPIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        article = generics.get_object_or_404(Article, pk=pk)
        SavedArticle.objects.get_or_create(user=request.user, article=article)
        return Response(status=status.HTTP_201_CREATED)

    def delete(self, request, pk):
        SavedArticle.objects.filter(user=request.user, article_id=pk).delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
