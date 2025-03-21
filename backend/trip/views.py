from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import Trip
from .serializers import TripSerializer
from .utils import get_coordinates, get_route_details

class PlanTripView(APIView):
    """API View to plan a trip by providing pickup & drop-off city names."""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        print("Processing trip request...")

        user = request.user
        data = request.data

        pickup_city = data.get("pickup_city")  # Allow null if using geolocation
        dropoff_city = data.get("dropoff_city")
        cycle_hours = data.get("cycle_hours", 0)

        current_latitude = data.get("current_latitude")  # From frontend geolocation
        current_longitude = data.get("current_longitude")

        if not dropoff_city:
            return Response({"error": "Drop-off location is required."}, status=400)

        # Get coordinates for pickup location
        if pickup_city:
            pickup_lat, pickup_lon = get_coordinates(pickup_city)
            if pickup_lat is None:
                return Response({"error": "Invalid pickup city name."}, status=400)
        elif current_latitude and current_longitude:
            # Use geolocation if no pickup city is provided
            pickup_lat, pickup_lon = float(current_latitude), float(current_longitude)
            pickup_city = "Current Location"
        else:
            return Response({"error": "Pickup location or geolocation is required."}, status=400)

        # Get coordinates for drop-off location
        dropoff_lat, dropoff_lon = get_coordinates(dropoff_city)
        if dropoff_lat is None:
            return Response({"error": "Invalid drop-off city name."}, status=400)

        # Get route details
        distance_km, duration_hours, formatted_duration, route_data = get_route_details(
            pickup_lat, pickup_lon, dropoff_lat, dropoff_lon
        )

        if distance_km is None:
            return Response({"error": "Could not calculate route."}, status=500)

        # Save trip details
        trip = Trip.objects.create(
            user=user,
            current_latitude=pickup_lat,
            current_longitude=pickup_lon,
            pickup_city=pickup_city,
            pickup_latitude=pickup_lat,
            pickup_longitude=pickup_lon,
            dropoff_city=dropoff_city,
            dropoff_latitude=dropoff_lat,
            dropoff_longitude=dropoff_lon,
            cycle_hours=cycle_hours,
            distance_km=distance_km,
            duration_hours=formatted_duration,
            route_data=route_data
        )

        print("Trip successfully created!")

        trip_data = TripSerializer(trip).data
        trip_data["formatted_duration"] = formatted_duration  

        return Response(trip_data, status=200)
