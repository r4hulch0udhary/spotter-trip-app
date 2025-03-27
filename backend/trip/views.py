from django.utils import timezone
import requests
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.http import JsonResponse
from .models import Trip
from .serializers import TripSerializer
from django.middleware.csrf import get_token
from rest_framework.permissions import IsAuthenticated


# Constants for trucking rules
MAX_DRIVING_HOURS = 11
ON_DUTY_LIMIT = 14
BREAK_INTERVAL = 8
BREAK_TIME = 0.5
REST_TIME = 10
FUEL_INTERVAL_MILES = 1000  


@method_decorator(csrf_exempt, name='dispatch')
class TripAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        data = request.data

        pickup = {"lat": data.get("pickup_lat"), "lon": data.get("pickup_lon")}
        dropoff = {"lat": data.get("dropoff_lat"), "lon": data.get("dropoff_lon")}
        current = {"lat": data.get("current_latitude"), "lon": data.get("current_longitude")}

        if not pickup or not dropoff:
            return Response({"error": "Missing required data"}, status=status.HTTP_400_BAD_REQUEST)

        full_route = self.get_route(current, pickup, dropoff)

        if not full_route:
            return Response({"error": "Could not calculate route"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        # Save Trip
        trip = Trip.objects.create(
            user=request.user,
            current_latitude=current["lat"],
            current_longitude=current["lon"],
            pickup_city=data.get("pickup_city"),
            pickup_latitude=pickup["lat"],
            pickup_longitude=pickup["lon"],
            dropoff_city=data.get("dropoff_city"),
            dropoff_latitude=dropoff["lat"],
            dropoff_longitude=dropoff["lon"],
            cycle_hours=data.get("cycle_hours", 0),
            distance_km=full_route["distance"] / 1000,  # Convert meters to km
            duration_hours=str(full_route["duration"] / 3600),  # Convert seconds to hours
            route_data=full_route,
            created_at=timezone.now()
        )

        return Response(TripSerializer(trip).data, status=status.HTTP_201_CREATED)

    
    
    def get_route(self, current, pickup, dropoff):
        """Calculate route from current to pickup to dropoff using OSRM API"""
        url = f"http://router.project-osrm.org/route/v1/driving/{current['lon']},{current['lat']};{pickup['lon']},{pickup['lat']};{dropoff['lon']},{dropoff['lat']}?overview=full&geometries=polyline&steps=true"
        response = requests.get(url).json()

        if response.get("routes"):
            return response["routes"][0]  # Return first route
        return None  






class TripSummaryAPIView(APIView):
    def get(self, request, id, *args, **kwargs):
        try:
            trip = Trip.objects.get(id=id)
            trip_data = TripSerializer(trip).data

            if trip.route_data:
                fuel_stops = self.get_fuel_stops(trip.route_data)
                trip_data["fuel_stops"] = fuel_stops

            return Response(trip_data, status=status.HTTP_200_OK)
        except Trip.DoesNotExist:
            return Response({"error": "Trip not found"}, status=status.HTTP_404_NOT_FOUND)
        
    def get_fuel_stops(self, route_data):
        print("Route Data Legs:", route_data.get("legs"))  # Debugging print

        """Determine fuel stops along the route based on distance."""
        stops = []
        accumulated_distance = 0

        for leg_index, leg in enumerate(route_data.get("legs", [])):  # Loop through legs
            print(f"Leg {leg_index + 1} Steps:", leg.get("steps"))  # Debugging print
            
            for step_index, step in enumerate(leg.get("steps", [])):  # Loop through steps
                distance_miles = step.get("distance", 0) / 1609  # Convert meters to miles
                accumulated_distance += distance_miles

                print(f"Step {step_index + 1}: Distance = {distance_miles:.2f} miles, Accumulated = {accumulated_distance:.2f} miles")

                if accumulated_distance >= FUEL_INTERVAL_MILES:
                    maneuver = step.get("maneuver", {})
                    stop_location = maneuver.get("location", [])

                    if len(stop_location) == 2:  # Ensure location has lat/lon
                        stops.append({
                            "stop_type": "fuel",
                            "latitude": stop_location[1],
                            "longitude": stop_location[0],
                            "description": "Fuel stop"
                        })
                        accumulated_distance = 0  # Reset counter after stop

        print("Fuel Stops:", stops)  # Debugging print
        return stops



class ELDLogAPIView(APIView):
    def get(self, request, *args, **kwargs):
        trips = Trip.objects.all()

        if not trips.exists():
            return Response({"error": "No trips found"}, status=status.HTTP_404_NOT_FOUND)

        return Response({
            "trips": TripSerializer(trips, many=True).data,
        }, status=status.HTTP_200_OK)
