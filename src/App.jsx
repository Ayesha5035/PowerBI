// src/App.jsx
import { useState, useEffect } from 'react';
import Dashboard from "./components/Dashboard/Dashboard";
import DataConnectionPage from "./components/DataConnection/DataConnectionPage";
import WorkspacePage from "./components/Workspace/WorkspacePage";
import FavouritesPage from "./components/Favourites/FavouritesPage";
import ReportBuilder from "./components/ReportBuilder/ReportBuilder";
import { Toaster } from 'react-hot-toast';
import './App.css';

function App() {
  const [currentPage, setCurrentPage] = useState(() => {
    const savedPage = localStorage.getItem("currentPage");
    return savedPage || 'dashboard';
  });
  
  // ========== SINGLE SIDEBAR STATE FOR ALL PAGES ==========
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    // Load saved state from localStorage
    const saved = localStorage.getItem("sidebarOpen");
    return saved !== null ? JSON.parse(saved) : true;
  });

  // Save sidebar state whenever it changes
  useEffect(() => {
    localStorage.setItem("sidebarOpen", JSON.stringify(sidebarOpen));
  }, [sidebarOpen]);
  
  // Save current page whenever it changes
  useEffect(() => {
    localStorage.setItem("currentPage", currentPage);
  }, [currentPage]);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  // NEW: State for uploaded data
  const [uploadedData, setUploadedData] = useState(null);
  const [uploadedFileName, setUploadedFileName] = useState(null);
  const [uploadedColumns, setUploadedColumns] = useState([]);

  // Navigation functions
  const goToDashboard = () => setCurrentPage('dashboard');
  const goToDataConnection = () => setCurrentPage('dataconnection');
  const goToWorkspace = () => setCurrentPage('workspace');
  const goToFavourites = () => setCurrentPage('favourites');
  const goToReportBuilder = () => setCurrentPage('reportbuilder');

  // NEW: Handle data upload from DataConnectionPage
  const handleDataUpload = (data, fileName) => {
    console.log("Data received in App:", { rows: data?.length, fileName });
    setUploadedData(data);
    setUploadedFileName(fileName);
    if (data && data.length > 0) {
      setUploadedColumns(Object.keys(data[0]));
    }
    // Automatically go to ReportBuilder after upload
    setCurrentPage('reportbuilder');
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return (
          <Dashboard 
            onNavigateToDataConnection={goToDataConnection}
            onNavigateToWorkspace={goToWorkspace}
            onNavigateToFavourites={goToFavourites}
            onNavigateToReportBuilder={goToReportBuilder}
          />
        );
      case 'dataconnection':
        return (
          <DataConnectionPage 
            onBackToDashboard={goToDashboard}
          />
        );
      case 'workspace':
        return (
          <WorkspacePage 
            onBackToDashboard={goToDashboard}
            onNavigateToDataConnection={goToDataConnection}
            onNavigateToWorkspace={goToWorkspace}
            onNavigateToFavourites={goToFavourites}
            onNavigateToReportBuilder={goToReportBuilder}
          />
        );
      case 'favourites':
        return (
          <FavouritesPage 
            onBackToDashboard={goToDashboard}
            onNavigateToDataConnection={goToDataConnection}
            onNavigateToWorkspace={goToWorkspace}
            onNavigateToFavourites={goToFavourites}
            onNavigateToReportBuilder={goToReportBuilder}
          />
        );
      case 'reportbuilder':
        return (
          <ReportBuilder 
            onBackToDashboard={goToDashboard}
          />
        );
      default:
        return (
          <Dashboard 
            onNavigateToDataConnection={goToDataConnection}
            onNavigateToWorkspace={goToWorkspace}
            onNavigateToFavourites={goToFavourites}
            onNavigateToReportBuilder={goToReportBuilder}
          />
        );
    }
  };

  return (
    <>
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
            borderRadius: '8px',
          },
          success: {
            duration: 3000,
            iconTheme: {
              primary: '#10b981',
              secondary: '#fff',
            },
          },
          error: {
            duration: 4000,
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
        }}
      />
      {renderPage()}
    </>
  );
}

export default App;