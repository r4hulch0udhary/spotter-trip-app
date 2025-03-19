
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import UserLocation
from .serializers import UserLocationSerializer

class UserLocationView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        print(user,'useruser')
        latitude = request.query_params.get("latitude")
        longitude = request.query_params.get("longitude")

        if latitude is None or longitude is None:
            return Response({"error": "Latitude and longitude are required."}, status=400)

        location, created = UserLocation.objects.update_or_create(
            user=user,
            defaults={"latitude": latitude, "longitude": longitude},
        )

        return Response(UserLocationSerializer(location).data)
