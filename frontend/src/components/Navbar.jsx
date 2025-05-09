import React from "react";
import { Link, useNavigate } from "react-router-dom";
import {ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
const Navbar = () => {
    const navigate = useNavigate();

    const handleLogout = () => {
        localStorage.removeItem("token");
        toast.success("Logout Successfully!");
        setTimeout(() => {
            navigate("/login");
        }, 2000);
    };

    return (
        <nav className="navbar navbar-expand-lg navbar-light bg-light">
            <ToastContainer/>
            <div className="container">
                <Link className="navbar-brand" to="/">Trip Planner</Link>
                <div className="navbar-login-register">
                    {!localStorage.getItem("token") ? (
                        <>
                            <Link className="login-btn btn btn-primary mx-2" to="/login">Login</Link>
                            <Link className="login-btn btn btn-success" to="/register">Register</Link>
                        </>
                    ) : (
                        <button className="login-btn btn btn-danger" onClick={handleLogout}>Logout</button>
                    )}
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
