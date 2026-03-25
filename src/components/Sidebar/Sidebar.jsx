import React from "react";
import { FaHome, FaPlus, FaChartBar, FaCog, FaFolder, FaStar, FaBars } from "react-icons/fa";
import "./Sidebar.css";
import logo from "../../assets/logo.png";

function Sidebar({ activeTab, setActiveTab, sidebarOpen, toggleSidebar }) {
  const menuItems = [
    { id: "home", icon: <FaHome />, label: "Home" },
    { id: "create", icon: <FaPlus />, label: "Create" },
    { id: "reports", icon: <FaChartBar />, label: "Reports" },
    { id: "workspaces", icon: <FaFolder />, label: "Workspaces" },
    { id: "favorites", icon: <FaStar />, label: "Favorites" },
    { id: "settings", icon: <FaCog />, label: "Settings" },
  ];

  return (
    <div className={`sidebar ${sidebarOpen ? "open" : "closed"}`}>
      {/* Header with hamburger + logo + text */}
      <div className="sidebar-header">
        <FaBars 
          onClick={toggleSidebar} 
          className="menu-icon"
        />
        {sidebarOpen && (
          <div className="logo-container">
            <span className="logo-text">Industry 4.0</span>
          </div>
        )}
        {!sidebarOpen && (
          <div className="logo-collapsed">
        
          </div>
        )}
      </div>

      {/* Menu divider line */}
      <div className="menu-divider"></div>

      {/* Menu items */}
      <ul>
        {menuItems.map((item) => (
          <li 
            key={item.id}
            className={activeTab === item.id ? "active" : ""}
            onClick={() => setActiveTab(item.id)}
          >
            {item.icon}
            {sidebarOpen ? (
              <span>{item.label}</span>
            ) : (
              <span className="menu-label-closed">{item.label}</span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default Sidebar;