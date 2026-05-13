// src/App.jsx
import { useState, useEffect } from 'react';
import Dashboard from "./components/Dashboard/Dashboard";
import DataConnectionPage from "./components/DataConnection/DataConnectionPage";
import WorkspacePage from "./components/Workspace/WorkspacePage";
import FavouritesPage from "./components/Favourites/FavouritesPage";
import ReportBuilder from "./components/ReportBuilder/ReportBuilder";
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

  console.log("Current page:", currentPage);

  // Navigation functions
  const goToDashboard = () => setCurrentPage('dashboard');
  const goToDataConnection = () => setCurrentPage('dataconnection');
  const goToWorkspace = () => setCurrentPage('workspace');
  const goToFavourites = () => setCurrentPage('favourites');
  const goToReportBuilder = () => setCurrentPage('reportbuilder');

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return (
          <Dashboard 
            sidebarOpen={sidebarOpen}
            toggleSidebar={toggleSidebar}
            onNavigateToDataConnection={goToDataConnection}
            onNavigateToWorkspace={goToWorkspace}
            onNavigateToFavourites={goToFavourites}
            onNavigateToReportBuilder={goToReportBuilder}
          />
        );
        
      case 'dataconnection':
        return (
          <DataConnectionPage 
            sidebarOpen={sidebarOpen}
            toggleSidebar={toggleSidebar}
            onBackToDashboard={goToDashboard}
            onNavigateToDataConnection={goToDataConnection}
            onNavigateToWorkspace={goToWorkspace}
            onNavigateToFavourites={goToFavourites}
            onNavigateToReportBuilder={goToReportBuilder}
          />
        );
        
      case 'workspace':
        return (
          <WorkspacePage 
            sidebarOpen={sidebarOpen}
            toggleSidebar={toggleSidebar}
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
            sidebarOpen={sidebarOpen}
            toggleSidebar={toggleSidebar}
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
            sidebarOpen={sidebarOpen}
            toggleSidebar={toggleSidebar}
            onBackToDashboard={goToDashboard}
            onNavigateToDataConnection={goToDataConnection}
            onNavigateToWorkspace={goToWorkspace}
            onNavigateToFavourites={goToFavourites}
            onNavigateToReportBuilder={goToReportBuilder}
          />
        );
        
      default:
        return (
          <Dashboard 
            sidebarOpen={sidebarOpen}
            toggleSidebar={toggleSidebar}
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