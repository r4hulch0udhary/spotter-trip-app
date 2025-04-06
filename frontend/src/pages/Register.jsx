import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import "bootstrap/dist/css/bootstrap.min.css";

const Register = () => {
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [first_name, setFirst_Name] = useState("");
    const [last_name, setLast_Name] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setUsername(email);
        if (password !== confirmPassword) {
            alert("Passwords do not match!");
            return;
        }
        try {
            await axios.post("http://localhost:8000/api/register/", {
                username: email, // using email as username
                email,
                password,
                first_name,
                last_name,
            });
            navigate("/login");
        } catch (error) {
            alert("Registration failed");
        }
    };

    return (
        <div className="login-container">
            <div className="container mt-5">
                <div className="row justify-content-center">
                    <div className="col-md-6">
                        <div className="card shadow">
                            <div className="card-body p-4">
                                <h3 className="text-center mb-3">Create Account</h3>
                                <form onSubmit={handleSubmit}>
                                    <div className="form-group mb-3">
                                        <label>First Name</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            placeholder="Enter first name"
                                            value={first_name}
                                            onChange={(e) => setFirst_Name(e.target.value)}
                                            required
                                        />
                                    </div>
                                    <div className="form-group mb-3">
                                        <label>Last Name</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            placeholder="Enter last name"
                                            value={last_name}
                                            onChange={(e) => setLast_Name(e.target.value)}
                                            required
                                        />
                                    </div>
                                    <div className="form-group mb-3">
                                        <label>Email</label>
                                        <input
                                            type="email"
                                            className="form-control"
                                            placeholder="Enter email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            required
                                        />
                                    </div>
                                    <div className="form-group mb-3">
                                        <label>Password</label>
                                        <div className="input-group">
                                            <input
                                                type={showPassword ? "text" : "password"}
                                                className="form-control"
                                                placeholder="Enter password"
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                required
                                            />
                                            <span
                                                className="input-group-text"
                                                onClick={() => setShowPassword(!showPassword)}
                                                style={{ cursor: "pointer" }}
                                            >
                                                {showPassword ? <FaEyeSlash /> : <FaEye />}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="form-group mb-4">
                                        <label>Confirm Password</label>
                                        <div className="input-group">
                                            <input
                                                type={showConfirmPassword ? "text" : "password"}
                                                className="form-control"
                                                placeholder="Confirm password"
                                                value={confirmPassword}
                                                onChange={(e) => setConfirmPassword(e.target.value)}
                                                required
                                            />
                                            <span
                                                className="input-group-text"
                                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                                style={{ cursor: "pointer" }}
                                            >
                                                {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                                            </span>
                                        </div>
                                    </div>
                                    <button type="submit" className="btn btn-primary w-100">
                                        Register
                                    </button>
                                </form>
                            </div>
                        <p className="text-center mt-3">
                            Already have an account? <a href="/login">Login here</a>
                        </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Register;
