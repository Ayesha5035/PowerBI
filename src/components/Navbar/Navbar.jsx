import React from "react";
import { FaSearch, FaBell, FaEnvelope } from "react-icons/fa";
import "./Navbar.css";

function Navbar() {
  return (
    <div className="navbar">
      <h2>Dashboard Overview</h2>
      <div className="search-bar">
        <FaSearch />
        <input type="text" placeholder="Search reports, workspaces..." />
      </div>
      <div className="user-info">
        <FaBell style={{ fontSize: "20px", color: "#64748b" }} />
        <FaEnvelope style={{ fontSize: "20px", color: "#64748b" }} />
        <span>Abeera Nadeem</span>
        <img 
          src="https://ui-avatars.com/api/?background=667eea&color=fff&name=Abeera+Nadeem" 
          alt="Profile" 
          className="profile-img"
        />
      </div>
    </div>
  );
}

export default Navbar;