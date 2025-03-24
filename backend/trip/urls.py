from django.urls import path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from trip.auth import RegisterUserAPIView, LogoutAPIView
from .views import  plan_trip


urlpatterns = [
    # Auth Urls
    path('register/', RegisterUserAPIView.as_view(), name='register'),
    path('login/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('logout/', LogoutAPIView.as_view(), name='logout'),
    # path("location/", UserLocation.as_view(), name="user-location"),
    path("trip/", plan_trip, name="plan_trip"),

]