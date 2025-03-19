import { useState, useEffect } from "react";
import axios from "axios";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";

const LocationFetcher = () => {
  const [location, setLocation] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!("geolocation" in navigator)) {
      setError("Geolocation is not supported by this browser.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setLocation({ latitude, longitude });

        try {
          const token = localStorage.getItem("token");
          if (!token) {
            console.error("No authentication token found.");
            return;
          }

          // ✅ Send latitude & longitude as query parameters in GET request
          const response = await axios.get(
            `http://localhost:8000/api/location/?latitude=${latitude}&longitude=${longitude}`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );

          console.log("Location sent successfully:", response.data);
        } catch (err) {
          console.error("Error sending location:", err.response ? err.response.data : err.message);
        }
      },
      (err) => {
        setError(err.message);
      }
    );
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <h2 className="text-2xl font-bold mb-4">User Location</h2>
      {error ? (
        <p className="text-red-500">{error}</p>
      ) : location ? (
        <>
          <p className="mb-2">📍 Latitude: {location.latitude}, Longitude: {location.longitude}</p>
          <div className="w-full max-w-lg h-96">
            <MapContainer
              key={`${location.latitude}-${location.longitude}`} // Forces re-render when location updates
              center={[location.latitude, location.longitude]}
              zoom={13}
              className="h-full w-full rounded-lg shadow-lg"
            >
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              <Marker position={[location.latitude, location.longitude]}>
                <Popup>You are here</Popup>
              </Marker>
            </MapContainer>
          </div>
        </>
      ) : (
        <p>Fetching location...</p>
      )}
    </div>
  );
};

export default LocationFetcher;
