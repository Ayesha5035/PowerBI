// src/components/DataConnection/DataConnectionPage.jsx
import React, { useState, useEffect } from "react";
import Sidebar from "../Sidebar/Sidebar";
import Navbar from "../Navbar/Navbar";
import ExcelUploader from "./ExcelUploader";
import FullDataView from "./FullDataView";
import SQLServerConnector from "./SQLServerConnector";
import ManualEntry from "./ManualEntry";
import io from 'socket.io-client';  // Add this import
import { 
  FiDatabase, FiClipboard, FiFileText, FiFile, FiFolder, FiBook, FiArrowLeft, FiLoader
} from 'react-icons/fi';
import "./DataConnectionPage.css";

const DataConnectionPage = ({ onBackToDashboard, onDataUpload }) => {
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
  const [isViewingData, setIsViewingData] = useState(false);
  const [deleteConfirmDataset, setDeleteConfirmDataset] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Edit modal states
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingData, setEditingData] = useState(null);
  const [editingFileName, setEditingFileName] = useState(null);
  const [editingDatasetId, setEditingDatasetId] = useState(null);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  // Load all datasets
  const loadAllDatasets = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('http://localhost:5000/api/get-all-datasets');
      const result = await response.json();
      
      if (result.success && result.datasets) {
        setDatasets(result.datasets);
        console.log(`✅ Loaded ${result.datasets.length} datasets`);
      } else {
        setDatasets([]);
      }
    } catch (err) {
      console.error('Failed to load datasets:', err);
    }
    setIsLoading(false);
  };

  // Load dataset data when selected
  const loadDatasetData = async (dataset) => {
    setIsLoading(true);
    try {
      const response = await fetch('http://localhost:5000/api/get-dataset-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ datasetId: dataset.id })
      });
      const result = await response.json();
      
      if (result.success) {
        setSelectedDataset(dataset);
        setSelectedDatasetData(result.data);
        setIsViewingData(true);
        console.log(`✅ Loaded ${result.data.length} rows from dataset ${dataset.id}`);
      } else {
        toast.error('Failed to load dataset data');
      }
    } catch (err) {
      console.error('Failed to load dataset data:', err);
      toast.error('Error loading dataset');
    }
    setIsLoading(false);
  };

  // Load datasets on mount
  useEffect(() => {
    loadAllDatasets();
  }, []);

  // WebSocket connection for real-time updates
  useEffect(() => {
    const newSocket = io('http://localhost:5000');
    setSocket(newSocket);
    
    // Listen for new records
    newSocket.on('realtime-data-update', (data) => {
      console.log('📡 Real-time update received:', data);
      loadAllDatasets();
      
      if (data.newRecords.length > 0) {
        toast.success(`${data.newRecords.length} new records added in real-time!`);
      }
    });
    
    // Listen for deleted records
    newSocket.on('realtime-data-delete', (data) => {
      console.log('🗑️ Delete event received:', data);
      
      // Update the displayed data if viewing a dataset
      if (selectedDatasetData && selectedDatasetData.length > 0) {
        const filteredData = selectedDatasetData.filter(
          record => !data.deletedIds.includes(record.Id)
        );
        setSelectedDatasetData(filteredData);
        toast.info(`${data.count} records deleted from SQL Server, removed from view!`);
      }
      
      // Refresh datasets list to update row counts
      loadAllDatasets();
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
          data: parsedData,
          fileName: fileName,
          source: 'excel'
        })
      });
        
      const result = await response.json();
      
      if (result.success) {
        toast.success(`Successfully uploaded "${fileName}" with ${parsedData.length} rows!`);
        await loadAllDatasets();
      } else {
        toast.error('Failed to save to database');
      }
    } catch (err) {
      console.error('Upload error:', err);
      toast.error('Failed to upload data');
    }
  };

  const handleSQLImport = async (data, sourceName, datasetId) => {
    console.log(`📥 Import completed: ${data.length} rows, Dataset ID: ${datasetId}`);
    toast.success(`Successfully imported ${data.length} rows from SQL Server!`);
    await loadAllDatasets();
    
    if (datasetId) {
      const newDataset = datasets.find(d => d.id === datasetId);
      if (newDataset) {
        setSelectedDataset(newDataset);
        setSelectedDatasetData(data);
        setIsViewingData(true);
      }
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
       console.log('📝 Opening Manual Entry modal'); 
      setShowManualModal(true);
    }
  };

  const handleRefreshDatasets = async () => {
    setIsRefreshing(true);
    await loadAllDatasets();
    setIsRefreshing(false);
    toast.success('Datasets refreshed');
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
     console.log('Rendering card for:', source.id, source.name);
    // Fixed: Added explicit cursor pointer and ensured onClick works
    return (
      <div key={source.id} onClick={() => handleCardClick(source.id)} style={{ cursor: 'pointer' }}>
        {cardContent}
      </div>
    );
  };

  if (isLoading && datasets.length === 0 && !selectedDataset) {
    return (
      <div>
        <Navbar sidebarOpen={sidebarOpen} />
        <div className="dataconnection-page">
          <div style={{ textAlign: 'center', padding: '50px' }}>
            <FiLoader className="spinner" size={40} />
            <p>Loading datasets...</p>
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
      
      {/* Full Data View Modal */}
      {isViewingData && selectedDatasetData && (
        <FullDataView
          data={selectedDatasetData}
          fileName={selectedDataset?.file_name}
          onClose={handleCloseDataView}
          onEdit={() => handleEditClick(selectedDataset)}
          dataset={selectedDataset}
        />
      )}
      
      {/* Delete Confirmation Modal */}
      {deleteConfirmDataset && (
        <ConfirmationModal
          isOpen={true}
          onClose={handleCancelDelete}
          onConfirm={handleConfirmDelete}
          title="Delete Data Permanently"
          message={`Are you sure you want to delete "${deleteConfirmDataset.file_name}"?\n\nThis will permanently remove ${deleteConfirmDataset.row_count} rows from the database.\n\nThis action cannot be undone!`}
          confirmText="Delete"
          cancelText="Cancel"
          type="danger"
        />
      )}
      
      {/* Edit Modal - Now loads existing data properly */}
      {showEditModal && (
        <ManualEntry 
          onSave={handleEditSave}
          onClose={() => setShowEditModal(false)}
          initialData={editingData}
          initialFileName={editingFileName}
        />
      )}
      
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