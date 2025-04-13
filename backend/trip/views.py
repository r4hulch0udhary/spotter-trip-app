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
FUEL_INTERVAL_MILES = 1000  
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
    permission_classes = [IsAuthenticated]

    def get(self, request, id, *args, **kwargs):
        try:
            trip = Trip.objects.get(id=id, user=request.user)
            trip_data = TripSerializer(trip).data

            # Get city names
            trip_data["current_city"] = self.get_city_name(trip.current_latitude, trip.current_longitude)
            trip_data["dropoff_city"] = self.get_city_name(trip.dropoff_latitude, trip.dropoff_longitude)
            trip_data["pickup_city"] = self.get_city_name(trip.pickup_latitude, trip.pickup_longitude)

            if trip.route_data:
                fuel_stops = self.get_fuel_stops(trip.route_data)
                trip_data["fuel_stops"] = fuel_stops if fuel_stops else []

                # Calculate total travel time & distance with timestamps
                total_time_hours, total_distance_km, stop_schedule, formatted_start_time = self.calculate_travel_time(trip.route_data, fuel_stops, trip.start_time,trip)
                trip_data["total_travel_time"] = f"{total_time_hours:.2f} hours"
                trip_data["total_distance"] = f"{total_distance_km:.2f} km"
                trip_data["stop_schedule"] = stop_schedule
                trip_data["start_time"] = formatted_start_time

            return Response(trip_data, status=status.HTTP_200_OK)
        except Trip.DoesNotExist:
            return Response({"error": "Trip not found"}, status=status.HTTP_404_NOT_FOUND)

    def calculate_travel_time(self, route_data, fuel_stops, start_time, trip):
        total_distance_meters = sum(leg.get("distance", 0) for leg in route_data.get("legs", []))
        total_distance_km = total_distance_meters / 1000
        drive_time_hours = float(trip.duration_hours)  # Estimated from OSRM

        fuel_stop_time = len(fuel_stops) * 0.5  # 30 min per fuel stop
        pickup_dropoff_time = 2  # 1 hour each
        total_time_hours = drive_time_hours + fuel_stop_time + pickup_dropoff_time

        # Start time
        current_time = datetime.strptime(start_time, "%Y-%m-%d %H:%M:%S") if isinstance(start_time, str) else start_time
        if current_time.tzinfo is None:
            current_time = make_aware(current_time)
        formatted_start_time = current_time.strftime("%Y-%m-%d %I:%M %p")

        stop_schedule = [{"type": "Start", "time": formatted_start_time}]
        current_time += timedelta(hours=1)
        stop_schedule.append({"type": "Pickup", "time": current_time.strftime("%Y-%m-%d %I:%M %p")})
        current_time += timedelta(hours=1)  # Handling time

        hours_driven = 0
        sleep_accumulator = 0
        total_time_elapsed = 0

        # Step through the route and add breaks/sleep when thresholds are hit
        for leg in route_data.get("legs", []):
            for step in leg.get("steps", []):
                distance_km = step["distance"] / 1000  # km
                duration_hours = step["duration"] / 3600  # seconds to hours

                hours_driven += duration_hours
                sleep_accumulator += duration_hours
                total_time_elapsed += duration_hours
                current_time += timedelta(hours=duration_hours)

                # Check for break
                if hours_driven >= 8:
                    lat, lon = step["maneuver"]["location"][1], step["maneuver"]["location"][0]
                    stop_schedule.append({
                        "type": "Break",
                        "time": current_time.strftime("%Y-%m-%d %I:%M %p"),
                        "latitude": lat,
                        "longitude": lon
                    })
                    current_time += timedelta(minutes=30)
                    total_time_elapsed += 0.5
                    hours_driven = 0

                # Check for sleep
                if sleep_accumulator >= 11:
                    lat, lon = step["maneuver"]["location"][1], step["maneuver"]["location"][0]
                    stop_schedule.append({
                        "type": "Sleep",
                        "time": current_time.strftime("%Y-%m-%d %I:%M %p"),
                        "latitude": lat,
                        "longitude": lon
                    })
                    current_time += timedelta(hours=8)
                    total_time_elapsed += 8
                    sleep_accumulator = 0
                    hours_driven = 0

        # Add Fuel Stops
        for fuel_stop in fuel_stops:
            stop_schedule.append({
                "type": "Fuel Stop",
                "time": current_time.strftime("%Y-%m-%d %I:%M %p"),
                "latitude": fuel_stop["latitude"],
                "longitude": fuel_stop["longitude"],
                "name": fuel_stop["name"],
                "description": fuel_stop["description"]
            })
            current_time += timedelta(minutes=30)

        # Drop-off at end
        current_time += timedelta(hours=1)
        stop_schedule.append({"type": "Drop-off", "time": current_time.strftime("%Y-%m-%d %I:%M %p")})

        return total_time_hours, total_distance_km, stop_schedule, formatted_start_time



    def get_city_name(self, latitude, longitude):
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
    
    def get_drive_time_to_pickup(self, route_data, pickup_coords):
        distance_to_pickup = 0
        reached_pickup = False

        for leg in route_data.get("legs", []):
            for step in leg.get("steps", []):
                end_location = step.get("maneuver", {}).get("location", [])
                if end_location and abs(end_location[1] - pickup_coords[0]) < 0.01 and abs(end_location[0] - pickup_coords[1]) < 0.01:
                    reached_pickup = True
                    break
                distance_to_pickup += step.get("distance", 0)
            if reached_pickup:
                break

        distance_km = distance_to_pickup / 1000
        time_hours = distance_km / 80  # assume 80 km/h for truck
        return time_hours


    def find_nearby_fuel_stations(self, lat, lon):
        overpass_url = "http://overpass-api.de/api/interpreter"
        query = f"""
        [out:json];
        node(around:{SEARCH_RADIUS_METERS},{lat},{lon})["amenity"="fuel"];
        out center 1;
        """
        try:
            response = requests.get(overpass_url, params={"data": query}, headers={"User-Agent": "trip-planner"})
            data = response.json()

            elements = data.get("elements", [])
            if elements:
                node = elements[0]  # Only use the first one
                tags = node.get("tags", {})
                station_name = tags.get("name") or tags.get("name:en") or tags.get("brand") or "Unnamed Fuel Station"

                return [{
                    "stop_type": "fuel",
                    "latitude": node["lat"],
                    "longitude": node["lon"],
                    "name": station_name,
                    "description": "Fuel Station"
                }]
            else:
                return [{
                    "stop_type": "fuel",
                    "latitude": lat,
                    "longitude": lon,
                    "name": "No Nearby Fuel Station",
                    "description": "No fuel station found"
                }]

        except Exception as e:
            print("Error fetching fuel stations:", e)
            return [{
                "stop_type": "fuel",
                "latitude": lat,
                "longitude": lon,
                "name": "Error Fetching Fuel Stations",
                "description": "API Error"
            }]


