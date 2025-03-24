import React, { useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { FiMenu, FiX, FiHome, FiMap, FiClipboard, FiSettings } from "react-icons/fi";

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
        <h2 className="sidebar-title">Trip Planner</h2>
        <nav className="sidebar-nav">
          <Link to="/" className="sidebar-item">
            <FiHome size={20} /> Home
          </Link>
          <Link to="/trip" className="sidebar-item">
            <FiMap size={20} /> Plan Trip
          </Link>
          <Link to="/log-sheet" className="sidebar-item">
            <FiClipboard size={20} /> Log Sheet
          </Link>
          <Link to="/settings" className="sidebar-item">
            <FiSettings size={20} /> Settings
          </Link>
        </nav>
      </motion.div>
    </div>
  );
};

export default Sidebar;
