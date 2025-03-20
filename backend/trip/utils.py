import requests

def get_coordinates(city_name, country="India"):
    """Fetch latitude & longitude for a given city name using OpenStreetMap, with OpenCage as a backup."""
    try:
        url = f"https://nominatim.openstreetmap.org/search?q={city_name},{country}&format=json&limit=1"
        response = requests.get(url, headers={"User-Agent": "Mozilla/5.0"}, timeout=10)

        if response.status_code == 200:
            try:
                data = response.json()
                if data:
                    return float(data[0]["lat"]), float(data[0]["lon"])
            except ValueError:
                print(" Error decoding OpenStreetMap JSON response")

        print(" OpenStreetMap failed, trying OpenCage...")

        backup_url = f"https://api.opencagedata.com/geocode/v1/json?q={city_name},{country}"
        backup_response = requests.get(backup_url, timeout=10)

        if backup_response.status_code == 200:
            try:
                backup_data = backup_response.json()
                if backup_data and "results" in backup_data and backup_data["results"]:
                    return (
                        float(backup_data["results"][0]["geometry"]["lat"]),
                        float(backup_data["results"][0]["geometry"]["lng"]),
                    )
            except ValueError:
                print(" Error decoding OpenCage JSON response")

    except requests.exceptions.Timeout:
        print(" Request Timed Out!")
    except requests.exceptions.RequestException as e:
        print(f" Request Failed: {e}")

    return None, None
def convert_hours_to_hm(decimal_hours):
    """Convert decimal hours to 'X hr Y min' format."""
    hours = int(decimal_hours)
    minutes = round((decimal_hours - hours) * 60)
    return f"{hours} hr {minutes} min" if minutes else f"{hours} hr"

def get_route_details(pickup_lat, pickup_lon, dropoff_lat, dropoff_lon):
    """Fetch route distance & duration using OSRM API."""
    try:
        url = f"https://router.project-osrm.org/route/v1/driving/{pickup_lon},{pickup_lat};{dropoff_lon},{dropoff_lat}?overview=false"
        response = requests.get(url, timeout=10)

        if response.status_code == 200:
            data = response.json()
            if "routes" in data and data["routes"]:
                route = data["routes"][0]
                distance_km = route["distance"] / 1000  # Convert meters to KM
                duration_hours = route["duration"] / 3600  # Convert seconds to hours
                duration_25_percent = duration_hours * 1.25

                formatted_duration = convert_hours_to_hm(duration_25_percent)  # Get formatted string
                # formatted_duration = convert_hours_to_hm(duration_hours)  # Get formatted string
                return distance_km, duration_hours, formatted_duration, route
    except requests.exceptions.RequestException as e:
        print(f" OSRM API Request Failed: {e}")

    return None, None, None, None  # Return None if routing fails
