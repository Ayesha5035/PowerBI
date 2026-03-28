// src/components/Navbar/Navbar.jsx
import React from "react";
import { FaSearch, FaBell, FaEnvelope, FaBars } from "react-icons/fa";
import "./Navbar.css";

function Navbar({ onMenuClick }) {
  return (
    <div className="navbar">
      <div className="navbar-left">
        <button className="menu-button" onClick={onMenuClick}>
          <FaBars />
        </button>
        <h2>Dashboard Overview</h2>
      </div>
      <div className="search-bar">
        <FaSearch />
        <input 
          type="text" 
          placeholder="Search reports, workspaces, or datasets..." 
        />
      </div>
      <div className="user-info">
        <FaBell style={{ fontSize: "20px", color: "white" }} />
        <FaEnvelope style={{ fontSize: "20px", color: "white" }} />
        <span>User Name</span>
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