import { useState } from "react";
import axios from "axios";

const PlanTrip = () => {
  const [pickupCity, setPickupCity] = useState("");
  const [dropoffCity, setDropoffCity] = useState("");
  const [cycleHours, setCycleHours] = useState(50);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [tripData, setTripData] = useState(null);

  const handlePlanTrip = async () => {
    if (!dropoffCity.trim()) {
      alert("Please enter a drop-off location.");
      return;
    }
  
    setLoading(true);
    setError(null);
  
    const sendTripData = async (latitude = null, longitude = null) => {
      const tripData = {
        pickup_city: pickupCity.trim() || null, // Use entered city or geolocation
        dropoff_city: dropoffCity.trim(),
        cycle_hours: Number(cycleHours),
        current_latitude: latitude,
        
        current_longitude: longitude,
    };
    // console.log(tripData, "current_latitude"); // Corrected logging
  
      try {
        const response = await axios.post(
          "http://localhost:8000/api/trip/",
          tripData,
          { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
        );
  
        setTripData(response.data);
        alert("Trip successfully created!");
      } catch (error) {
        console.error("Error planning trip:", error);
        setError(error.response?.data?.error || "Failed to create trip.");
      } finally {
        setLoading(false);
      }
    };
  
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
        console.error("Geolocation Error===============:", position);

          setPickupCity("Current Location"); // Update UI to reflect this
          sendTripData(position.coords.latitude, position.coords.longitude);
        },
        (error) => {
          console.error("Geolocation Error:", error);
          alert("Geolocation failed. Please enter a pickup city manually.");
          setLoading(false);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    } else {
      sendTripData();
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white shadow-lg rounded-lg">
      <h2 className="text-2xl font-bold mb-4">Plan a Trip</h2>

      <div className="space-y-4">
        <input
          type="text"
          className="w-full p-2 border rounded"
          placeholder="Pickup City (optional)"
          value={pickupCity}
          onChange={(e) => setPickupCity(e.target.value)}
        />
        <input
          type="text"
          className="w-full p-2 border rounded"
          placeholder="Drop-off City"
          value={dropoffCity}
          onChange={(e) => setDropoffCity(e.target.value)}
          required
        />
        <input
          type="number"
          className="w-full p-2 border rounded"
          value={cycleHours}
          onChange={(e) => setCycleHours(e.target.value ? Number(e.target.value) : "")}
        />

        <button
          className="bg-green-500 text-white px-4 py-2 rounded w-full"
          onClick={handlePlanTrip}
          disabled={loading}
        >
          {loading ? "Planning..." : "Plan Trip"}
        </button>
      </div>

      {error && <p className="text-red-500 mt-4">{error}</p>}

      {tripData && (
        <div className="mt-6 p-4 bg-gray-100 rounded">
          <h3 className="text-lg font-bold">Trip Details</h3>
          <p><strong>Pickup:</strong> {tripData.pickup_city || "Using Current Location"}</p>
          <p><strong>Drop-off:</strong> {tripData.dropoff_city}</p>
          <p><strong>Distance:</strong> {tripData.distance_km} km</p>
          <p><strong>Duration:</strong> {tripData.formatted_duration}</p>
        </div>
      )}
    </div>
  );
};

export default PlanTrip;
