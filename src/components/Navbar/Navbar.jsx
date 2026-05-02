// src/components/Navbar/Navbar.jsx
import React from "react";
import { FaSearch, FaBell, FaEnvelope } from "react-icons/fa";
import "./Navbar.css";

function Navbar({ sidebarOpen }) {
  return (
    <div className="navbar" style={{ marginLeft: sidebarOpen ? "260px" : "80px" }}>
      <div></div>
      <div className="search-bar">
        <FaSearch />
        <input 
          type="text" 
          placeholder="Search reports, workspaces..." 
        />
      </div>
      <div className="user-info">
        <FaBell style={{ fontSize: "20px", color: "white" }} />
        <FaEnvelope style={{ fontSize: "20px", color: "white" }} />
        <span className="user-name">User Name</span>
        <img 
          src="https://ui-avatars.com/api/?background=ffffff&color=667eea&name=User+Name" 
          alt="Profile" 
          className="profile-img"
        />
      </div>
    </div>
  );
}

export default Navbar;