from django.urls import path

from news.views import (
    ArticleDetailView,
    ArticleListView,
    ArticleSearchView,
    ArticleTrendingView,
    CommentDetailView,
    CommentListCreateView,
    LikeView,
    SaveArticleView,
    SavedArticleListView,
    SourceListView,
    CategoryListView,
)
from users.views import DeviceDeleteView, DeviceRegisterView

urlpatterns = [
    # Categories
    path("categories", CategoryListView.as_view(), name="category-list"),
    # Sources
    path("sources", SourceListView.as_view(), name="source-list"),
    # Articles
    path("articles", ArticleListView.as_view(), name="article-list"),
    path("articles/trending", ArticleTrendingView.as_view(), name="article-trending"),
    path("articles/search", ArticleSearchView.as_view(), name="article-search"),
    path("articles/<int:pk>", ArticleDetailView.as_view(), name="article-detail"),
    # Likes
    path("articles/<int:pk>/like", LikeView.as_view(), name="article-like"),
    # Comments
    path("articles/<int:pk>/comments", CommentListCreateView.as_view(), name="comment-list"),
    path("comments/<int:pk>", CommentDetailView.as_view(), name="comment-detail"),
    # Saved
    path("articles/<int:pk>/save", SaveArticleView.as_view(), name="article-save"),
    path("users/me/saved", SavedArticleListView.as_view(), name="saved-list"),
    # Devices
    path("devices/register", DeviceRegisterView.as_view(), name="device-register"),
    path("devices/<str:token>", DeviceDeleteView.as_view(), name="device-delete"),
]
