import React, { useState } from "react";
import axios from "axios";

const TripPlanner = () => {
  const [pickupCity, setPickupCity] = useState("");
  const [dropoffCity, setDropoffCity] = useState("");
  const [cycleHours, setCycleHours] = useState(50);
  const [loading, setLoading] = useState(false);
  const [tripData, setTripData] = useState(null);
  const [error, setError] = useState(null);

  const fetchCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        console.log("Current Location:", latitude, longitude);
        setPickupCity(""); // Clear manual entry
        sendLocationToBackend(latitude, longitude);
      },
      (error) => {
        console.error("Error getting location:", error);
        alert("Failed to get current location.");
      }
    );
  };

  const sendLocationToBackend = async (latitude, longitude) => {
    try {
      await axios.post("http://localhost:8000/api/trip/", {
        latitude,
        longitude,
      }, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      alert("Location updated!");
    } catch (error) {
      console.error("Error updating location:", error.response);
      alert("Failed to update location.");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await axios.post("http://localhost:8000/api/trip/", {
        pickup_city: pickupCity || null,
        dropoff_city: dropoffCity,
        cycle_hours: cycleHours,
      }, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
      });

      setTripData(response.data);
    } catch (error) {
      console.error("Error planning trip:", error);
      setError(error.response?.data?.error || "Failed to plan trip.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white shadow-lg rounded-lg">
      <h2 className="text-2xl font-bold mb-4">Plan Your Trip</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block font-medium">Pickup City (optional):</label>
          <input
            type="text"
            className="w-full p-2 border rounded"
            placeholder="Enter pickup city or use current location"
            value={pickupCity}
            onChange={(e) => setPickupCity(e.target.value)}
          />
          <button
            type="button"
            className="mt-2 bg-blue-500 text-white px-4 py-2 rounded"
            onClick={fetchCurrentLocation}
          >
            Use Current Location
          </button>
        </div>

        <div>
          <label className="block font-medium">Drop-off City:</label>
          <input
            type="text"
            className="w-full p-2 border rounded"
            placeholder="Enter drop-off city"
            value={dropoffCity}
            onChange={(e) => setDropoffCity(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="block font-medium">Cycle Hours:</label>
          <input
            type="number"
            className="w-full p-2 border rounded"
            value={cycleHours}
            onChange={(e) => setCycleHours(e.target.value)}
          />
        </div>

        <button type="submit" className="bg-green-500 text-white px-4 py-2 rounded w-full" disabled={loading}>
          {loading ? "Planning Trip..." : "Plan Trip"}
        </button>
      </form>

      {error && <p className="text-red-500 mt-4">{error}</p>}

      {tripData && (
        <div className="mt-6 p-4 bg-gray-100 rounded">
          <h3 className="text-lg font-bold">Trip Details</h3>
          <p><strong>Pickup:</strong> {tripData.pickup_city}</p>
          <p><strong>Drop-off:</strong> {tripData.dropoff_city}</p>
          <p><strong>Distance:</strong> {tripData.distance_km} km</p>
          <p><strong>Duration:</strong> {tripData.formatted_duration}</p>
        </div>
      )}
    </div>
  );
};

export default TripPlanner;
