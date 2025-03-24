from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
import json
from .utils import get_coordinates, get_route_details

@csrf_exempt
def plan_trip(request):
    if request.method == "POST":
        try:
            data = json.loads(request.body)

            pickup_city = data.get("pickup_city")
            dropoff_city = data.get("dropoff_city")
            cycle_hours = data.get("cycle_hours", 50)
            current_latitude = data.get("current_latitude")
            current_longitude = data.get("current_longitude")

            if not dropoff_city:
                return JsonResponse({"error": "Drop-off city is required"}, status=400)

            if pickup_city and pickup_city != "Current Location":
                pickup_lat, pickup_lon = get_coordinates(pickup_city)
            else:
                pickup_lat, pickup_lon = current_latitude, current_longitude

            dropoff_lat, dropoff_lon = get_coordinates(dropoff_city)

            if not pickup_lat or not pickup_lon or not dropoff_lat or not dropoff_lon:
                return JsonResponse({"error": "Could not determine coordinates for cities"}, status=400)

            distance_km, duration_hours, formatted_duration, route = get_route_details(
                pickup_lat, pickup_lon, dropoff_lat, dropoff_lon
            )

            if not route:
                return JsonResponse({"error": "Route calculation failed"}, status=500)

            return JsonResponse({
                "pickup_city": pickup_city,
                "dropoff_city": dropoff_city,
                "cycle_hours": cycle_hours,
                "distance_km": distance_km,
                "duration_hours": formatted_duration,
                "route_coordinates": route.get("geometry", {}).get("coordinates", [])
            })

        except json.JSONDecodeError:
            return JsonResponse({"error": "Invalid JSON input"}, status=400)

    return JsonResponse({"error": "Invalid request method"}, status=405)
