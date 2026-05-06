// src/App.jsx
import { useState } from 'react';
import Dashboard from "./components/Dashboard/Dashboard";
import DataConnectionPage from "./components/DataConnection/DataConnectionPage";
import WorkspacePage from "./components/Workspace/WorkspacePage";
import FavouritesPage from "./components/Favourites/FavouritesPage";
import ReportBuilder from "./components/ReportBuilder/ReportBuilder";
import './App.css';

function App() {
  const [currentPage, setCurrentPage] = useState('dashboard');

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

  return <div>{renderPage()}</div>;
}

export default App;