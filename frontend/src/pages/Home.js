import React from "react";
import { motion } from "framer-motion";

const Home = () => {
  return (
    <div className="relative h-screen w-full bg-cover bg-center" style={{ backgroundImage: "url('https://source.unsplash.com/1600x900/?travel,nature')" }}>
      <div className="absolute inset-0 bg-black bg-opacity-50 flex flex-col items-center justify-center text-white text-center p-4">
        <motion.h1 
          className="text-4xl md:text-6xl font-bold" 
          initial={{ opacity: 0, y: -50 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ duration: 1 }}
        >
          Plan Your Perfect Trip
        </motion.h1>
        <motion.p 
          className="text-lg md:text-xl mt-4 max-w-2xl" 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          transition={{ duration: 1.5 }}
        >
          Organize your travel itinerary, manage routes, and track trip progress seamlessly.
        </motion.p>
        <motion.button 
          className="mt-6 bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg text-lg shadow-lg transition"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          Get Started
        </motion.button>
      </div>
    </div>
  );
};

export default Home;