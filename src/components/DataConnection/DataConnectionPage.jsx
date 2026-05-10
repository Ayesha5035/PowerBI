// src/components/DataConnection/DataConnectionPage.jsx
import React, { useState, useEffect } from "react";
import Sidebar from "../Sidebar/Sidebar";
import Navbar from "../Navbar/Navbar";
import ExcelUploader from "./ExcelUploader";
import DataPreview from "./DataPreview";
import SQLServerConnector from "./SQLServerConnector";
import ManualEntry from "./ManualEntry";
import io from 'socket.io-client';  // Add this import
import { 
  FiDatabase, FiClipboard, FiFileText, FiFile, FiFolder, FiBook, FiArrowLeft, FiLoader
} from 'react-icons/fi';
import "./DataConnectionPage.css";

const DataConnectionPage = ({ onBackToDashboard }) => {
  const [activeTab, setActiveTab] = useState("create");
  const [sidebarOpen, setSidebarOpen] = useState(() => window.innerWidth > 768);
  const [uploadedData, setUploadedData] = useState(null);
  const [uploadedFileName, setUploadedFileName] = useState(null);
  const [showSQLModal, setShowSQLModal] = useState(false);
  const [showManualModal, setShowManualModal] = useState(false);
  const [editingData, setEditingData] = useState(null);
  const [editingFileName, setEditingFileName] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [socket, setSocket] = useState(null);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  // Load saved data on page refresh
  useEffect(() => {
    const loadSavedData = async () => {
      setIsLoading(true);
      try {
        const response = await fetch('http://localhost:5000/api/get-imported-data');
        const result = await response.json();
        
        if (result.success && result.data && result.data.length > 0) {
          setUploadedData(result.data);
          setUploadedFileName(`SQL_Data_${new Date().toLocaleDateString()}`);
          console.log(`✅ Loaded ${result.data.length} rows from database`);
        } else {
          console.log('No saved data found');
        }
      } catch (err) {
        console.error('Failed to load saved data:', err);
      }
      setIsLoading(false);
    };
    
    loadSavedData();
  }, []);

  // WebSocket connection for real-time updates
  useEffect(() => {
    const newSocket = io('http://localhost:5000');
    setSocket(newSocket);
    
    newSocket.on('realtime-data-update', (data) => {
      console.log('📡 Real-time update received:', data);
      
      setUploadedData(prevData => {
        if (!prevData) return data.newRecords;
        // Add new records to the beginning and keep all
        return [...data.newRecords, ...prevData];
      });
      
      // Show notification
      if (data.newRecords.length > 0) {
        console.log(`✨ ${data.newRecords.length} new records added in real-time!`);
      }
    });
    
    return () => newSocket.disconnect();
  }, []);

  const handleFileUpload = (parsedData, fileName) => {
    setUploadedData(parsedData);
    setUploadedFileName(fileName);
    alert(`Successfully uploaded "${fileName}" with ${parsedData.length} rows!`);
  };
  
  const handleSQLImport = async (data, sourceName) => {
    setUploadedData(data);
    setUploadedFileName(sourceName);
    alert(`Successfully imported ${data.length} rows from SQL Server! Real-time sync is active.`);
  };
  
  const handleManualSave = (data, fileName) => {
    setUploadedData(data);
    setUploadedFileName(fileName);
    alert(`Successfully saved ${data.length} rows!`);
  };
  
  const handleSaveToDatabase = async (data, fileName) => {
    try {
      const response = await fetch('http://localhost:5000/api/save-to-database', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          data: data,
          fileName: fileName,
          source: 'manual'
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        alert(`Data from "${fileName}" saved to database successfully!`);
      } else {
        alert('Failed to save to database');
      }
    } catch (err) {
      console.error('Save error:', err);
      alert('Error saving to database');
    }
  };
  
  const handleDiscardData = () => {
    setUploadedData(null);
    setUploadedFileName(null);
  };
  
  const handleEditData = () => {
    setEditingData(uploadedData);
    setEditingFileName(uploadedFileName);
    setShowEditModal(true);
    setUploadedData(null);
    setUploadedFileName(null);
  };

  const handleCardClick = (sourceId) => {
    if (sourceId === 'sqlserver') {
      setShowSQLModal(true);
    } else if (sourceId === 'paste') {
      setShowManualModal(true);
    }
  };

  const dataSources = [
    { id: 'sqlserver', name: 'SQL Server', icon: <FiDatabase size={28} />, description: 'Connect to SQL server data sources', color: '#01b8aa', isPrimary: true },
    { id: 'paste', name: 'Paste or manually enter data', icon: <FiClipboard size={28} />, description: 'Copy and paste data', color: '#9b59b6' },
    { id: 'excel', name: 'Excel', icon: <FiFileText size={28} />, description: 'Upload Excel file', color: '#1e6f3f', isUploader: true, acceptedFormats: '.xlsx,.xls' },
    { id: 'csv', name: 'CSV', icon: <FiFile size={28} />, description: 'Upload CSV file', color: '#f39c12', isUploader: true, acceptedFormats: '.csv' },
  ];

  const handleNavigateToHome = () => {
    if (onBackToDashboard) onBackToDashboard();
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

  if (isLoading) {
    return (
      <div>
        <Navbar sidebarOpen={sidebarOpen} />
        <div className="dataconnection-page">
          <div style={{ textAlign: 'center', padding: '50px' }}>
            <FiLoader className="spinner" size={40} />
            <p>Loading saved data...</p>
          </div>
        </div>
      </div>
    );
  }

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
            {dataSources.map(source => renderDataSourceCard(source))}
          </div>
        </div>

        {uploadedData && uploadedData.length > 0 && (
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