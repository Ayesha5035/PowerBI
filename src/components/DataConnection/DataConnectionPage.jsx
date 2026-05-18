// src/components/DataConnection/DataConnectionPage.jsx
<<<<<<< Updated upstream
import React, { useState } from "react";
=======
import React, { useState, useEffect, useCallback } from "react";
>>>>>>> Stashed changes
import Sidebar from "../Sidebar/Sidebar";
import Navbar from "../Navbar/Navbar";
import ExcelUploader from "./ExcelUploader";
import DataPreview from "./DataPreview";
import SQLServerConnector from "./SQLServerConnector";
import ManualEntry from "./ManualEntry";
<<<<<<< Updated upstream
=======
import DatasetCard from "./DatasetCard";
import ConfirmationModal from "../Common/ConfirmationModal";
import DataPreview from "./DataPreview";
import io from 'socket.io-client';
import toast from 'react-hot-toast';
>>>>>>> Stashed changes
import { 
  FiDatabase, FiCloud, FiFileText, FiFile, FiClipboard, 
  FiBookOpen, FiFolder, FiBook, FiArrowLeft
} from 'react-icons/fi';
import "./DataConnectionPage.css";

const DataConnectionPage = ({ onBackToDashboard }) => {
  const [activeTab, setActiveTab] = useState("create");
<<<<<<< Updated upstream
  const [sidebarOpen, setSidebarOpen] = useState(true);
  
  // State for uploaded data preview
  const [uploadedData, setUploadedData] = useState(null);
  const [uploadedFileName, setUploadedFileName] = useState(null);
  
  // State for modals and edit functionality
  const [showSQLModal, setShowSQLModal] = useState(false);
  const [showManualModal, setShowManualModal] = useState(false);
  
  // State for editing existing data
=======
  const [sidebarOpen, setSidebarOpen] = useState(() => window.innerWidth > 768);
  const [datasets, setDatasets] = useState([]);
  const [selectedDataset, setSelectedDataset] = useState(null);
  const [selectedDatasetData, setSelectedDatasetData] = useState(null);
  const [showSQLModal, setShowSQLModal] = useState(false);
  const [showManualModal, setShowManualModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [socket, setSocket] = useState(null);
  const [isViewingData, setIsViewingData] = useState(false);
  const [deleteConfirmDataset, setDeleteConfirmDataset] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [uploadedData, setUploadedData] = useState(null);
  const [uploadedFileName, setUploadedFileName] = useState(null);
  
  const [showEditModal, setShowEditModal] = useState(false);
>>>>>>> Stashed changes
  const [editingData, setEditingData] = useState(null);
  const [editingFileName, setEditingFileName] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

<<<<<<< Updated upstream
  // Callback when Excel/CSV upload is successful
  const handleFileUpload = (parsedData, fileName) => {
    console.log(`✅ File uploaded: ${fileName}`);
    console.log(`📊 Data rows: ${parsedData.length}`);
    console.log(`📋 Column headers:`, Object.keys(parsedData[0] || {}));
    
    setUploadedData(parsedData);
    setUploadedFileName(fileName);
    
    alert(`Successfully uploaded "${fileName}" with ${parsedData.length} rows of data!`);
  };
  
  // Callback when SQL Server data is imported
  const handleSQLImport = (data, sourceName) => {
    console.log(`✅ SQL Data imported: ${sourceName}`);
    console.log(`📊 Data rows: ${data.length}`);
    
    setUploadedData(data);
    setUploadedFileName(sourceName);
    
    alert(`Successfully imported ${data.length} rows from SQL Server!`);
  };
  
  // Callback when Manual Entry data is saved
  const handleManualSave = (data, fileName) => {
    console.log(`✅ Manual data saved: ${fileName}`);
    console.log(`📊 Data rows: ${data.length}`);
    
    setUploadedData(data);
    setUploadedFileName(fileName);
=======
  // Load all datasets
  const loadAllDatasets = useCallback(async () => {
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
  }, []);

  // Load dataset data when selected
  const loadDatasetData = useCallback(async (dataset) => {
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
  }, []);

  // Load datasets on mount
  useEffect(() => {
    loadAllDatasets();
  }, [loadAllDatasets]);

  // WebSocket connection for real-time updates
  useEffect(() => {
    const newSocket = io('http://localhost:5000');
    setSocket(newSocket);
    
    newSocket.on('realtime-data-update', (data) => {
      console.log('📡 Real-time update received:', data);
      
      // Reload datasets to update row counts
      loadAllDatasets();
      
      // If viewing a dataset, append new records to current view
      if (selectedDatasetData && selectedDatasetData.length > 0) {
        setSelectedDatasetData(prevData => [...data.newRecords, ...prevData]);
      }
      
      if (data.newRecords.length > 0) {
        toast.success(`${data.newRecords.length} new records added in real-time!`);
      }
    });
    
    newSocket.on('realtime-data-delete', (data) => {
      console.log('🗑️ Delete event received:', data);
      
      // Update the displayed data if viewing a dataset
      if (selectedDatasetData && selectedDatasetData.length > 0) {
        setSelectedDatasetData(prevData => 
          prevData.filter(record => !data.deletedIds.includes(record.Id))
        );
        toast.info(`${data.count} records deleted from SQL Server, removed from view!`);
      }
      
      // Refresh datasets list to update row counts
      loadAllDatasets();
    });
    
    return () => newSocket.disconnect();
  }, [selectedDatasetData, loadAllDatasets]);

  const handleFileUpload = async (parsedData, fileName) => {
    setIsLoading(true);
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
        toast.error('Failed to save to database: ' + result.error);
      }
    } catch (err) {
      console.error('Upload error:', err);
      toast.error('Failed to upload data');
    }
    setIsLoading(false);
  };
  
  const handleSQLImport = async (data, sourceName, datasetId) => {
    console.log(`📥 Import completed: ${data.length} rows, Dataset ID: ${datasetId}`);
    toast.success(`Successfully imported ${data.length} rows from SQL Server! Real-time sync is active.`);
    await loadAllDatasets();
>>>>>>> Stashed changes
    
    alert(`Successfully saved ${data.length} rows of manual data!`);
  };
  
<<<<<<< Updated upstream
  // Handle save to database
  const handleSaveToDatabase = async (data, fileName) => {
    console.log('💾 Saving to database:', { fileName, rowCount: data.length });
    await new Promise(resolve => setTimeout(resolve, 1000));
    alert(`Data from "${fileName}" saved to database successfully!`);
  };
  
  // Handle discard
=======
  const handleManualSave = async (data, fileName) => {
    setIsLoading(true);
    try {
      const response = await fetch('http://localhost:5000/api/save-to-database', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          data: data,
          fileName: fileName.endsWith('.json') ? fileName : `${fileName}.json`,
          source: 'manual'
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        toast.success(`Successfully saved ${data.length} rows!`);
        await loadAllDatasets();
      } else {
        toast.error('Failed to save to database: ' + result.error);
      }
    } catch (err) {
      console.error('Save error:', err);
      toast.error('Failed to save data');
    }
    setIsLoading(false);
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
        toast.success(`Data from "${fileName}" saved to database successfully!`);
        await loadAllDatasets();
        setUploadedData(null);
        setUploadedFileName(null);
      } else {
        toast.error('Failed to save to database');
      }
    } catch (err) {
      console.error('Save error:', err);
      toast.error('Error saving to database');
    }
  };
  
