from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
import requests

app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins (change this for production security)
    allow_credentials=True,
    allow_methods=["*"],  # Allow all HTTP methods (GET, POST, etc.)
    allow_headers=["*"],  # Allow all headers
)


# Replace with your OpenRouteService API Key
ORS_API_KEY = "5b3ce3597851110001cf624884f3124b0b6d46f8b0aff7e00fcf1180"

# @app.get("/route/")
# def get_route(start: str, end: str):
#     """
#     Fetch route data between two points.
#     :param start: Comma-separated lat,lng of start point
#     :param end: Comma-separated lat,lng of end point
#     """
#     base_url = "https://api.openrouteservice.org/v2/directions/driving-car"    
#     response = requests.get(f"{base_url}?api_key={ORS_API_KEY}&start={start}&end={end}")
    
#     if response.status_code != 200:
#         raise HTTPException(status_code=response.status_code, detail="Error fetching route data")
    
#     return response.json()


def geocode_location(location: str):
    """ Convert address to latitude & longitude using OpenRouteService. """
    geocode_url = "https://api.openrouteservice.org/geocode/search"
    params = {"api_key": ORS_API_KEY, "text": location}
    
    response = requests.get(geocode_url, params=params)
    if response.status_code != 200:
        raise HTTPException(status_code=response.status_code, detail="Geocoding failed")
    
    data = response.json()
    if not data.get("features"):
        raise HTTPException(status_code=404, detail="Location not found")
    
    # Extract coordinates (lng, lat)
    coords = data["features"][0]["geometry"]["coordinates"]
    return f"{coords[0]},{coords[1]}"  # Return as "longitude,latitude"

@app.get("/route/")
def get_route(current_coords: str = Query(...), start: str = Query(...), end: str = Query(...)):
    """ Fetch route data between two addresses """
    try:
        start_coords = geocode_location(start)
        end_coords = geocode_location(end)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
    
    base_url = "https://api.openrouteservice.org/v2/directions/driving-car"
    route_url = f"{base_url}?api_key={ORS_API_KEY}&start={current_coords}&end={end_coords}&waypoints={start_coords}"
    
    response = requests.get(route_url)
    if response.status_code != 200:
        raise HTTPException(status_code=response.status_code, detail="Error fetching route data")
    
    return response.json()