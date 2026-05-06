// src/components/Favourites/FavouritesPage.jsx
import React, { useState } from "react";
import Sidebar from "../Sidebar/Sidebar";
import Navbar from "../Navbar/Navbar";
import { FaArrowLeft } from "react-icons/fa";
import "./FavouritesPage.css";

function FavouritesPage({ 
  onBackToDashboard,
  onNavigateToDataConnection,
  onNavigateToWorkspace,
  onNavigateToReports,
  onNavigateToFavourites
}) {
  const [activeTab, setActiveTab] = useState("favorites");
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handleNavigateToHome = () => {
    if (onBackToDashboard) {
      onBackToDashboard();
    }
  };

  return (
    <div>
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        sidebarOpen={sidebarOpen}
        toggleSidebar={toggleSidebar}
        onNavigateToHome={handleNavigateToHome}
        onNavigateToDataConnection={onNavigateToDataConnection}
        onNavigateToWorkspace={onNavigateToWorkspace}
        onNavigateToReports={onNavigateToReports}
        onNavigateToFavourites={onNavigateToFavourites}
      />
      <Navbar sidebarOpen={sidebarOpen} />
      
      <div className={`favourites-page ${sidebarOpen ? "open" : "closed"}`}>
        <div className="favourites-container">
          <button className="back-button" onClick={onBackToDashboard}>
            <FaArrowLeft /> Back to Dashboard
          </button>
          
          <div className="favourites-header">
            <h1>⭐ My Favourites</h1>
            <p>Your most used reports and dashboards</p>
          </div>
          
          <div className="favourites-content">
            <div className="coming-soon">
              <div className="coming-soon-icon">⭐</div>
              <h2>Favourites Coming Soon</h2>
              <p>Your favourite reports will be saved here</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default FavouritesPage;