// src/components/Dashboard/Dashboard.jsx
import React, { useState, useEffect } from "react";
import Sidebar from "../Sidebar/Sidebar";
import Navbar from "../Navbar/Navbar";
import Card from "../Card/Card";
import { FaPlus, FaFileAlt, FaClock, FaFolderOpen, FaChartLine, FaHeart } from "react-icons/fa";
import "./Dashboard.css";

function Dashboard({ 
  sidebarOpen,           // ← ADD THIS
  toggleSidebar,         // ← ADD COMMA HERE (fixed)
  onNavigateToDataConnection,
  onNavigateToWorkspace,
  onNavigateToFavourites,
  onNavigateToReportBuilder
}) {
  // ✅ ADD THIS - missing activeTab state
  const [activeTab, setActiveTab] = useState("home");
  
  const [recentReports, setRecentReports] = useState([]);

  // Load recent reports from localStorage when page loads
  useEffect(() => {
    loadRecentReports();
  }, []);

  const loadRecentReports = () => {
    const savedReports = localStorage.getItem("recentReports");
    if (savedReports) {
      setRecentReports(JSON.parse(savedReports));
    }
  };

  const handleNewReport = () => {
    if (onNavigateToDataConnection) {
      onNavigateToDataConnection();
    }
  };

  const handleNavigateToHome = () => {
    setActiveTab("home");
  };

  // Card click handlers
  const handleOpenWorkspace = () => {
    if (onNavigateToWorkspace) {
      onNavigateToWorkspace();
    }
  };

  const handleOpenReportBuilder = () => {
    if (onNavigateToReportBuilder) {
      onNavigateToReportBuilder();
    }
  };

  const handleOpenFavourites = () => {
    if (onNavigateToFavourites) {
      onNavigateToFavourites();
    }
  };

  const handleOpenRecentReport = (report) => {
    alert(`Opening: ${report.name}`);
  };

  return (
    <div>
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        sidebarOpen={sidebarOpen}
        toggleSidebar={toggleSidebar}
        onNavigateToDataConnection={onNavigateToDataConnection}
        onNavigateToHome={handleNavigateToHome}
        onNavigateToWorkspace={onNavigateToWorkspace}
        onNavigateToFavourites={onNavigateToFavourites}
        onNavigateToReportBuilder={onNavigateToReportBuilder}
      />
      <Navbar sidebarOpen={sidebarOpen} />
      
      <div className={`dashboard ${sidebarOpen ? "open" : "closed"}`}>
        {/* Header */}
        <div className="dashboard-header">
          <div>
            <h1>Welcome back, User! </h1>
          </div>
          <button className="new-report" onClick={handleNewReport}>
            <FaPlus /> New Report
          </button>
        </div>

        {/* Workspaces Section */}
        <div className="section-title">
          <FaFolderOpen />
          <span>My Workspaces</span>
        </div>
        <div className="cards">
          <Card 
            title="My Workspace"
            icon="📊"
            description="Personal workspace for your daily analytics"
            buttonText="Open Workspace →"
            onButtonClick={handleOpenWorkspace}
          />
          <Card 
            title="Reports Hub"
            icon="📈"
            description="Build and manage your reports"
            buttonText="Open Report Builder →"
            onButtonClick={handleOpenReportBuilder}
          />
          <Card 
            title="Favourites"
            icon="❤️"
            description="Your most used reports and dashboards"
            buttonText="Open Favourites →"
            onButtonClick={handleOpenFavourites}
          />
        </div>

        {/* Recent Section */}
        <div className="section-title">
          <FaClock />
          <span>Recent</span>
        </div>
        <div className="recent-section">
          {recentReports.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📄</div>
              <p>No recent reports yet</p>
              <span>Create your first report by clicking "New Report"</span>
            </div>
          ) : (
            <div className="recent-reports-grid">
              {recentReports.slice(0, 5).map((report, index) => (
                <div 
                  key={index} 
                  className="recent-report-card"
                  onClick={() => handleOpenRecentReport(report)}
                >
                  <div className="recent-report-icon">
                    {report.type === 'excel' && '📊'}
                    {report.type === 'csv' && '📄'}
                    {report.type === 'sql' && '🗄️'}
                    {report.type === 'manual' && '✏️'}
                    {!report.type && '📁'}
                  </div>
                  <div className="recent-report-info">
                    <div className="recent-report-name">{report.name}</div>
                    <div className="recent-report-meta">
                      <span>{report.rows} rows</span>
                      <span>•</span>
                      <span>{new Date(report.date).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <button className="recent-report-open">Open →</button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;