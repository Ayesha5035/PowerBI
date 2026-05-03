// src/App.jsx
import { useState } from 'react';
import Dashboard from "./components/Dashboard/Dashboard";
import DataConnectionPage from "./components/DataConnection/DataConnectionPage";
import WorkspacePage from "./components/Workspace/WorkspacePage";
import FavouritesPage from "./components/Favourites/FavouritesPage";
import './App.css';

function App() {
  const [currentPage, setCurrentPage] = useState('dashboard');

  const goToDashboard = () => setCurrentPage('dashboard');
  const goToDataConnection = () => setCurrentPage('dataconnection');
  const goToWorkspace = () => setCurrentPage('workspace');
  const goToReports = () => setCurrentPage('reports');
  const goToFavourites = () => setCurrentPage('favourites');

  // Dashboard Page
  if (currentPage === 'dashboard') {
    return (
      <Dashboard 
        onNavigateToDataConnection={goToDataConnection}
        onNavigateToWorkspace={goToWorkspace}
        onNavigateToReports={goToReports}
        onNavigateToFavourites={goToFavourites}
      />
    );
  }
  
  // Data Connection Page
  if (currentPage === 'dataconnection') {
    return <DataConnectionPage onBackToDashboard={goToDashboard} />;
  }
  
  // Workspace Page
  if (currentPage === 'workspace') {
    return (
      <WorkspacePage 
        onBackToDashboard={goToDashboard}
        onNavigateToDataConnection={goToDataConnection}
        onNavigateToWorkspace={goToWorkspace}
        onNavigateToReports={goToReports}
        onNavigateToFavourites={goToFavourites}
      />
    );
  }
  
  // Reports Page
  if (currentPage === 'reports') {
    return (
      <ReportsPage 
        onBackToDashboard={goToDashboard}
        onNavigateToDataConnection={goToDataConnection}
        onNavigateToWorkspace={goToWorkspace}
        onNavigateToReports={goToReports}
        onNavigateToFavourites={goToFavourites}
      />
    );
  }
  
  // Favourites Page
  if (currentPage === 'favourites') {
    return (
      <FavouritesPage 
        onBackToDashboard={goToDashboard}
        onNavigateToDataConnection={goToDataConnection}
        onNavigateToWorkspace={goToWorkspace}
        onNavigateToReports={goToReports}
        onNavigateToFavourites={goToFavourites}
      />
    );
  }
  
  return <Dashboard onNavigateToDataConnection={goToDataConnection} />;
}

export default App;