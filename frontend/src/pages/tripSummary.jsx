import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { MapContainer, TileLayer, Marker, Polyline, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import Sidebar from "../components/sidebar";
import polyline from "@mapbox/polyline";

// Fix Leaflet marker issue
import iconUrl from "leaflet/dist/images/marker-icon.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";

const fuelIcon = new L.Icon({
    iconUrl: "/gas-pump.png",
    iconSize: [28, 28],
});

// Define custom icons
const defaultIcon = new L.Icon({
    iconUrl,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
});

const pickupIcon = new L.Icon({
    iconUrl: "/pickup-marker.png",
    iconSize: [32, 32],
});

const dropoffIcon = new L.Icon({
    iconUrl: "/dropOff.png",
    iconSize: [32, 32],
});

const stopIcon = new L.Icon({
    iconUrl: "/stop-marker.png",
    iconSize: [28, 28],
});

const TripSummaryPage = () => {
    const { tripId } = useParams();
    const [trip, setTrip] = useState(null);
    const [routeCoordinates, setRouteCoordinates] = useState([]);

    useEffect(() => {
        fetch(`http://localhost::8000/api/trip-summary/${tripId}/`)
            .then((res) => res.json())
            .then((data) => {
                setTrip(data);
                if (data?.route_data?.geometry) {
                    const decodedCoords = polyline.decode(data?.route_data?.geometry).map(([lat, lng]) => [lat, lng]);
                    setRouteCoordinates(decodedCoords);
                }
            })
            .catch((err) => console.error("Error fetching trip:", err));
    }, [tripId]);

    if (!trip) return <p className="loading-text">Loading trip summary...</p>;

    return (
        <div className="home-container">
            <Sidebar />
            <div className="container trip-summary-container">
                <h1 className="trip-title">🚛 Trip Summary</h1>

                {/* Summary Card */}
                <div className="summary-container">
                    <div className="summary-column">
                        <div className="summary-item">
                            <span className="summary-icon">📍</span>
                            <span className="summary-text"><strong>Start Location:</strong> {trip.pickup_city}</span>
                        </div>
                        <div className="summary-item">
                            <span className="summary-icon">📦</span>
                            <span className="summary-text"><strong>Pickup:</strong> {trip.pickup_city}</span>
                        </div>
                        <div className="summary-item">
                            <span className="summary-icon">🏁</span>
                            <span className="summary-text"><strong>Drop-off:</strong> {trip.dropoff_city}</span>
                        </div>
                        <div className="summary-item">
                            <span className="summary-icon">📏</span>
                            <span className="summary-text"><strong>Total Distance:</strong> {trip.distance_km} km</span>
                        </div>
                    </div>

                    <div className="summary-column">
                        <div className="summary-item">
                            <span className="summary-icon">⏳</span>
                            <span className="summary-text"><strong>Estimated Travel Time:</strong> {trip.duration_hours} hours</span>
                        </div>
                        <div className="summary-item">
                            <span className="summary-icon">🔄</span>
                            <span className="summary-text"><strong>Total Cycle Hours:</strong> {trip.cycle_hours} hours</span>
                        </div>
                        <div className="summary-item">
                            <span className="summary-icon">🚛</span>
                            <span className="summary-text"><strong>Vehicle Type:</strong> {trip.vehicle_type}</span>
                        </div>
                        <div className="summary-item">
                            <span className="summary-icon">💰</span>
                            <span className="summary-text"><strong>Estimated Cost:</strong> ${trip.estimated_cost}</span>
                        </div>
                    </div>
                </div>

               

                {/* Map Section */}
                <MapContainer center={routeCoordinates.length > 0 ? routeCoordinates[0] : [trip.pickup_latitude, trip.pickup_longitude]} zoom={6} className="trip-map">
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

                    {/* Route Line */}
                    {routeCoordinates.length > 1 && (
                        <Polyline positions={routeCoordinates} color="blue" />
                    )}

                    {/* Current Location Marker */}
                    {trip.current_latitude && trip.current_longitude && (
                        <Marker position={[trip?.current_latitude, trip.current_longitude]} icon={defaultIcon}>
                            <Popup>🚛 Current Location</Popup>
                        </Marker>
                    )}

                    {/* Pickup Marker */}
                    <Marker position={[trip?.pickup_latitude, trip.pickup_longitude]} icon={pickupIcon}>
                        <Popup>📦 Pickup: {trip.pickup_city}</Popup>
                    </Marker>

                    {/* Dropoff Marker */}
                    <Marker position={[trip.dropoff_latitude, trip.dropoff_longitude]} icon={dropoffIcon}>
                        <Popup>🏁 Drop-off: {trip.dropoff_city}</Popup>
                    </Marker>

                    {/* Stops (Rest Stops & Fuel Stops) */}
                    {trip.fuel_stops?.map((stop, index) => (
                        <Marker key={index} position={[stop.latitude, stop.longitude]} icon={stop.stop_type === "fuel" ? fuelIcon : stopIcon}>
                            <Popup>🛑 {stop.stop_type === "fuel" ? "Fuel Stop ⛽" : stop.stop_type} at {stop.city}</Popup>
                        </Marker>
                    ))}
                </MapContainer>
            </div>
        </div>
    );
};

export default TripSummaryPage;
