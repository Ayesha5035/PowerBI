import React from "react";
import { FaHome, FaPlus, FaChartBar, FaCog, FaFolder, FaStar } from "react-icons/fa";
import "./Sidebar.css";

function Sidebar({ activeTab, setActiveTab }) {
  const menuItems = [
    { id: "home", icon: <FaHome />, label: "Home" },
    { id: "create", icon: <FaPlus />, label: "Create" },
    { id: "reports", icon: <FaChartBar />, label: "Reports" },
    { id: "workspaces", icon: <FaFolder />, label: "Workspaces" },
    { id: "favorites", icon: <FaStar />, label: "Favorites" },
    { id: "settings", icon: <FaCog />, label: "Settings" },
  ];

  return (
    <div className="sidebar">
      <div className="logo">Power BI Dashboard</div>
      <ul>
        {menuItems.map((item) => (
          <li 
            key={item.id}
            className={activeTab === item.id ? "active" : ""}
            onClick={() => setActiveTab(item.id)}
          >
            {item.icon}
            <span>{item.label}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default Sidebar;