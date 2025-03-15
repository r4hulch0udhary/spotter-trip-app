from django.contrib.auth.models import User
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework import generics
from rest_framework.permissions import IsAuthenticated
from trip.serializers import UserSerializer

class RegisterUserAPIView(generics.CreateAPIView):
    """Register a new user"""
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [AllowAny]

class LogoutAPIView(APIView):
    """Blacklist the refresh token to logout"""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            refresh_token = request.data["refresh"]
            token = RefreshToken(refresh_token)
            token.blacklist()
            return Response({"message": "Logged out"}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"error": "Invalid token : " + str(e)}, status=status.HTTP_400_BAD_REQUEST)
