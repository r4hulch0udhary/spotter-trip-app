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
from datetime import datetime, timedelta


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

        # Get start_time from request or use current timestamp
        start_time = timezone.now()  # Use timezone-aware datetime object
   

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
            start_time=start_time,  # Save start_time
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



from django.utils.timezone import make_aware



class TripSummaryAPIView(APIView):
    def get(self, request, id, *args, **kwargs):
        try:
            trip = Trip.objects.get(id=id)
            trip_data = TripSerializer(trip).data

            # Get city names
            trip_data["current_city"] = self.get_city_name(trip.current_latitude, trip.current_longitude)
            trip_data["dropoff_city"] = self.get_city_name(trip.dropoff_latitude, trip.dropoff_longitude)
            trip_data["pickup_city"] = self.get_city_name(trip.pickup_latitude, trip.pickup_longitude)

            if trip.route_data:
                fuel_stops = self.get_fuel_stops(trip.route_data)
                trip_data["fuel_stops"] = fuel_stops

                # Calculate total travel time & distance with timestamps
                total_time_hours, total_distance_km, stop_schedule = self.calculate_travel_time(trip.route_data, fuel_stops, trip.start_time)
                trip_data["total_travel_time"] = f"{total_time_hours:.2f} hours"
                trip_data["total_distance"] = f"{total_distance_km:.2f} km"
                trip_data["stop_schedule"] = stop_schedule  # Add detailed stop times

            return Response(trip_data, status=status.HTTP_200_OK)
        except Trip.DoesNotExist:
            return Response({"error": "Trip not found"}, status=status.HTTP_404_NOT_FOUND)

    def calculate_travel_time(self, route_data, fuel_stops, start_time):
        """Calculate total travel time including stops and provide a schedule of stops."""
        total_distance_meters = sum(leg.get("distance", 0) for leg in route_data.get("legs", []))
        total_distance_km = total_distance_meters / 1000  # Convert to km

        # Estimate drive time (assuming average speed of 80 km/h)
        drive_time_hours = total_distance_km / 80

        # Add stop durations
        fuel_stop_time = len(fuel_stops) * 0.5  # 30 min per fuel stop
        meal_time = 3  # 1 hour each for breakfast, lunch, and dinner
        sleep_time = 12 if total_distance_km > 600 else 0  # Sleep stop for long trips
        pickup_dropoff_time = 2  # 1 hour at pickup & drop-off

        # Total travel time
        total_time_hours = drive_time_hours + fuel_stop_time + meal_time + sleep_time + pickup_dropoff_time

        # Ensure start_time is a datetime object
        if isinstance(start_time, str):
            current_time = datetime.strptime(start_time, "%Y-%m-%d %H:%M:%S")
        else:
            current_time = start_time  # Assume it's already a datetime object

        # Convert to timezone-aware datetime if necessary
        if current_time.tzinfo is None:
            current_time = make_aware(current_time)

        # Calculate stop timestamps
        stop_schedule = []

        # Add pickup time
        stop_schedule.append({"type": "Pickup", "time": current_time.strftime("%Y-%m-%d %H:%M:%S")})
        current_time += timedelta(hours=1)  # Add pickup duration

        # Add stops
        drive_time_so_far = 0
        for fuel_stop in fuel_stops:
            drive_time_so_far += (fuel_stop.get("distance", 0) / 80)  # Use .get() to avoid KeyError
            current_time += timedelta(hours=drive_time_so_far)
            stop_schedule.append({"type": "Fuel Stop", "time": current_time.strftime("%Y-%m-%d %H:%M:%S")})
            current_time += timedelta(minutes=30)  # Fuel stop time

        # Add meal times (assuming they happen at 8 AM, 1 PM, and 7 PM)
        for meal_hour in [8, 13, 19]:
            meal_datetime = current_time.replace(hour=meal_hour, minute=0, second=0)
            stop_schedule.append({"type": "Meal", "time": meal_datetime.strftime("%Y-%m-%d %H:%M:%S")})
            current_time += timedelta(hours=1)  # Each meal is 1 hour

        # Add sleep time if long trip
        if sleep_time > 0:
            current_time += timedelta(hours=drive_time_so_far)  # Drive before sleep
            stop_schedule.append({"type": "Sleep", "time": current_time.strftime("%Y-%m-%d %H:%M:%S")})
            current_time += timedelta(hours=12)  # Sleep duration

        # Add drop-off time
        current_time += timedelta(hours=1)  # Final travel time
        stop_schedule.append({"type": "Drop-off", "time": current_time.strftime("%Y-%m-%d %H:%M:%S")})

        return total_time_hours, total_distance_km, stop_schedule


    def get_city_name(self, latitude, longitude):
        """Fetch city and county name from coordinates using OpenStreetMap Nominatim API."""
        try:
            url = f"https://nominatim.openstreetmap.org/reverse?format=json&lat={latitude}&lon={longitude}"
            response = requests.get(url, headers={"User-Agent": "trip-planner"})

            if response.status_code == 200:
                data = response.json()
                address = data.get("address", {})

                city = address.get("city") or address.get("town") or address.get("village")
                county = address.get("county") or address.get("state_district")

                location_name = city if city else "Unknown Location"
                if county and county != city:
                    location_name += f", {county}"

                return location_name
        except Exception as e:
            print("Error fetching city name:", e)

        return "Unknown Location"

    def get_fuel_stops(self, route_data):
        """Find fuel stops along the route and fetch real fuel station names."""
        stops = []
        accumulated_distance = 0

        for leg in route_data.get("legs", []):
            for step in leg.get("steps", []):
                distance_miles = step.get("distance", 0) / 1609
                accumulated_distance += distance_miles

                if accumulated_distance >= FUEL_INTERVAL_MILES:
                    maneuver = step.get("maneuver", {})
                    stop_location = maneuver.get("location", [])

                    if len(stop_location) == 2:
                        lat, lon = stop_location[1], stop_location[0]
                        fuel_stations = self.find_nearby_fuel_stations(lat, lon)

                        stops.extend(fuel_stations)
                        accumulated_distance = 0  

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



class PastTripsAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        user = request.user
        past_trips = Trip.objects.filter(user=user).order_by('-start_time')

        if not past_trips.exists():
            return Response({"error": "No past trips found"}, status=status.HTTP_404_NOT_FOUND)

        return Response({
            "past_trips": TripSerializer(past_trips, many=True).data,
        }, status=status.HTTP_200_OK)