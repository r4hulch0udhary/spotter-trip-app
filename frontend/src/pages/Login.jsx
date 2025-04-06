import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";

const Login = () => {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const res = await axios.post("http://localhost:8000/api/login/", { username, password });
            localStorage.setItem("token", res.data.access);
            navigate("/");
        } catch (error) {
            alert("Invalid credentials");
        }
    };

    return (
        <div className="login-container">
            <div className="container mt-5">
                <div className="row justify-content-center">
                    <div className="col-md-6">
                        <div className="card shadow">
                            <div className="card-body p-4">
                                <h3 className="text-center mb-4">Login</h3>
                                <form onSubmit={handleSubmit}>
                                    <div className="form-group mb-3">
                                        <label>Email</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            placeholder="Enter Email"
                                            value={username}
                                            onChange={(e) => setUsername(e.target.value)}
                                            required
                                        />
                                    </div>
                                    <div className="form-group mb-4">
                                        <label>Password</label>
                                        <input
                                            type="password"
                                            className="form-control"
                                            placeholder="Enter password"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            required
                                        />
                                    </div>
                                    <button type="submit" className="btn btn-primary w-100">
                                        Login
                                    </button>
                                </form>
                            </div>
                        <p className="text-center mt-3">
                            Don’t have an account? <a href="/register">Sign up here</a>
                        </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
