// src/components/DataConnection/DataConnectionPage.jsx
import React, { useState } from "react";
import Sidebar from "../Sidebar/Sidebar";
import Navbar from "../Navbar/Navbar";
import ExcelUploader from "./ExcelUploader";
import DataPreview from "./DataPreview";
import SQLServerConnector from "./SQLServerConnector";
import ManualEntry from "./ManualEntry";
import { 
  FiDatabase, FiCloud, FiFileText, FiFile, FiClipboard, 
  FiBookOpen, FiFolder, FiBook, FiArrowLeft
} from 'react-icons/fi';
import "./DataConnectionPage.css";

const DataConnectionPage = ({ 
  onBackToDashboard,
  sidebarOpen,          
  toggleSidebar,
  onNavigateToDataConnection,
  onNavigateToWorkspace,
  onNavigateToFavourites,
  onNavigateToReportBuilder
}) => {
  const [activeTab, setActiveTab] = useState("create");
  
  // State for uploaded data preview
  const [uploadedData, setUploadedData] = useState(null);
  const [uploadedFileName, setUploadedFileName] = useState(null);
  
  // State for modals and edit functionality
  const [showSQLModal, setShowSQLModal] = useState(false);
  const [showManualModal, setShowManualModal] = useState(false);
  
  // State for editing existing data
  const [editingData, setEditingData] = useState(null);
  const [editingFileName, setEditingFileName] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);

  // ========== FUNCTION: Save to Workspace ==========
  const saveToWorkspace = (data, type, name, details = {}) => {
    const currentWorkspaceId = localStorage.getItem("currentWorkspaceId");
    
    if (!currentWorkspaceId) {
      console.error("No active workspace found");
      alert("No workspace selected. Please go to Workspace page first.");
      return;
    }
    
    const savedWorkspaces = localStorage.getItem("workspaces");
    if (!savedWorkspaces) {
      console.error("No workspaces found");
      alert("No workspaces found. Please create a workspace first.");
      return;
    }
    
    let workspaces = JSON.parse(savedWorkspaces);
    const workspaceIndex = workspaces.findIndex(w => w.id === currentWorkspaceId);
    
    if (workspaceIndex === -1) {
      console.error("Current workspace not found");
      alert("Current workspace not found.");
      return;
    }
    
    const newItem = {
      id: `item_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      name: name,
      type: type,
      status: "connected",
      lastRefreshed: new Date().toLocaleString(),
      rows: data.length,
      icon: type,
      ...details
    };
    
    workspaces[workspaceIndex].items = workspaces[workspaceIndex].items || [];
    workspaces[workspaceIndex].items.push(newItem);
    
    localStorage.setItem("workspaces", JSON.stringify(workspaces));
    window.dispatchEvent(new Event("workspaceUpdate"));
    
    console.log(`✅ Saved to workspace: ${workspaces[workspaceIndex].name} (${type})`);
  };

  // Callback when Excel/CSV upload is successful
  const handleFileUpload = (parsedData, fileName) => {
    console.log(`✅ File uploaded: ${fileName}`);
    console.log(`📊 Data rows: ${parsedData.length}`);
    
    setUploadedData(parsedData);
    setUploadedFileName(fileName);
    
    let fileType = "excel";
    if (fileName.toLowerCase().endsWith(".csv")) {
      fileType = "csv";
    }
    
    saveToWorkspace(parsedData, fileType, fileName);
    alert(`Successfully uploaded "${fileName}" with ${parsedData.length} rows of data!`);
  };
  
  // Callback when SQL Server data is imported
  const handleSQLImport = (data, sourceName) => {
    console.log(`✅ SQL Data imported: ${sourceName}`);
    console.log(`📊 Data rows: ${data.length}`);
    
    setUploadedData(data);
    setUploadedFileName(sourceName);
    
    saveToWorkspace(data, "sql", sourceName, {
      server: "SQL Server Connection"
    });
    
    alert(`Successfully imported ${data.length} rows from SQL Server!`);
  };
  
  // Callback when Manual Entry data is saved
  const handleManualSave = (data, fileName) => {
    console.log(`✅ Manual data saved: ${fileName}`);
    console.log(`📊 Data rows: ${data.length}`);
    
    setUploadedData(data);
    setUploadedFileName(fileName);
    
    saveToWorkspace(data, "manual", fileName);
    alert(`Successfully saved ${data.length} rows of manual data!`);
  };
  
  // Handle save to database
  const handleSaveToDatabase = async (data, fileName) => {
    console.log('💾 Saving to database:', { fileName, rowCount: data.length });
    await new Promise(resolve => setTimeout(resolve, 1000));
    alert(`Data from "${fileName}" saved to database successfully!`);
  };
  
  // Handle discard
  const handleDiscardData = () => {
    setUploadedData(null);
    setUploadedFileName(null);
  };
  
  // Handle edit data
  const handleEditData = () => {
    setEditingData(uploadedData);
    setEditingFileName(uploadedFileName);
    setShowEditModal(true);
    setUploadedData(null);
    setUploadedFileName(null);
  };

  const handleCardClick = (sourceId) => {
    console.log('🖱️ Card clicked:', sourceId);
    if (sourceId === 'sqlserver') {
      setShowSQLModal(true);
    } else if (sourceId === 'paste') {
      setShowManualModal(true);
    } else {
      alert(`Connect to ${sourceId}`);
    }
  };

  const dataSources = [
    { id: 'sqlserver', name: 'SQL Server', icon: <FiDatabase size={28} />, description: 'Connect to SQL server data sources', color: '#01b8aa', isPrimary: true },
    { id: 'paste', name: 'Paste or manually enter data', icon: <FiClipboard size={28} />, description: 'Copy and paste data', color: '#9b59b6' },
    { 
      id: 'excel', 
      name: 'Excel', 
      icon: <FiFileText size={28} />, 
      description: 'Upload Excel file', 
      color: '#1e6f3f',
      isUploader: true,
      acceptedFormats: '.xlsx,.xls'
    },
    { 
      id: 'csv', 
      name: 'CSV', 
      icon: <FiFile size={28} />, 
      description: 'Upload CSV file', 
      color: '#f39c12',
      isUploader: true,
      acceptedFormats: '.csv'
    },
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

  const renderDataSourceCard = (source) => {
    const cardContent = (
      <div className="datasource-card" style={{ cursor: 'pointer' }}>
        <div className="datasource-icon" style={{ color: source.color }}>{source.icon}</div>
        <div className="datasource-info">
          <h3 className="datasource-name">{source.name}</h3>
          <p className="datasource-desc">{source.description}</p>
        </div>
      </div>
    );

    if (source.isUploader) {
      return (
        <ExcelUploader 
          key={source.id}
          onUploadSuccess={handleFileUpload}
          acceptedFormats={source.acceptedFormats}
        >
          {cardContent}
        </ExcelUploader>
      );
    }
    return (
      <div key={source.id} onClick={() => handleCardClick(source.id)} style={{ cursor: 'pointer' }}>
        {cardContent}
      </div>
    );
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
      <div className={`dataconnection-page ${sidebarOpen ? "open" : "closed"}`}>
        <div className="dataconnection-container">
          <button className="back-button" onClick={onBackToDashboard}>
            <FiArrowLeft size={18} /> Back to Dashboard
          </button>

          <h1 className="dataconnection-title">Add data to start building a report</h1>

          <div className="datasources-grid">
            {dataSources.map(source => renderDataSourceCard(source))}
          </div>
        </div>

        {uploadedData && (
          <DataPreview 
            data={uploadedData}
            fileName={uploadedFileName}
            onSave={handleSaveToDatabase}
            onDiscard={handleDiscardData}
            onEdit={handleEditData}
          />
        )}
      </div>
      
      {showSQLModal && (
        <SQLServerConnector 
          onConnect={handleSQLImport}
          onClose={() => setShowSQLModal(false)}
        />
      )}
      
      {showManualModal && (
        <ManualEntry 
          onSave={handleManualSave}
          onClose={() => setShowManualModal(false)}
        />
      )}
      
      {showEditModal && (
        <ManualEntry 
          onSave={handleManualSave}
          onClose={() => setShowEditModal(false)}
          initialData={editingData}
          initialFileName={editingFileName}
        />
      )}
    </div>
  );
};

export default DataConnectionPage;