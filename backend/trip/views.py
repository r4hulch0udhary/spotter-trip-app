
import requests
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import UserLocation
from .serializers import UserLocationSerializer
from .models import Trip
from .serializers import TripSerializer
from .utils import get_coordinates,get_route_details

# class UserLocationView(APIView):
#     permission_classes = [IsAuthenticated]

#     def get(self, request):
#         user = request.user
#         print(user,'useruser')
#         latitude = request.query_params.get("latitude")
#         longitude = request.query_params.get("longitude")

#         if latitude is None or longitude is None:
#             return Response({"error": "Latitude and longitude are required."}, status=400)

#         location, created = UserLocation.objects.update_or_create(
#             user=user,
#             defaults={"latitude": latitude, "longitude": longitude},
#         )

#         return Response(UserLocationSerializer(location).data)
    



class PlanTripView(APIView):
    """API View to plan a trip by providing pickup & drop-off city names."""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        print(" Processing trip request...")

        user = request.user
        data = request.data

        pickup_city = data.get("pickup_city")
        dropoff_city = data.get("dropoff_city")
        cycle_hours = data.get("cycle_hours", 0)

        if not pickup_city or not dropoff_city:
            return Response({"error": "Pickup and Drop-off locations are required."}, status=400)

        # Convert city names to coordinates
        pickup_lat, pickup_lon = get_coordinates(pickup_city)
        dropoff_lat, dropoff_lon = get_coordinates(dropoff_city)

        if pickup_lat is None or dropoff_lat is None:
            return Response({"error": "Invalid city name(s)."}, status=400)

        # Get route details
        distance_km, duration_hours, formatted_duration, route_data = get_route_details(pickup_lat, pickup_lon, dropoff_lat, dropoff_lon)

        if distance_km is None:
            return Response({"error": "Could not calculate route."}, status=500)

        # Save trip details
        trip = Trip.objects.create(
            user=user,
            pickup_city=pickup_city,
            pickup_latitude=pickup_lat,
            pickup_longitude=pickup_lon,
            dropoff_city=dropoff_city,
            dropoff_latitude=dropoff_lat,
            dropoff_longitude=dropoff_lon,
            cycle_hours=cycle_hours,
            distance_km=distance_km,
            duration_hours=formatted_duration,  # ✅ Storing the numeric value
            route_data=route_data
        )

        print(" Trip successfully created!")

        # Return trip details, including formatted duration
        trip_data = TripSerializer(trip).data
        trip_data["formatted_duration"] = formatted_duration  # ✅ Adding readable format

        return Response(trip_data, status=200)

