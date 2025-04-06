import { useState, useEffect } from "react";
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
  const [pickupSuggestions, setPickupSuggestions] = useState([]);
  const [dropoffSuggestions, setDropoffSuggestions] = useState([]);
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const [loadingPickup, setLoadingPickup] = useState(false);
  const [loadingDropoff, setLoadingDropoff] = useState(false);
  const [loadingApi, setLoadingApi] = useState(false);

  
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
      const data = await response?.json();
      return data?.length > 0 ? { lat: parseFloat(data[0]?.lat), lon: parseFloat(data[0]?.lon) } : null;
    } catch (error) {
      console.error(`Error fetching coordinates for ${city}:`, error);
      return null;
    }
  };

  const handlePlanTrip = async () => {
    if (!pickupCity?.trim() || !dropoffCity?.trim() || !cycleHours) {
      alert("Please fill all required fields.");
      return;
    }
    setLoadingApi(true);


    try {
      const pickupCoords = await fetchCoordinates(pickupCity);
      const dropoffCoords = await fetchCoordinates(dropoffCity);

      if (!pickupCoords || !dropoffCoords) {
        alert("Could not fetch coordinates. Please enter valid city names.");
        return;
      }

      const tripData = {
        current_latitude: currentCoords?.lat,
        current_longitude: currentCoords?.lon,
        pickup_city: pickupCity?.trim(),
        pickup_lat: pickupCoords?.lat,
        pickup_lon: pickupCoords?.lon,
        dropoff_city: dropoffCity?.trim(),
        dropoff_lat: dropoffCoords?.lat,
        dropoff_lon: dropoffCoords?.lon,
        cycle_hours: Number(cycleHours),
      };

      const response = await axios.post("http://localhost:8000/api/trip/", tripData, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        withCredentials: true,
      });

      if (response.data && response.data.id) {
        navigate(`/tripSummary/${response.data.id}`);
      } else {
        alert("Trip created, but no trip ID returned.");
      }
    } catch (error) {
      console.error("Error planning trip:", error);
    } finally {
    setLoadingApi(false); // ✅ always hide loader after API call
  }
  };

  // Fetch city suggestions from Nominatim API
  const fetchSuggestions = async (query, setSuggestions, setLoading) => {
    if (!query.trim()) {
      setSuggestions([]);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=5`
      );
      const data = await response.json();
      setSuggestions(data);
    } catch (error) {
      console.error("Error fetching suggestions:", error);
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="home-container">
      <Sidebar />
      {loadingApi && (
        <div className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center bg-black bg-opacity-75" style={{ zIndex: 1050 }}>
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      )}
      <div className="container plan-trip-container">
        <h2 className="text-2xl font-bold mb-4 text-center">Plan a Trip</h2>
        <div className="row">
          <div className="col-md-4">
            <div className="input-group">
              <input
                type="text"
                className="form-control"
                placeholder="Current Location"
                value={currentCoords.lat ? `Lat: ${currentCoords.lat}, Lon: ${currentCoords.lon}` : ""}
                readOnly
                />
              <div className="input-group-append mb-3">
                <button  type="button" className="btn btn-primary w-100" onClick={fetchCurrentLocation}>
                {currentCoords.lat ? "Location Set" : "Fetch Location"}
                </button>
              </div>
            </div>
          </div>

          {/* Pickup City Input with Autocomplete */}
          <div className="col-md-4 position-relative">
            <input
              type="text"
              className="form-control"
              placeholder="Pickup City"
              value={pickupCity}
              onChange={(e) => {
                setPickupCity(e.target.value);
                fetchSuggestions(e.target.value, setPickupSuggestions, setLoadingPickup);

              }}
            />
            {loadingPickup && (
                <div className="position-absolute top-0 end-0 me-2 mt-2">
                  <div className="spinner-border spinner-border-sm text-primary" role="status" />
                </div>
            )}
            {pickupSuggestions.length > 0 && (
              <ul className="list-group position-absolute w-100 mt-1">
                {pickupSuggestions.map((suggestion, index) => (
                  <li
                    key={index}
                    className="list-group-item list-group-item-action"
                    onClick={() => {
                      setPickupCity(suggestion.display_name);
                      setPickupSuggestions([]);
                    }}
                  >
                    {suggestion.display_name}
                  </li>
                ))}
              </ul>
            )}
          </div>

            {/* Drop-off City Input with Autocomplete */}
            <div className="col-md-4 position-relative">
              <input
                type="text"
                className="form-control"
                placeholder="Drop-off City"
                value={dropoffCity}
                onChange={(e) => {
                  setDropoffCity(e.target.value);
                fetchSuggestions(e.target.value, setDropoffSuggestions, setLoadingDropoff);
                }}
              />

               {loadingDropoff && (
                  <div className="position-absolute top-0 end-0 me-2 mt-2">
                    <div className="spinner-border spinner-border-sm text-primary" role="status" />
                  </div>
              )}
            
              {dropoffSuggestions.length > 0 && (
                <ul className="list-group position-absolute w-100 mt-1">
                  {dropoffSuggestions.map((suggestion, index) => (
                    <li
                      key={index}
                      className="list-group-item list-group-item-action"
                      onClick={() => {
                        setDropoffCity(suggestion.display_name);
                        setDropoffSuggestions([]);
                      }}
                    >
                      {suggestion.display_name}
                    </li>
                  ))}
                </ul>
              )}
            </div>
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
            <div className="">
              <button className="btn btn-success w-20 " onClick={handlePlanTrip}>
                Plan Trip
              </button>
            </div>
        </div>


        <div id="map" className="w-100 h-64 mt-4 rounded shadow"></div>
      </div>
    </div>
  );
};

export default PlanTrip;
