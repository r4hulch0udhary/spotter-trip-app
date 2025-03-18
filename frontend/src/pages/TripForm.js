import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { Container, Form, Button } from "react-bootstrap";

const TripForm = () => {
  const [currentLocation, setCurrentLocation] = useState("");
  const [pickupLocation, setPickupLocation] = useState("");
  const [dropoffLocation, setDropoffLocation] = useState("");
  const [cycleHours, setCycleHours] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token"); // Get auth token
      const response = await axios.post(
        "http://127.0.0.1:8000/api/trip/",
        { current_location: currentLocation, pickup_location: pickupLocation, dropoff_location: dropoffLocation, cycle_hours: cycleHours },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      navigate(`/trip-details/${response.data.id}`);
    } catch (error) {
      alert("Error creating trip");
    }
  };

  return (
    <Container className="mt-5">
      <h2>Plan a Trip</h2>
      <Form onSubmit={handleSubmit}>
        <Form.Group className="mb-3">
          <Form.Label>Current Location</Form.Label>
          <Form.Control type="text" value={currentLocation} onChange={(e) => setCurrentLocation(e.target.value)} required />
        </Form.Group>
        <Form.Group className="mb-3">
          <Form.Label>Pickup Location</Form.Label>
          <Form.Control type="text" value={pickupLocation} onChange={(e) => setPickupLocation(e.target.value)} required />
        </Form.Group>
        <Form.Group className="mb-3">
          <Form.Label>Drop-off Location</Form.Label>
          <Form.Control type="text" value={dropoffLocation} onChange={(e) => setDropoffLocation(e.target.value)} required />
        </Form.Group>
        <Form.Group className="mb-3">
          <Form.Label>Cycle Hours</Form.Label>
          <Form.Control type="number" value={cycleHours} onChange={(e) => setCycleHours(e.target.value)} required />
        </Form.Group>
        <Button type="submit" variant="success">Plan Trip</Button>
      </Form>
    </Container>
  );
};

export default TripForm;
