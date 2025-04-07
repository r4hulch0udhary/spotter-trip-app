import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { MapContainer, TileLayer, Marker, Polyline, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import Sidebar from "../components/sidebar";
import polyline from "@mapbox/polyline";
import iconUrl from "leaflet/dist/images/marker-icon.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";
import {  ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// Custom Icons
const defaultIcon = new L.Icon({ iconUrl, shadowUrl: iconShadow, iconSize: [25, 41], iconAnchor: [12, 41] });
const pickupIcon = new L.Icon({ iconUrl: "/pickup-marker.png", iconSize: [32, 32] });
const dropoffIcon = new L.Icon({ iconUrl: "/dropOff.png", iconSize: [32, 32] });
const fuelIcon = new L.Icon({ iconUrl: "/gas-pump.png", iconSize: [28, 28] });
const restIcon = new L.Icon({ iconUrl: "/tea.png", iconSize: [28, 28] });
const sleepIcon = new L.Icon({ iconUrl: "/bed.png", iconSize: [28, 28] });

const TripSummaryPage = () => {
    const { tripId } = useParams();
    const [trip, setTrip] = useState(null);
    const [routeCoordinates, setRouteCoordinates] = useState([]);

useEffect(() => {
    const token = localStorage.getItem("token"); // Adjust based on how you're storing the token

    fetch(`http://localhost:8000/api/trip-summary/${tripId}/`, {
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
        },
    })
        .then((res) => {
            if (!res.ok) {
                throw new Error("Failed to fetch trip summary");
            }
            return res.json();
        })
        .then((data) => {
            setTrip(data);
            if (data?.route_data?.geometry) {
                const decodedCoords = polyline.decode(data.route_data.geometry).map(([lat, lng]) => [lat, lng]);
                setRouteCoordinates(decodedCoords);
            }
        })
        .catch((err) => {
            console.error("Error fetching trip:", err);
        });
}, [tripId]);



    // if (!trip) return <p className="text-center mt-5">Loading trip summary...</p>;
    console.log(trip,'trip');
    if (!trip) {
        return (
            <div className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center bg-black bg-opacity-75" style={{ zIndex: 1050 }}>
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                </div>
            </div>
        );
    }

    return (
        
        <div className="summary-container">
            <ToastContainer/>
            <Sidebar />

            <div className="container mt-4">
                <h2 className="mb-4"><span role="img" aria-label="truck">🚛</span> Trip Summary</h2>
                {/* Summary Card */}
                <div className="row g-4 mb-4">
                    <div className="col-md-6">
                        <div className="card shadow-sm">
                            <div className="card-body">
                                <h5 className="card-title">Trip Info</h5>
                                <p className="card-text mb-1"><strong>📍 Start Location:</strong> {trip.current_city}</p>
                                <p className="card-text mb-1"><strong>📦 Pickup:</strong> {trip.pickup_city}</p>
                                <p className="card-text mb-1"><strong>🏁 Drop-off:</strong> {trip.dropoff_city}</p>
                                <p className="card-text"><strong>📏 Total Distance:</strong> {trip.distance_km} km</p>
                            </div>
                        </div>
                    </div>
                    <div className="col-md-6">
                        <div className="card shadow-sm">
                            <div className="card-body">
                                <h5 className="card-title">Timing</h5>
                                <p className="card-text mb-1"><strong>⏳ Estimated Time:</strong> {Math.round(trip.duration_hours)} hrs</p>
                                <p className="card-text"><strong>🔄 Total Cycle Hours:</strong> {Math.round(trip.cycle_hours)} hrs</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Stop Schedule */}
                <div className="card shadow-sm mb-4">
                    <div className="card-body">
                        <h5 className="card-title">
                            <span role="img" aria-label="clock">🕒</span> Stop Schedule
                        </h5>
                        <div className="timeline">
                            {trip.stop_schedule?.map((stop, index) => (
                                <div key={index} className="timeline-item">
                                    <div className={`timeline-marker ${stop.type.toLowerCase().replace(" ", "-")}`}></div>
                                    <div className="timeline-content">
                                        <h6 className="mb-1">
                                            <span className="badge bg-primary">{stop.type}</span>
                                        </h6>
                                        <small className="text-muted">{stop.time}</small>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>


                {/* Map */}
                <div className="card shadow-sm mb-5">
                    <div className="card-body">
                        <h5 className="card-title">Trip Route</h5>
                        <div className="map-responsive" style={{ height: "500px", width: "100%" }}>
                            <MapContainer
                                center={routeCoordinates.length > 0 ? routeCoordinates[0] : [trip.pickup_latitude, trip.pickup_longitude]}
                                zoom={6}
                                style={{ height: "100%", width: "100%" }}
                            >
                                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                                {routeCoordinates.length > 1 && (
                                    <Polyline positions={routeCoordinates} color="blue" />
                                )}
                                {trip.current_latitude && trip.current_longitude && (
                                    <Marker position={[trip.current_latitude, trip.current_longitude]} icon={defaultIcon}>
                                        <Popup>🚛 Current Location</Popup>
                                    </Marker>
                                )}
                                <Marker position={[trip.pickup_latitude, trip.pickup_longitude]} icon={pickupIcon}>
                                    <Popup>📦 Pickup: {trip.pickup_city}</Popup>
                                </Marker>
                                <Marker position={[trip.dropoff_latitude, trip.dropoff_longitude]} icon={dropoffIcon}>
                                    <Popup>🏁 Drop-off: {trip.dropoff_city}</Popup>
                                </Marker>

                                {/* Mark fuel, break, sleep stops */}
                                {trip.stop_schedule?.map((stop, index) => {
                                    if (stop.latitude && stop.longitude) {
                                        let icon = null;
                                        let popupText = "";

                                        switch (stop.type) {
                                            case "Fuel Stop":
                                                icon = fuelIcon;
                                                popupText = "⛽ Fuel Stop";
                                                break;
                                            case "Break":
                                                icon = restIcon;
                                                popupText = "☕ Break Stop";
                                                break;
                                            case "Sleep":
                                                icon = sleepIcon;
                                                popupText = "🛌 Sleep Stop";
                                                break;
                                            default:
                                                break;
                                        }

                                        return icon ? (
                                            <Marker key={index} position={[stop.latitude, stop.longitude]} icon={icon}>
                                                <Popup>
                                                    {popupText}<br />{stop.time}
                                                </Popup>
                                            </Marker>
                                        ) : null;
                                    }
                                    return null;
                                })}
                            </MapContainer>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TripSummaryPage;
