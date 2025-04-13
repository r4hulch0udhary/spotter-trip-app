from django.urls import path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from trip.auth import RegisterUserAPIView, LogoutAPIView
from .views import  ELDLogAPIView, TripSummaryAPIView, TripAPIView,PastTripsAPIView


urlpatterns = [
    # Auth Urls
    path('register/', RegisterUserAPIView.as_view(), name='register'),
    path('login/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('logout/', LogoutAPIView.as_view(), name='logout'),
    # path("location/", UserLocation.as_view(), name="user-location"),
    path("trip/", TripAPIView.as_view(), name="plan_trip"),
    path('trip-summary/<int:id>/', TripSummaryAPIView.as_view(), name='trip-summary'),
    path('eld-logs/', ELDLogAPIView.as_view(), name='eld-logs'),
    path('past-logs/', PastTripsAPIView.as_view(), name='eld-logs'),
    path('eld-logs/<int:trip_id>/', ELDLogAPIView.as_view()),  # for specific trip


]