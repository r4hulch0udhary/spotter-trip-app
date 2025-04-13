import React, { useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { FiMenu, FiX, FiHome, FiMap, FiClipboard } from "react-icons/fi";

const Sidebar = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="sidebar-container">
      {/* Sidebar Toggle Button */}
      <button
        className="sidebar-toggle"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <FiX size={24} /> : <FiMenu size={24} />}
      </button>

      {/* Sidebar Menu */}
      <motion.div
        className="sidebar"
        initial={{ x: -250 }}
        animate={{ x: isOpen ? 0 : -250 }}
        transition={{ duration: 0.3 }}
      >
        <h2 className="sidebar-title mt-5">Trip Planner</h2>
        <nav className="sidebar-nav">
          <Link to="/" className="sidebar-item">
            <FiHome size={20} /> Home
          </Link>
          <Link to="/trip" className="sidebar-item">
            <FiMap size={20} /> Plan Trip
          </Link>
          <Link to="/tripLogs" className="sidebar-item">
            <FiClipboard size={20} /> ELD Logs
          </Link>
          <Link to="/pastLogs" className="sidebar-item">
            <FiClipboard size={20} /> Past Logs
          </Link>

        </nav>
      </motion.div>
    </div>
  );
};

export default Sidebar;
