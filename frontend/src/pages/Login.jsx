import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "../styles/login.css"; // Adjust path as needed

const Login = () => {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const res = await axios.post("http://localhost:8000/api/login/", { username, password });
            console.log(res,'res');
            
            localStorage.setItem("token", res.data.access);
            navigate("/");
        } catch (error) {
            // alert("Invalid credentials");
        }
    };

    return (
        <div className="signup-container">
            <div className="signup-card">
                <h2>Login</h2>
                <form onSubmit={handleSubmit}>
                    <input 
                        type="text" 
                        className="form-control" 
                        placeholder="Username" 
                        value={username} 
                        onChange={(e) => setUsername(e.target.value)} 
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
                    <button type="submit" className="btn">Login</button>
                </form>
            </div>
        </div>
    );
};

export default Login;