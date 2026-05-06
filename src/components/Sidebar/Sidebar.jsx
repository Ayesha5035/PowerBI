// src/components/Sidebar/Sidebar.jsx
import React, { useState, useEffect } from "react";
import { FaHome, FaPlus, FaChartBar, FaCog, FaFolder, FaStar, FaBars } from "react-icons/fa";
import "./Sidebar.css";

function Sidebar({ 
  activeTab, 
  setActiveTab, 
  sidebarOpen, 
  toggleSidebar, 
  onNavigateToDataConnection, 
  onNavigateToHome,
  onNavigateToWorkspace,
  onNavigateToFavourites,
  onNavigateToReportBuilder
}) {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 1024);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 1024;
      setIsMobile(mobile);
      if (!mobile) {
        setMobileSidebarOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleItemClick = (itemId) => {
    // Navigate based on menu item clicked
    if (itemId === "create") {
      if (onNavigateToDataConnection) onNavigateToDataConnection();
    } 
    else if (itemId === "home") {
      if (onNavigateToHome) onNavigateToHome();
    }
    else if (itemId === "workspaces") {
      if (onNavigateToWorkspace) onNavigateToWorkspace();
    }
    else if (itemId === "reports") {
      if (onNavigateToReportBuilder) onNavigateToReportBuilder();
    }
    else if (itemId === "favorites") {
      if (onNavigateToFavourites) onNavigateToFavourites();
    }
    else {
      setActiveTab(itemId);
    }
    
    // Close mobile sidebar after clicking
    if (isMobile && mobileSidebarOpen) {
      setMobileSidebarOpen(false);
    }
  };

  const handleToggleSidebar = () => {
    if (isMobile) {
      setMobileSidebarOpen(!mobileSidebarOpen);
    } else {
      toggleSidebar();
    }
  };

  const isExpanded = isMobile ? mobileSidebarOpen : sidebarOpen;

  const menuItems = [
    { id: "home", icon: <FaHome />, label: "Home" },
    { id: "create", icon: <FaPlus />, label: "Create" },
    { id: "reports", icon: <FaChartBar />, label: "Reports" },
    { id: "workspaces", icon: <FaFolder />, label: "Workspaces" },
    { id: "favorites", icon: <FaStar />, label: "Favorites" },
    { id: "settings", icon: <FaCog />, label: "Settings" },
  ];

  return (
    <div className={`sidebar ${isExpanded ? "open" : "closed"}`}>
      <div className="sidebar-header">
        <FaBars onClick={handleToggleSidebar} className="menu-icon" />
        {isExpanded && (
          <div className="logo-container">
            <span className="logo-text">Industry 4.0</span>
          </div>
        )}
      </div>
      <div className="menu-divider"></div>
      <ul>
        {menuItems.map((item) => (
          <li 
            key={item.id}
            className={activeTab === item.id ? "active" : ""}
            onClick={() => handleItemClick(item.id)}
          >
            {item.icon}
            {isExpanded && <span>{item.label}</span>}
            {!isExpanded && <span className="menu-label-closed">{item.label}</span>}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default Sidebar;