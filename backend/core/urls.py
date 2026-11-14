from django.urls import include, path
from rest_framework.routers import DefaultRouter

from . import views

router = DefaultRouter()
router.register("tutores", views.TutorViewSet, basename="tutor")

urlpatterns = [
    path("saude/", views.saude, name="saude"),
    path("auth/login/", views.LoginView.as_view(), name="login"),
    path("auth/logout/", views.LogoutView.as_view(), name="logout"),
    path("auth/eu/", views.EuView.as_view(), name="eu"),
    path("", include(router.urls)),
]