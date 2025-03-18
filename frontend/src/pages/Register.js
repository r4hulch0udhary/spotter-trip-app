import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import '../styles/login.css'; // Import the same CSS file for consistent styling

const Register = () => {
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [first_name, setFirst_Name] = useState("");
    const [last_name, setLast_Name] = useState("");
    const [password, setPassword] = useState("");
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await axios.post("http://127.0.0.1:8000/api/register/", {
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
        <div className="login-container">
            <div className="login-card">
                <h2>Register</h2>
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
                    <input 
                        type="password" 
                        className="form-control" 
                        placeholder="Password" 
                        value={password} 
                        onChange={(e) => setPassword(e.target.value)} 
                        required 
                    />
                    <button type="submit" className="btn">Register</button>
                </form>
            </div>
        </div>
    );
};

export default Register;