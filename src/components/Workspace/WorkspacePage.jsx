// src/components/Workspace/WorkspacePage.jsx
import React, { useState } from "react";
import Sidebar from "../Sidebar/Sidebar";
import Navbar from "../Navbar/Navbar";
import { FaArrowLeft } from "react-icons/fa";
import "./WorkspacePage.css";

function WorkspacePage({ 
  onBackToDashboard,
  onNavigateToDataConnection,
  onNavigateToWorkspace,
  onNavigateToFavourites,
  onNavigateToReportBuilder
}) {
  const [activeTab, setActiveTab] = useState("workspaces");
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
        onNavigateToFavourites={onNavigateToFavourites}
        onNavigateToReportBuilder={onNavigateToReportBuilder}
      />
      <Navbar sidebarOpen={sidebarOpen} />
      
      <div className={`workspace-page ${sidebarOpen ? "open" : "closed"}`}>
        <div className="workspace-container">
          <button className="back-button" onClick={onBackToDashboard}>
            <FaArrowLeft /> Back to Dashboard
          </button>
          
          <div className="workspace-header">
            <h1>📊 My Workspace</h1>
            <p>Your personal workspace for daily analytics and reports</p>
          </div>
          
          <div className="workspace-content">
            <div className="coming-soon">
              <div className="coming-soon-icon">🚀</div>
              <h2>Workspace Coming Soon</h2>
              <p>You will be able to manage all your reports and datasets here</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default WorkspacePage;