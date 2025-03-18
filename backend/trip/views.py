import requests
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import Trip
from .serializers import TripSerializer

class TripView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = TripSerializer(data=request.data)
        if serializer.is_valid():
            pickup_location = serializer.validated_data['pickup_location']
            dropoff_location = serializer.validated_data['dropoff_location']

            route = self.get_route(pickup_location, dropoff_location)
            if not route:
                return Response({"error": "Failed to fetch route"}, status=status.HTTP_400_BAD_REQUEST)
            trip = serializer.save(user=request.user, route_data=route)

            return Response(TripSerializer(trip).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def get_route(self, pickup, dropoff):
        osrm_url = f"http://router.project-osrm.org/route/v1/driving/{pickup};{dropoff}?overview=full&geometries=geojson"
        
        response = requests.get(osrm_url)
        if response.status_code == 200:
            return response.json()
        return None
