from django.urls import path

from users.views import UserMeView, UserPreferenceView

urlpatterns = [
    path("me", UserMeView.as_view(), name="user-me"),
    path("me/preferences", UserPreferenceView.as_view(), name="user-preferences"),
]