>>>>>>> Stashed changes
  const handleDiscardData = () => {
    setUploadedData(null);
    setUploadedFileName(null);
    toast.info('Data discarded from view');
  };
  
  // Handle edit data - opens ManualEntry with existing data
  const handleEditData = () => {
    setEditingData(uploadedData);
    setEditingFileName(uploadedFileName);
    setShowEditModal(true);
    setUploadedData(null);
    setUploadedFileName(null);
  };

  const handleDeleteClick = (dataset) => {
    setDeleteConfirmDataset(dataset);
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirmDataset) return;
    
    try {
      const response = await fetch('http://localhost:5000/api/delete-dataset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ datasetId: deleteConfirmDataset.id })
      });
      
      const result = await response.json();
      
      if (result.success) {
        toast.success(`"${deleteConfirmDataset.file_name}" deleted successfully!`);
        
        if (selectedDataset?.id === deleteConfirmDataset.id) {
          setSelectedDataset(null);
          setSelectedDatasetData(null);
          setIsViewingData(false);
        }
        
        await loadAllDatasets();
      } else {
        toast.error('Failed to delete: ' + result.error);
      }
    } catch (err) {
      console.error('Delete error:', err);
      toast.error('Error deleting data');
    } finally {
      setDeleteConfirmDataset(null);
    }
  };

  const handleCancelDelete = () => {
    setDeleteConfirmDataset(null);
  };
  
  const handleEditClick = async (dataset) => {
    setIsLoading(true);
    try {
      const response = await fetch('http://localhost:5000/api/get-dataset-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ datasetId: dataset.id })
      });
      const result = await response.json();
      
      if (result.success && result.data && result.data.length > 0) {
        setEditingData(result.data);
        setEditingFileName(dataset.file_name);
        setEditingDatasetId(dataset.id);
        setShowEditModal(true);
        console.log(`✅ Loaded ${result.data.length} rows for editing`);
      } else {
        toast.error('Failed to load data for editing');
      }
    } catch (err) {
      console.error('Failed to load data for editing:', err);
      toast.error('Error loading data for editing');
    }
    setIsLoading(false);
  };
  
  const handleEditSave = async (editedData, fileName) => {
    try {
      const deleteResponse = await fetch('http://localhost:5000/api/delete-dataset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ datasetId: editingDatasetId })
      });
      
      const deleteResult = await deleteResponse.json();
      
      if (deleteResult.success) {
        const saveResponse = await fetch('http://localhost:5000/api/save-to-database', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            data: editedData,
            fileName: fileName.endsWith('.json') ? fileName : `${fileName}.json`,
            source: 'manual'
          })
        });
        
        const saveResult = await saveResponse.json();
        
        if (saveResult.success) {
          toast.success(`Data updated successfully! ${editedData.length} rows saved.`);
          await loadAllDatasets();
          setShowEditModal(false);
          setEditingData(null);
          setEditingFileName(null);
          setEditingDatasetId(null);
        } else {
          toast.error('Failed to save edited data');
        }
      } else {
        toast.error('Failed to update data');
      }
    } catch (err) {
      console.error('Edit save error:', err);
      toast.error('Error saving edited data');
    }
  };
  
  const handleViewDataset = (dataset) => {
    loadDatasetData(dataset);
  };
  
  const handleCloseDataView = () => {
    setIsViewingData(false);
    setSelectedDataset(null);
    setSelectedDatasetData(null);
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

<<<<<<< Updated upstream
         
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
      
=======
        {/* Datasets List */}
        <div className="datasets-section">
          <div className="datasets-header">
            <h2 className="datasets-title">📁 Your Datasets</h2>
            <button 
              className="refresh-btn" 
              onClick={handleRefreshDatasets} 
              disabled={isRefreshing}
            >
              {isRefreshing ? <FiLoader className="spinner" size={16} /> : '🔄 Refresh'}
            </button>
          </div>
          {datasets.length === 0 ? (
            <div className="empty-datasets">
              <p>No datasets found. Import data from SQL Server, Excel, or CSV to get started.</p>
            </div>
          ) : (
            <div className="datasets-list">
              {datasets.map(dataset => (
                <DatasetCard
                  key={dataset.id}
                  dataset={dataset}
                  onView={handleViewDataset}
                  onEdit={handleEditClick}
                  onDelete={handleDeleteClick}
                  isSelected={selectedDataset?.id === dataset.id}
                />
              ))}
            </div>
          )}
        </div>
        
        {/* Uploaded Data Preview */}
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
      {isViewingData && selectedDatasetData && selectedDataset && (
        <FullDataView
          key={selectedDataset.id}
          data={selectedDatasetData}
          fileName={selectedDataset.file_name}
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
      
      {/* Edit Modal */}
      {showEditModal && (
        <ManualEntry 
          onSave={handleEditSave}
          onClose={() => setShowEditModal(false)}
          initialData={editingData}
          initialFileName={editingFileName}
        />
      )}
      
>>>>>>> Stashed changes
      {/* SQL Server Modal */}
      {showSQLModal && (
        <SQLServerConnector 
          onConnect={handleSQLImport}
          onClose={() => setShowSQLModal(false)}
        />
      )}
      
      {/* Manual Entry Modal */}
      {showManualModal && (
        <ManualEntry 
          onSave={handleManualSave}
          onClose={() => setShowManualModal(false)}
        />
      )}
<<<<<<< Updated upstream
      
      {/* Edit Modal (for editing existing data) */}
      {showEditModal && (
        <ManualEntry 
          onSave={handleManualSave}
          onClose={() => setShowEditModal(false)}
          initialData={editingData}
          initialFileName={editingFileName}
        />
      )}
=======
>>>>>>> Stashed changes
    </div>
  );
};

export default DataConnectionPage;