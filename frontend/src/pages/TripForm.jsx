import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import Sidebar from "../components/sidebar";

const PlanTrip = () => {
  const [currentCoords, setCurrentCoords] = useState({ lat: null, lon: null });
  const [pickupCity, setPickupCity] = useState("");
  const [dropoffCity, setDropoffCity] = useState("");
  const [cycleHours, setCycleHours] = useState("");
  const [map, setMap] = useState(null);
  const navigate = useNavigate();
  const routeLayerRef = useRef(null);



  useEffect(() => {
    if (!map) {
      const existingMap = L.DomUtil.get("map");
      if (existingMap && existingMap._leaflet_id) return;

      const newMap = L.map("map").setView([20, 78], 5);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap contributors",
      }).addTo(newMap);

      setMap(newMap);
    }
  }, []);

    const fetchCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCurrentCoords({
            lat: position.coords.latitude,
            lon: position.coords.longitude,
          });
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


  const fetchCoordinates = async (city) => {
  const url = `https://nominatim.openstreetmap.org/search?q=${city}&format=json&limit=1`;


  try {
    const response = await fetch(url);
    const data = await response.json();

    if (data.length > 0) {
      return { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) };
    } else {
      return null;
    }
  } catch (error) {
    console.error(`Error fetching coordinates for ${city}:`, error);
    return null;
  }
  };
  
  const token = localStorage.getItem("token")

  const handlePlanTrip = async () => {
    if (!pickupCity.trim() || !dropoffCity.trim() || !cycleHours) {
        alert("Please fill all required fields.");
        return;
    }

    try {
        const pickupCoords = await fetchCoordinates(pickupCity);
        const dropoffCoords = await fetchCoordinates(dropoffCity);

        if (!pickupCoords || !dropoffCoords) {
            alert("Could not fetch coordinates. Please enter valid city names.");
            return;
        }

        const tripData = {
            current_latitude: currentCoords.lat,
            current_longitude: currentCoords.lon,
            pickup_city: pickupCity.trim(),
            pickup_lat: pickupCoords.lat,
            pickup_lon: pickupCoords.lon,
            dropoff_city: dropoffCity.trim(),
            dropoff_lat: dropoffCoords.lat,
            dropoff_lon: dropoffCoords.lon,
            cycle_hours: Number(cycleHours),
        };

        const response = await axios.post("http://localhost::8000/api/trip/", tripData, {
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`,
            },
            withCredentials: true,
        });

        if (response.data && response.data.id) {
            navigate(`/tripSummary/${response.data.id}`);  // Redirect using the actual trip ID
        } else {
            alert("Trip created, but no trip ID returned.");
        }
    } catch (error) {
        console.error("Error planning trip:", error);
    }
};


  return (
    <div className="home-container">
      <Sidebar />
      <div className="container plan-trip-container">
        <h2 className="text-2xl font-bold mb-4 text-center">Plan a Trip</h2>
        <div className="row g-3 align-items-center">
          {/* Current Location Input with Fetch Button */}
          <div className="col-md-3">
            <input
              type="text"
              className="form-control"
              placeholder="Current Location"
              value={currentCoords.lat ? `Lat: ${currentCoords.lat}, Lon: ${currentCoords.lon}` : ""}
              readOnly
            />
            <button className="btn btn-primary w-100 mt-2" onClick={fetchCurrentLocation}>
              {currentCoords.lat ? "Location Set" : "Fetch Current Location"}
            </button>
          </div>

          {/* Pickup City Input */}
          <div className="col-md-3">
            <input
              type="text"
              className="form-control"
              placeholder="Pickup City"
              value={pickupCity}
              onChange={(e) => setPickupCity(e.target.value)}
            />
          </div>

          {/* Drop-off City Input */}
          <div className="col-md-3">
            <input
              type="text"
              className="form-control"
              placeholder="Drop-off City"
              value={dropoffCity}
              onChange={(e) => setDropoffCity(e.target.value)}
            />
          </div>

          {/* Cycle Hours Input */}
          <div className="col-md-3">
            <input
              type="number"
              className="form-control"
              placeholder="Cycle Hours"
              value={cycleHours}
              onChange={(e) => setCycleHours(e.target.value)}
              max="70"
            />
          </div>

          {/* Plan Trip Button */}
          <div className="col-md-3">
            <button className="btn btn-success w-100" onClick={handlePlanTrip}>
              Plan Trip
            </button>
          </div>
        </div>

        {/* Map Container */}
        <div id="map" className="w-100 h-64 mt-4 rounded shadow"></div>
      </div>
    </div>
  );
};

export default PlanTrip;
