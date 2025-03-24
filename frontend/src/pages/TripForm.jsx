import { useState, useEffect, useRef } from "react";
import axios from "axios";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const PlanTrip = () => {
  const [pickupCity, setPickupCity] = useState("");
  const [dropoffCity, setDropoffCity] = useState("");
  const [cycleHours, setCycleHours] = useState(50);
  const [loading, setLoading] = useState(false);
  const [tripData, setTripData] = useState(null);
  const [map, setMap] = useState(null);
  const [useCurrentLocation, setUseCurrentLocation] = useState(false);
  const [currentCoords, setCurrentCoords] = useState({ lat: null, lon: null });

  const routeLayerRef = useRef(null);

  // Initialize Leaflet Map
  useEffect(() => {
    if (!map) {
      const existingMap = L.DomUtil.get("map");
      if (existingMap && existingMap._leaflet_id) return;

      const newMap = L.map("map").setView([20, 78], 5);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; OpenStreetMap contributors',
      }).addTo(newMap);

      setMap(newMap);
    }
  }, []);

  // Display trip route on the map
  useEffect(() => {
    if (map && tripData?.route_coordinates) {
      if (routeLayerRef.current) map.removeLayer(routeLayerRef.current);

      const coordinates = tripData.route_coordinates.map(coord => [coord[1], coord[0]]);
      routeLayerRef.current = L.polyline(coordinates, { color: "blue", weight: 5 }).addTo(map);
      map.fitBounds(routeLayerRef.current.getBounds());
    }
  }, [tripData, map]);

  // Fetch city coordinates from API
  const fetchCityCoordinates = async (city, type) => {
    try {
      const response = await axios.get(`https://nominatim.openstreetmap.org/search`, {
        params: { q: city, format: "json", limit: 1 },
      });

      if (response.data.length > 0) {
        const { lat, lon } = response.data[0];
        return { latitude: parseFloat(lat), longitude: parseFloat(lon) };
      } else {
        alert(`Could not find coordinates for ${type} city.`);
        return null;
      }
    } catch (error) {
      console.error("Error fetching city coordinates:", error);
      return null;
    }
  };

  // Handle trip planning
  const handlePlanTrip = async () => {
    if (!pickupCity.trim() && !useCurrentLocation) {
      alert("Please enter a pickup city or use your current location.");
      return;
    }
    if (!dropoffCity.trim()) {
      alert("Please enter a drop-off location.");
      return;
    }

    setLoading(true);

    let pickupCoords = { latitude: null, longitude: null };
    if (useCurrentLocation && currentCoords.lat !== null) {
      pickupCoords = { latitude: currentCoords.lat, longitude: currentCoords.lon };
    } else if (pickupCity.trim()) {
      pickupCoords = await fetchCityCoordinates(pickupCity, "pickup");
      if (!pickupCoords) return setLoading(false);
    }

    const dropoffCoords = await fetchCityCoordinates(dropoffCity, "dropoff");
    if (!dropoffCoords) return setLoading(false);

    const tripData = {
      pickup_city: useCurrentLocation ? "Current Location" : pickupCity.trim(),
      dropoff_city: dropoffCity.trim(),
      cycle_hours: Number(cycleHours),
      current_latitude: pickupCoords.latitude,
      current_longitude: pickupCoords.longitude,
    };

    try {
      const response = await axios.post("http://localhost:8000/api/trip/", tripData);
      setTripData(response.data);
      alert("Trip successfully created!");
    } catch (error) {
      console.error("Error planning trip:", error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch user's current location
  const fetchCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUseCurrentLocation(true);
          setCurrentCoords({
            lat: position.coords.latitude,
            lon: position.coords.longitude,
          });
          setPickupCity(""); // Clear manual input when using current location
        },
        (error) => {
          console.error("Geolocation Error:", error);
          alert("Geolocation failed. Please enter a pickup city manually.");
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    } else {
      alert("Geolocation is not supported by your browser.");
    }
  };

  return (
    <div className="container plan-trip-container">
      <h2 className="text-2xl font-bold mb-4 text-center">Plan a Trip</h2>
      <div className="row g-3 align-items-center">
        {/* Pickup City Input */}
        <div className="col-md-3">
          <input
            type="text"
            className="form-control p-3"
            placeholder="Pickup City"
            value={pickupCity}
            onChange={(e) => {
              setPickupCity(e.target.value);
              setUseCurrentLocation(false);
            }}
            disabled={useCurrentLocation}
            required
          />
          <button
            className="btn btn-primary mt-2 w-100"
            onClick={fetchCurrentLocation}
          >
            {useCurrentLocation ? "Using Current Location" : "Fetch Current Location"}
          </button>
        </div>

        {/* Drop-off City Input */}
        <div className="col-md-3">
          <input
            type="text"
            className="form-control p-3"
            placeholder="Drop-off City"
            value={dropoffCity}
            onChange={(e) => setDropoffCity(e.target.value)}
            required
          />
        </div>

        {/* Cycle Hours Input */}
        <div className="col-md-3">
          <input
            type="number"
            className="form-control p-3"
            value={cycleHours}
            onChange={(e) => setCycleHours(e.target.value ? Number(e.target.value) : "")}
          />
        </div>

        {/* Plan Trip Button */}
        <div className="col-md-3">
          <button
            className="btn btn-success w-100 p-3"
            onClick={handlePlanTrip}
            disabled={loading}
          >
            {loading ? "Planning..." : "Plan Trip"}
          </button>
        </div>
      </div>

      {/* Map Display */}
      <div id="map" className="w-100 h-64 mt-4 rounded shadow"></div>
    </div>
  );
};

export default PlanTrip;
