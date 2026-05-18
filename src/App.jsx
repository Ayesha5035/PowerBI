// src/App.jsx
import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Dashboard from "./components/Dashboard/Dashboard";
import DataConnectionPage from "./components/DataConnection/DataConnectionPage";
import WorkspacePage from "./components/Workspace/WorkspacePage";
import FavouritesPage from "./components/Favourites/FavouritesPage";
import ReportBuilder from "./components/ReportBuilder/ReportBuilder";
import './App.css';

// Smart ProtectedRoute - Checks auth on EVERY access
// Smart ProtectedRoute - Checks auth on EVERY access
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();
  
  // Skip during initial load - show NOTHING to prevent flash
  if (loading) {
    return null;
  }
  
  // NO TOKEN or NO USER = REDIRECT TO LOGIN
  if (!user) {
    console.log('🔒 Not authenticated - Redirecting to login');
    return <Navigate to="/login" replace />;
  }
  
  return children;
};

// Prevent Cache Component
const NoCache = ({ children }) => {
  useEffect(() => {
    // Disable browser cache for this page
    window.history.pushState(null, '', location.pathname);
  }, []);
  
  return children;
};

function App() {
 const [currentPage, setCurrentPage] = useState(() => {
  const savedPage = localStorage.getItem("currentPage");
  return savedPage || 'dashboard';
});
  // ========== SINGLE SIDEBAR STATE FOR ALL PAGES ==========
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    const saved = localStorage.getItem("sidebarOpen");
    return saved !== null ? JSON.parse(saved) : true;
  });

  useEffect(() => {
    localStorage.setItem("sidebarOpen", JSON.stringify(sidebarOpen));
  }, [sidebarOpen]);
  // Save current page whenever it changes
useEffect(() => {
  localStorage.setItem("currentPage", currentPage);
}, [currentPage]);

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  const [uploadedData, setUploadedData] = useState(null);
  const [uploadedFileName, setUploadedFileName] = useState(null);
  const [uploadedColumns, setUploadedColumns] = useState([]);

  const goToDashboard = () => setCurrentPage('dashboard');
  const goToDataConnection = () => setCurrentPage('dataconnection');
  const goToWorkspace = () => setCurrentPage('workspace');
  const goToFavourites = () => setCurrentPage('favourites');
  const goToReportBuilder = () => setCurrentPage('reportbuilder');

  const handleDataUpload = (data, fileName) => {
    console.log("Data received in App:", { rows: data?.length, fileName });
    setUploadedData(data);
    setUploadedFileName(fileName);
    if (data && data.length > 0) {
      setUploadedColumns(Object.keys(data[0]));
    }
    setCurrentPage('reportbuilder');
  };

  const renderAppContent = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard sidebarOpen={sidebarOpen} toggleSidebar={toggleSidebar} onNavigateToDataConnection={goToDataConnection} onNavigateToWorkspace={goToWorkspace} onNavigateToFavourites={goToFavourites} onNavigateToReportBuilder={goToReportBuilder} />;
      case 'dataconnection':
        return <DataConnectionPage sidebarOpen={sidebarOpen} toggleSidebar={toggleSidebar} onBackToDashboard={goToDashboard} onNavigateToDataConnection={goToDataConnection} onNavigateToWorkspace={goToWorkspace} onNavigateToFavourites={goToFavourites} onNavigateToReportBuilder={goToReportBuilder} onDataUpload={handleDataUpload} />;
      case 'workspace':
        return <WorkspacePage sidebarOpen={sidebarOpen} toggleSidebar={toggleSidebar} onBackToDashboard={goToDashboard} onNavigateToDataConnection={goToDataConnection} onNavigateToWorkspace={goToWorkspace} onNavigateToFavourites={goToFavourites} onNavigateToReportBuilder={goToReportBuilder} />;
      case 'favourites':
        return <FavouritesPage sidebarOpen={sidebarOpen} toggleSidebar={toggleSidebar} onBackToDashboard={goToDashboard} onNavigateToDataConnection={goToDataConnection} onNavigateToWorkspace={goToWorkspace} onNavigateToFavourites={goToFavourites} onNavigateToReportBuilder={goToReportBuilder} />;
      case 'reportbuilder':
        return <ReportBuilder sidebarOpen={sidebarOpen} toggleSidebar={toggleSidebar} onBackToDashboard={goToDashboard} onNavigateToDataConnection={goToDataConnection} onNavigateToWorkspace={goToWorkspace} onNavigateToFavourites={goToFavourites} onNavigateToReportBuilder={goToReportBuilder} uploadedData={uploadedData} uploadedFileName={uploadedFileName} uploadedColumns={uploadedColumns} />;
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

  return <div>{renderPage()}</div>;
}

export default App;