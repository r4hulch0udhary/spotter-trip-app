import React from "react";
import Sidebar from "../components/sidebar";

const Home = () => {
  return (
    <div className="home-container">
      <div className="relative min-h-screen flex">
        {/* Sidebar */}
        <Sidebar />

        {/* Background Image */}
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url('/images/travel-bg.jpg')" }}
        >
          <div className="absolute inset-0 bg-black bg-opacity-50"></div>
        </div>

        {/* Content Overlay */}
        <div className="relative flex flex-col justify-center items-center text-white text-center w-full px-6 overlay">
          <h1 className="text-5xl font-extrabold">Plan Your Perfect Journey</h1>
          <p className="text-lg mt-4 max-w-2xl overlay">
            Discover, organize, and track your trips effortlessly with our intuitive trip planner.
          </p>

          {/* Simple Button Without Animation */}
          <a href="/trip" className="start-btn mt-6 px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-full text-white font-semibold text-lg shadow-lg transition">
            Plan Trip
          </a>
        </div>

        {/* Features Section */}
        <div className="absolute bottom-10 w-full flex justify-center">
          <div className="bg-white bg-opacity-80 rounded-xl shadow-lg p-6 flex gap-6 text-black">
            <FeatureCard icon="📍" title="Smart Route Planning" />
            <FeatureCard icon="✈" title="Flight & Hotel Integrations" />
            <FeatureCard icon="🗺" title="Interactive Maps" />
            <FeatureCard icon="⏳" title="Trip Timeline & Budgeting" />
          </div>
        </div>
      </div>
    </div>
  );
};

const FeatureCard = ({ icon, title }) => (
  <div className="flex flex-col items-center px-4 py-2 bg-gray-100 rounded-lg shadow-md">
    <span className="text-4xl">{icon}</span>
    <p className="mt-2 font-semibold">{title}</p>
  </div>
);

export default Home;
