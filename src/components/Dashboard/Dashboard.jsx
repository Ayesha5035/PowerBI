import React, { useState } from "react";
import Sidebar from "../Sidebar/Sidebar";
import Navbar from "../Navbar/Navbar";
import Card from "../Card/Card";
import { FaPlus, FaChartLine, FaUsers, FaFileAlt } from "react-icons/fa";
import "./Dashboard.css";

function Dashboard() {
  const [activeTab, setActiveTab] = useState("home");
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const stats = [
    { title: "Total Reports", value: "24", icon: <FaFileAlt />, color: "#667eea" },
    { title: "Active Users", value: "156", icon: <FaUsers />, color: "#48bb78" },
    { title: "Data Sources", value: "12", icon: <FaChartLine />, color: "#ed8936" },
  ];

  return (
    <div>
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        sidebarOpen={sidebarOpen}
        toggleSidebar={toggleSidebar}
      />
      <Navbar sidebarOpen={sidebarOpen} />
      <div className={`dashboard ${sidebarOpen ? "open" : "closed"}`}>
        <div className="dashboard-header">
          <h1>Welcome back, User! 👋</h1>
          <button className="new-report">
            <FaPlus /> New Report
          </button>
        </div>

        {/* Statistics Section */}
        <div className="stats-grid">
          {stats.map((stat, index) => (
            <div key={index} className="stat-card">
              <div style={{ fontSize: "24px", color: stat.color }}>{stat.icon}</div>
              <h3>{stat.title}</h3>
              <div className="stat-value">{stat.value}</div>
            </div>
          ))}
        </div>

        {/* Reports Section */}
        <div className="section-title">
          <FaFileAlt />
          <span>My Workspaces</span>
        </div>
        <div className="cards">
          <Card 
            title="My Workspace" 
            description="Personal workspace for your daily analytics and reports" 
            icon="📊"
          />
          <Card 
            title="FYP Project" 
            description="Final Year Project - Data visualization and analysis" 
            icon="🎓"
          />
          <Card 
            title="Reports Hub" 
            description="Central repository for all analytics reports" 
            icon="📈"
          />
          <Card 
            title="Team Analytics" 
            description="Collaborative workspace for team insights" 
            icon="👥"
          />
        </div>
      </div>
    </div>
  );
}

export default Dashboard;