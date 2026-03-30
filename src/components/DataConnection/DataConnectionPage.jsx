// src/components/DataConnection/DataConnectionPage.jsx
import React, { useState } from "react";
import Sidebar from "../Sidebar/Sidebar";
import Navbar from "../Navbar/Navbar";
import { 
  FiDatabase, FiCloud, FiFileText, FiFile, FiClipboard, FiBookOpen, FiFolder, FiBook, FiArrowLeft
} from 'react-icons/fi';
import "./DataConnectionPage.css";

const DataConnectionPage = ({ onBackToDashboard }) => {
  const [activeTab, setActiveTab] = useState("create");
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const dataSources = [
    { id: 'getdata', name: 'Get Data', icon: <FiDatabase size={28} />, description: 'Connect to various data sources', color: '#01b8aa', isPrimary: true },
    { id: 'onelake', name: 'OneLake catalog', icon: <FiCloud size={28} />, description: 'Browse OneLake data', color: '#5e5ce6' },
    { id: 'excel', name: 'Excel', icon: <FiFileText size={28} />, description: 'Upload Excel file', color: '#1e6f3f' },
    { id: 'csv', name: 'CSV', icon: <FiFile size={28} />, description: 'Upload CSV file', color: '#f39c12' },
    { id: 'paste', name: 'Paste or manually enter data', icon: <FiClipboard size={28} />, description: 'Copy and paste data', color: '#9b59b6' },
    { id: 'semantic', name: 'Pick a published semantic model', icon: <FiBookOpen size={28} />, description: 'Use existing model', color: '#0078d4' }
  ];

  const otherItems = [
    { id: 'lakehouse', name: 'Lakehouse', icon: <FiFolder size={28} />, description: 'Store big data for cleaning, querying, reporting, and sharing.' },
    { id: 'notebook', name: 'Notebook', icon: <FiBook size={28} />, description: 'Explore, analyze, and visualize data and build ML models.' }
  ];

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
        onNavigateToDataConnection={() => {}}
        onNavigateToHome={handleNavigateToHome}
      />
      <Navbar sidebarOpen={sidebarOpen} />
      <div className={`dataconnection-page ${sidebarOpen ? "open" : "closed"}`}>
        <div className="dataconnection-container">
          <button className="back-button" onClick={onBackToDashboard}>
            <FiArrowLeft size={18} /> Back to Dashboard
          </button>

          <h1 className="dataconnection-title">Add data to start building a report</h1>

          <div className="datasources-grid">
            {dataSources.map(source => (
              <div key={source.id} className={`datasource-card ${source.isPrimary ? 'primary' : ''}`} onClick={() => alert(`Connect to ${source.name}`)}>
                <div className="datasource-icon" style={{ color: source.color }}>{source.icon}</div>
                <div className="datasource-info">
                  <h3 className="datasource-name">{source.name}</h3>
                  <p className="datasource-desc">{source.description}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="info-section">
            <p className="info-text">💡 Don't see the source you're looking for? <a href="#">Download the desktop app</a></p>
            <p className="info-text old-experience">Looking for the old experience? <a href="#">Excel</a> or <a href="#">CSV</a>. These old experiences will be deprecated soon. <a href="#">Learn more</a></p>
          </div>

          <div className="other-items-section">
            <h2 className="other-items-title">Other items you can create with Microsoft Fabric</h2>
            <p className="workspace-info">Current workspace: <strong>My workspace</strong> <a href="#" className="change-link">(Change)</a><br />Items will be saved to this workspace.</p>
            <div className="items-grid">
              {otherItems.map(item => (
                <div key={item.id} className="item-card" onClick={() => alert(`Create ${item.name}`)}>
                  <div className="item-icon" style={{ color: '#01b8aa' }}>{item.icon}</div>
                  <div className="item-content">
                    <h3 className="item-name">{item.name}</h3>
                    <p className="item-desc">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DataConnectionPage;