import React, { useEffect, useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import Sidebar from "../components/sidebar";

const PastLogPage = () => {
    const [trips, setTrips] = useState([]);
    
    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const tripsPerPage = 10; // Number of trips per page
    
    useEffect(() => {
        const token = localStorage.getItem("token");

        fetch(`${process.env.REACT_APP_BACKEND_URL}/api/past-logs/`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
        })
        .then(res => res.json())
        .then(data => {
            setTrips(data?.past_trips);
        })
        .catch(err => console.error("Error fetching past logs:", err));
    }, []);

    // Calculate the index range for pagination
    const indexOfLastTrip = currentPage * tripsPerPage;
    const indexOfFirstTrip = indexOfLastTrip - tripsPerPage;
    const currentTrips = trips?.slice(indexOfFirstTrip, indexOfLastTrip);

    // Handle pagination
    const totalPages = Math.ceil(trips?.length / tripsPerPage);
    
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
                <h3 className="text-center mt-3">Past Trip Logs</h3>

                {/* Table List View */}

                <div className="bg-white p-4 rounded shadow-sm">
                    <div className="table-responsive">
                        <table className="table table-borderless align-left text-wrap text-start text-break">

                        <thead >
                                <tr className="fw-semibold text-secondary">
                                <th>Trip ID</th>
                                <th>Pickup City</th>
                                <th>Dropoff City</th>
                                <th>Distance (km)</th>
                                <th>Duration (hours)</th>
                                <th>Start Time</th>
                                {/* <th>Actions</th> */}
                            </tr>
                        </thead>
                        <tbody>
                            {currentTrips?.map((trip, index) => (
                                <tr key={index}>
                                    <td>{trip.id}</td>
                                    <td>{trip.pickup_city}</td>
                                    <td>{trip.dropoff_city}</td>
                                    <td>{trip.distance_km}</td>
                                    <td>{trip.duration_hours}</td>
                                    <td>{new Date(trip.start_time).toLocaleString()}</td>
                                    {/* <td>
                                        <Link to={`/trip/${trip.id}`} className="btn btn-sm btn-primary">
                                            View Details
                                        </Link>
                                    </td> */}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                </div>

                {/* Pagination Controls */}
                {trips?.length > 0 && totalPages > 1 && (
                <div className="d-flex justify-content-between mt-3">
                    <button className="btn btn-secondary" onClick={prevPage} disabled={currentPage === 1}>
                        ◀ Previous
                    </button>
                    <span>Page {currentPage} of {totalPages}</span>
                    <button className="btn btn-secondary" onClick={nextPage} disabled={currentPage === totalPages}>
                        Next ▶
                    </button>
                </div>
                )}
            </div>
        </div>
    );
};

export default PastLogPage;
