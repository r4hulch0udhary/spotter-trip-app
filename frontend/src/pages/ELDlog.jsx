import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import Sidebar from "../components/sidebar";

const ELDLogPage = () => {
    const [trips, setTrips] = useState([]);
    const [logs, setLogs] = useState([]);
    
    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const tripsPerPage = 10; // Number of trips per page

    useEffect(() => {
        fetch(`http://localhost:8000/api/eld-logs/`)
            .then(res => res.json())
            .then(data => {
                setTrips(data?.trips);
                setLogs(data?.logs);
            })
            .catch(err => console.error(err));
    }, []);

    // Calculate the index range for pagination
    const indexOfLastTrip = currentPage * tripsPerPage;
    const indexOfFirstTrip = indexOfLastTrip - tripsPerPage;
    const currentTrips = trips?.slice(indexOfFirstTrip, indexOfLastTrip);

    // Handle pagination
    const totalPages = Math?.ceil(trips?.length / tripsPerPage);
    
    const nextPage = () => {
        if (currentPage < totalPages) {
            setCurrentPage(currentPage + 1);
        }
    };

    const prevPage = () => {
        if (currentPage > 1) {
            setCurrentPage(currentPage - 1);
        }
    };

    return (
        <div className="home-container">
            <div className="container">
            <Sidebar />
                <h3 className="text-center ">ELD Logs</h3>
                <div className="table-responsive">
                    <table className="table table-striped table-bordered table-hover">
                        <thead className="table-dark">
                            <tr>
                                <th>Trip ID</th>
                                <th>Pickup Location</th>
                                <th>Drop-off Location</th>
                                <th>Total Distance (km)</th>
                                <th>Estimated Travel Time (hrs)</th>
                                <th>Total Cycle Hours</th>
                                <th>Summary</th>
                            </tr>
                        </thead>
                        <tbody>
                            {currentTrips?.length > 0 ? (
                                currentTrips?.map((trip) => (
                                    <tr key={trip?.id}>
                                        <td>{trip?.id}</td>
                                        <td>{trip?.pickup_city}</td>
                                        <td>{trip?.dropoff_city}</td>
                                        <td>{trip?.distance_km}</td>
                                        <td>{trip?.duration_hours}</td>
                                        <td>{trip?.cycle_hours}</td>
                                        <td>
                                            <Link to={`/tripSummary/${trip?.id}`} className="btn btn-primary btn-sm">
                                                📜 View Summary
                                            </Link>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="7" className="text-center">No trip details available...</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Controls */}
                <div className="d-flex justify-content-between mt-3">
                    <button className="btn btn-secondary" onClick={prevPage} disabled={currentPage === 1}>
                        ◀ Previous
                    </button>
                    <span>Page {currentPage} of {totalPages}</span>
                    <button className="btn btn-secondary" onClick={nextPage} disabled={currentPage === totalPages}>
                        Next ▶
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ELDLogPage;
