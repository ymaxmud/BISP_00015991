from django.urls import include, path
from rest_framework.routers import DefaultRouter

from . import views

router = DefaultRouter()
router.register(r'decisions', views.TriageDecisionViewSet, basename='triage-decision')
router.register(r'ai-runs', views.AIRunViewSet, basename='ai-run')
router.register(r'ai-outputs', views.AIOutputViewSet, basename='ai-output')
router.register(r'chat-sessions', views.ReportChatSessionViewSet, basename='chat-session')
router.register(r'chat-messages', views.ReportChatMessageViewSet, basename='chat-message')

urlpatterns = [
    path('', include(router.urls)),
]
