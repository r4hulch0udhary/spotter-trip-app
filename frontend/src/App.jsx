import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import TripForm from "./pages/TripForm";
import Home from "./pages/Home";
import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";
import ELDLogPage from "./pages/ELDlog";
import TripSummaryPage from "./pages/tripSummary";
import PastLogPage from "./pages/pastLogs";

function App() {
  return (
    <Router>
      <Navbar />
      <div >
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/trip" element={<TripForm />} />
          <Route path="/tripLogs" element={<ELDLogPage />} />
          <Route path="/pastLogs" element={<PastLogPage />} />
          <Route path="/tripSummary/:tripId" element={<TripSummaryPage />} />
          <Route path="/" element={<ProtectedRoute />}>
            
            <Route index element={<Home />} />
          </Route>
        </Routes>
      </div>
    </Router>
  );
}

export default App;
