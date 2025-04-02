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
FUEL_INTERVAL_MILES = 100  
SEARCH_RADIUS_METERS = 16093  # 10 miles in meters


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

    
    






class TripSummaryAPIView(APIView):
    def get(self, request, id, *args, **kwargs):
        try:
            trip = Trip.objects.get(id=id)
            trip_data = TripSerializer(trip).data

            # Get the current city name
            current_city = self.get_city_name(trip.current_latitude, trip.current_longitude)
            dropoff_city = self.get_city_name(trip.dropoff_latitude, trip.dropoff_longitude)
            pickup_city = self.get_city_name(trip.pickup_latitude, trip.pickup_longitude)

            trip_data["current_city"] = current_city  
            trip_data["dropoff_city"] = dropoff_city  
            trip_data["pickup_city"] = pickup_city

            if trip.route_data:
                fuel_stops = self.get_fuel_stops(trip.route_data)
                trip_data["fuel_stops"] = fuel_stops

            return Response(trip_data, status=status.HTTP_200_OK)
        except Trip.DoesNotExist:
            return Response({"error": "Trip not found"}, status=status.HTTP_404_NOT_FOUND)

    def get_city_name(self, latitude, longitude):
        """Fetch city and county name from coordinates using OpenStreetMap Nominatim API."""
        try:
            url = f"https://nominatim.openstreetmap.org/reverse?format=json&lat={latitude}&lon={longitude}"
            response = requests.get(url, headers={"User-Agent": "trip-planner"})
            # print("Response:", response.text)  # Debugging print

            if response.status_code == 200:
                data = response.json()
                address = data.get("address", {})

                # Extract city and county from relevant fields
                city = address.get("city") or address.get("town") or address.get("village")
                county = address.get("county") or address.get("state_district")

                # Combine them meaningfully
                location_name = ""
                if city:
                    location_name += city
                if county and county != city:  # Avoid duplication
                    location_name += f", {county}"

                return location_name if location_name else "Unknown Location"

        except Exception as e:
            print("Error fetching city name:", e)

        return "Unknown Location"


            
    def get_fuel_stops(self, route_data):
        """Find fuel stops along the route and fetch real fuel station names."""
        stops = []
        accumulated_distance = 0

        for leg in route_data.get("legs", []):  
            for step in leg.get("steps", []):  
                distance_miles = step.get("distance", 0) / 1609  # Convert meters to miles
                accumulated_distance += distance_miles

                if accumulated_distance >= FUEL_INTERVAL_MILES:
                    maneuver = step.get("maneuver", {})
                    stop_location = maneuver.get("location", [])

                    if len(stop_location) == 2:  # Ensure valid lat/lon
                        lat, lon = stop_location[1], stop_location[0]
                        fuel_stations = self.find_nearby_fuel_stations(lat, lon)

                        stops.extend(fuel_stations)  # Add fuel stations at this stop
                        accumulated_distance = 0  # Reset counter

        return stops

    def find_nearby_fuel_stations(self, lat, lon):
        """Fetch nearby fuel stations using Overpass API and return names."""
        overpass_url = "http://overpass-api.de/api/interpreter"
        query = f"""
        [out:json];
        node(around:{SEARCH_RADIUS_METERS},{lat},{lon})["amenity"="fuel"];
        out center;
        """
        try:
            response = requests.get(overpass_url, params={"data": query}, headers={"User-Agent": "trip-planner"})
            print(response.text, ">>>>>> Response from Overpass API")
            data = response.json()

            fuel_stations = []
            for node in data.get("elements", []):
                tags = node.get("tags", {})
                station_name = tags.get("name") or tags.get("name:en") or tags.get("brand") or "Unnamed Fuel Station"

                fuel_stations.append({
                    "stop_type": "fuel",
                    "latitude": node["lat"],
                    "longitude": node["lon"],
                    "name": station_name,
                    "description": "Fuel Station"
                })

            print(fuel_stations, "<<<<< Fuel Stations Found")
            return fuel_stations if fuel_stations else [{"stop_type": "fuel", "latitude": lat, "longitude": lon, "name": "No Nearby Fuel Station", "description": "No fuel station found"}]

        except Exception as e:
            print("Error fetching fuel stations:", e)
            return [{"stop_type": "fuel", "latitude": lat, "longitude": lon, "name": "Error Fetching Fuel Stations", "description": "API Error"}]



class ELDLogAPIView(APIView):
    def get(self, request, *args, **kwargs):
        trips = Trip.objects.all()

        if not trips.exists():
            return Response({"error": "No trips found"}, status=status.HTTP_404_NOT_FOUND)

        return Response({
            "trips": TripSerializer(trips, many=True).data,
        }, status=status.HTTP_200_OK)
