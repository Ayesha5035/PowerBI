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

const DataConnectionPage = ({ onBackToDashboard, onDataUpload }) => {
  const [activeTab, setActiveTab] = useState("create");
  const [sidebarOpen, setSidebarOpen] = useState(true);

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

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  // Callback when Excel/CSV upload is successful
  const handleFileUpload = (parsedData, fileName) => {
    console.log(`✅ File uploaded: ${fileName}`);
    console.log(`📊 Data rows: ${parsedData.length}`);
    console.log(`📋 Column headers:`, Object.keys(parsedData[0] || {}));

    setUploadedData(parsedData);
    setUploadedFileName(fileName);

    // NEW: Pass data to App.jsx
    if (onDataUpload) {
      onDataUpload(parsedData, fileName);
    }

    alert(`Successfully uploaded "${fileName}" with ${parsedData.length} rows of data!`);
  };

  // Callback when SQL Server data is imported
  const handleSQLImport = (data, sourceName) => {
    console.log(`✅ SQL Data imported: ${sourceName}`);
    console.log(`📊 Data rows: ${data.length}`);

    setUploadedData(data);
    setUploadedFileName(sourceName);

    // NEW: Pass data to App.jsx
    if (onDataUpload) {
      onDataUpload(data, sourceName);
    }

    alert(`Successfully imported ${data.length} rows from SQL Server!`);
  };

  // Callback when Manual Entry data is saved
  const handleManualSave = (data, fileName) => {
    console.log(`✅ Manual data saved: ${fileName}`);
    console.log(`📊 Data rows: ${data.length}`);

    setUploadedData(data);
    setUploadedFileName(fileName);

    // NEW: Pass data to App.jsx
    if (onDataUpload) {
      onDataUpload(data, fileName);
    }

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

  // Handle edit data - opens ManualEntry with existing data
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
      console.log('📝 Opening Manual Entry modal');
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
    console.log('Rendering card for:', source.id, source.name);
    // Fixed: Added explicit cursor pointer and ensured onClick works
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
        onNavigateToDataConnection={() => { }}
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
            {dataSources.map(source => renderDataSourceCard(source))}
          </div>


          {/* Data Preview Component */}
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
      </div>

      {/* SQL Server Modal */}
      {showSQLModal && (
        <SQLServerConnector
          onConnect={handleSQLImport}
          onClose={() => setShowSQLModal(false)}
        />
      )}

      {/* Manual Entry Modal (for creating new data) */}
      {showManualModal && (
        <ManualEntry
          onSave={handleManualSave}
          onClose={() => setShowManualModal(false)}
        />
      )}

      {/* Edit Modal (for editing existing data) */}
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