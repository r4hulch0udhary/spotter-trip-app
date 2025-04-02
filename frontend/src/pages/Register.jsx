import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "react-phone-input-2/lib/style.css"; // Import phone input styles
import { FaEye, FaEyeSlash } from "react-icons/fa"; // Import icons for password toggle
import "../styles/login.css"; // Adjust path as needed

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
        if (password !== confirmPassword) {
            alert("Passwords do not match!");
            return;
        }
        try {
            await axios.post("http://localhost:8000/api/register/", {
                username,
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
        <div className="signup-container">
            <div className="signup-card">
                <h2>User Sign Up</h2>
                <p>Please enter your details below</p>
                <form onSubmit={handleSubmit}>
                    <input 
                        type="text" 
                        className="form-control" 
                        placeholder="First Name" 
                        value={first_name} 
                        onChange={(e) => setFirst_Name(e.target.value)} 
                        required 
                    />
                    <input 
                        type="text" 
                        className="form-control" 
                        placeholder="Last Name" 
                        value={last_name} 
                        onChange={(e) => setLast_Name(e.target.value)} 
                        required 
                    />
                    <input 
                        type="text" 
                        className="form-control" 
                        placeholder="Username" 
                        value={username} 
                        onChange={(e) => setUsername(e.target.value)} 
                        required 
                    />
                    <input 
                        type="email" 
                        className="form-control" 
                        placeholder="Email" 
                        value={email} 
                        onChange={(e) => setEmail(e.target.value)} 
                        required 
                    />
                    <div className="password-field">
                        <input 
                            type={showPassword ? "text" : "password"} 
                            className="form-control" 
                            placeholder="Password" 
                            value={password} 
                            onChange={(e) => setPassword(e.target.value)} 
                            required 
                        />
                        <span onClick={() => setShowPassword(!showPassword)}>
                            {showPassword ? <FaEyeSlash /> : <FaEye />}
                        </span>
                    </div>

                    <div className="password-field">
                        <input 
                            type={showConfirmPassword ? "text" : "password"} 
                            className="form-control" 
                            placeholder="Confirm Password" 
                            value={confirmPassword} 
                            onChange={(e) => setConfirmPassword(e.target.value)} 
                            required 
                        />
                        <span onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                            {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                        </span>
                    </div>

                    <button type="submit" className="btn">Sign Up</button>
                </form>
            </div>
        </div>
    );
};

export default Register;
