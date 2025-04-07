import React from "react";
import Sidebar from "../components/sidebar";
import { motion } from "framer-motion";
import "../pages/home/home.css"; // Optional custom styles
import { ToastContainer } from "react-toastify";

const Home = () => {
  return (
    <div className="d-flex">
      <ToastContainer/>
      <Sidebar />
      <div className="flex-grow-1 position-relative vh-100 overflow-hidden">
        {/* Background Image */}
        <div
          className="position-absolute top-0 start-0 w-100 h-100 bg-cover bg-center"
          style={{
            backgroundImage: "url('/truck-bg.jpg')",
            zIndex: 0,
            filter: "brightness(0.6)",
          }}
        />

        {/* Content Overlay */}
        <div className="position-relative d-flex flex-column justify-content-center align-items-center text-white text-center h-100 px-4" style={{ zIndex: 1 }}>
          <motion.h1
            className="display-3 fw-bold"
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1 }}
          >
            Plan Your Trucking Journey
          </motion.h1>
          <motion.p
            className="lead mt-3 w-75"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 1 }}
          >
            From routes to rest stops, organize your trips with precision and ease.
          </motion.p>

          <motion.a
            href="/trip"
            className="btn btn-lg btn-primary rounded-pill px-5 py-3 mt-4 shadow"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Plan Trip
          </motion.a>
        </div>

        {/* Features Section */}
        <motion.div
          className="position-absolute bottom-0 w-100 d-flex justify-content-center mb-4"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1, duration: 1 }}
          style={{ zIndex: 2 }}
        >
          <div className="bg-white bg-opacity-75 rounded shadow-lg p-4 d-flex gap-4 flex-wrap justify-content-center">
            <FeatureCard icon="🚛" title="Smart Route Planning" />
            <FeatureCard icon="⛽" title="Fuel & Rest Stops" />
            <FeatureCard icon="📍" title="Live Location & Maps" />
            <FeatureCard icon="📄" title="ELD Logs & Reports" />
          </div>
        </motion.div>
      </div>
    </div>
  );
};

const FeatureCard = ({ icon, title }) => (
  <div className="d-flex flex-column align-items-center bg-light px-3 py-2 rounded shadow-sm text-dark" style={{ minWidth: "150px" }}>
    <span className="fs-1">{icon}</span>
    <p className="mt-2 fw-semibold text-center">{title}</p>
  </div>
);

export default Home;
