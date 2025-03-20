import React, { useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { FiMenu, FiX, FiHome, FiMap, FiClipboard, FiSettings } from "react-icons/fi";

const Sidebar = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      {/* Sidebar Toggle Button */}
      <button
        className="fixed top-4 left-4 z-50 p-2 bg-blue-500 text-white rounded-full shadow-lg focus:outline-none"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <FiX size={24} /> : <FiMenu size={24} />}
      </button>

      {/* Sidebar */}
      <motion.div
        className="fixed top-0 left-0 h-full w-64 bg-gray-900 text-white shadow-xl flex flex-col p-5 z-40"
        initial={{ x: -300 }}
        animate={{ x: isOpen ? 0 : -300 }}
        transition={{ duration: 0.3 }}
      >
        <h2 className="text-xl font-bold mb-6">Trip Planner</h2>
        <nav className="flex flex-col gap-4">
          <Link to="/" className="flex items-center gap-3 p-2 hover:bg-gray-700 rounded">
            <FiHome size={20} /> Home
          </Link>
          <Link to="/trip" className="flex items-center gap-3 p-2 hover:bg-gray-700 rounded">
            <FiMap size={20} /> Plan Trip
          </Link>
          <Link to="/log-sheet" className="flex items-center gap-3 p-2 hover:bg-gray-700 rounded">
            <FiClipboard size={20} /> Log Sheet
          </Link>
          <Link to="/settings" className="flex items-center gap-3 p-2 hover:bg-gray-700 rounded">
            <FiSettings size={20} /> Settings
          </Link>
        </nav>
      </motion.div>
    </div>
  );
};

export default Sidebar;
