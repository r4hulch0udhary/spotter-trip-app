import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import Sidebar from "../components/sidebar";

const ELDLogPage = () => {
    const [trips, setTrips] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const tripsPerPage = 5;

    useEffect(() => {
        const token = localStorage.getItem("token"); 

        fetch(`http://localhost:8000/api/eld-logs/`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`,
            },
        })
            .then(res => {
                if (!res.ok) {
                    throw new Error("Failed to fetch ELD logs");
                }
                return res.json();
            })
            .then(data => {
                setTrips(data?.trips || []);
            })
            .catch(err => console.error("Error fetching ELD logs:", err));
    }, []);


    const indexOfLastTrip = currentPage * tripsPerPage;
    const indexOfFirstTrip = indexOfLastTrip - tripsPerPage;
    const currentTrips = trips.slice(indexOfFirstTrip, indexOfLastTrip);
    const totalPages = Math.ceil(trips?.length / tripsPerPage);

    const nextPage = () => {
        if (currentPage < totalPages) setCurrentPage(currentPage + 1);
    };

    const prevPage = () => {
        if (currentPage > 1) setCurrentPage(currentPage - 1);
    };
    

    return (
    <div className="home-container d-flex">
            <Sidebar />

            <div className="flex-grow-1 p-4" style={{ minHeight: "100vh", backgroundColor: "#f8f9fa" }}>
                <div className="container-fluid">
                    <h2 className="mb-4 fw-bold text-primary">📋 ELD Logs</h2>

                    <div className="bg-white p-4 rounded shadow-sm">
                        <div className="table-responsive">
                            <table className="table table-borderless align-left text-wrap text-break text-start">
                                <thead>
                                    <tr className="fw-semibold text-secondary">
                                        <th>#</th>
                                        <th>Pickup</th>
                                        <th>Drop-off</th>
                                        <th>Distance (km)</th>
                                        <th>Travel Time</th>
                                        <th>Cycle Hours</th>
                                        <th>Summary</th>
                                        <th>ELD Logs</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {currentTrips.length > 0 ? (
                                        currentTrips.map((trip, index) => (
                                            <tr key={trip.id}>
                                                <td>{indexOfFirstTrip + index + 1}</td>
                                                <td className="text-break">{trip.pickup_city}</td>
                                                <td className="text-break">{trip.dropoff_city}</td>
                                                <td>{trip.distance_km?.toFixed(1)} km</td>
                                                <td>{Math.round(trip.duration_hours)} hrs</td>
                                                <td>{Math.round(trip.cycle_hours)} hrs</td>

                                                <td>
                                                    <Link to={`/tripSummary/${trip.id}`} className="login-btn  btn btn-sm btn-outline-primary">
                                                        📜 Summary
                                                    </Link>
                                                </td>
                                                <td>
                                                    <Link to={`/eldLogs/${trip.id}`} className="login-btn  btn btn-sm btn-outline-dark">
                                                        📄 Logs
                                                    </Link>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="8" className="text-center text-muted py-4">
                                                No trip logs available.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {totalPages > 1 && (
                            <div className="d-flex justify-content-between align-items-center mt-4">
                                <button className="btn btn-outline-secondary" onClick={prevPage} disabled={currentPage === 1}>
                                    ◀ Prev
                                </button>
                                <span className="fw-semibold">
                                    Page {currentPage} of {totalPages}
                                </span>
                                <button className="btn btn-outline-secondary" onClick={nextPage} disabled={currentPage === totalPages}>
                                    Next ▶
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ELDLogPage;