class ELDLogAPIView(APIView):

    permission_classes = [IsAuthenticated]
    def get(self, request, trip_id=None, *args, **kwargs):
        if trip_id:
            try:
                trip = Trip.objects.get(id=trip_id, user=request.user)
            except Trip.DoesNotExist:
                return Response({"error": "Trip not found"}, status=status.HTTP_404_NOT_FOUND)
            
            trips = [trip]
        else:
            trips = Trip.objects.filter(user=request.user)

        if not trips:
            return Response({"error": "No trips found"}, status=status.HTTP_404_NOT_FOUND)

        enhanced_trips = []
        for trip in trips:
            trip_data = TripSerializer(trip).data
           
            trip_data["current_city"] = TripSummaryAPIView().get_city_name(trip.current_latitude, trip.current_longitude)
            break_points = []
            sleep_points = []


            if trip.route_data:
                fuel_stops = TripSummaryAPIView().get_fuel_stops(trip.route_data)
                total_time_hours, total_distance_km, stop_schedule, formatted_start_time = TripSummaryAPIView().calculate_travel_time(
                    trip.route_data, fuel_stops, trip.start_time, trip
                )
                for stop in stop_schedule:
                    if stop["type"] == "Break":
                        city = TripSummaryAPIView().get_city_name(stop["latitude"], stop["longitude"])
                        if city:
                            break_points.append(city)
                    if stop["type"] == "Sleep":
                        city = TripSummaryAPIView().get_city_name(stop["latitude"], stop["longitude"])
                        if city:
                            sleep_points.append(city)

                trip_data["fuel_stops"] = fuel_stops
                trip_data["stop_schedule"] = stop_schedule
                trip_data["total_travel_time"] = f"{total_time_hours:.2f} hours"
                trip_data["start_time"] = formatted_start_time
                trip_data["break_points"] = break_points if break_points else []
                trip_data["sleep_points"] = sleep_points if sleep_points else []


            enhanced_trips.append(trip_data)

        return Response({"trips": enhanced_trips}, status=status.HTTP_200_OK)



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