import React from "react";
import { Link, useNavigate } from "react-router-dom";

const Navbar = () => {
    const navigate = useNavigate();

    const handleLogout = () => {
        localStorage.removeItem("token");
        navigate("/login");
    };

    return (
        <nav className="navbar navbar-expand-lg navbar-light bg-light">
            <div className="container">
                <Link className="navbar-brand" to="/">Trip Planner</Link>
                <div>
                    {!localStorage.getItem("token") ? (
                        <>
                            <Link className="btn btn-primary mx-2" to="/login">Login</Link>
                            <Link className="btn btn-success" to="/register">Register</Link>
                        </>
                    ) : (
                        <button className="btn btn-danger" onClick={handleLogout}>Logout</button>
                    )}
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
