// src/components/Sidebar/Sidebar.jsx
import React from "react";
import { FaHome, FaPlus, FaChartBar, FaCog, FaFolder, FaStar, FaTimes } from "react-icons/fa";
import "./Sidebar.css";

function Sidebar({ activeTab, setActiveTab, onNavigateToDataConnection, onNavigateToHome, isOpen, onClose }) {
  const menuItems = [
    { id: "home", icon: <FaHome />, label: "Home" },
    { id: "create", icon: <FaPlus />, label: "Create" },
    { id: "reports", icon: <FaChartBar />, label: "Reports" },
    { id: "workspaces", icon: <FaFolder />, label: "Workspaces" },
    { id: "favorites", icon: <FaStar />, label: "Favorites" },
    { id: "settings", icon: <FaCog />, label: "Settings" },
  ];

  const handleItemClick = (itemId) => {
    if (itemId === "create" && onNavigateToDataConnection) {
      onNavigateToDataConnection();
    } else if (itemId === "home" && onNavigateToHome) {
      onNavigateToHome();
    } else {
      setActiveTab(itemId);
    }
    // Close sidebar on mobile after click
    if (onClose && window.innerWidth <= 1024) {
      onClose();
    }
  };

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && <div className="sidebar-overlay" onClick={onClose}></div>}
      
      <div className={`sidebar ${isOpen ? 'sidebar-open' : ''}`}>
        <div className="sidebar-header">
          <div className="logo">Power BI Dashboard</div>
          
        </div>
        <ul>
          {menuItems.map((item) => (
            <li 
              key={item.id}
              className={activeTab === item.id ? "active" : ""}
              onClick={() => handleItemClick(item.id)}
            >
              {item.icon}
              <span>{item.label}</span>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}

export default Sidebar;