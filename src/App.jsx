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
            onDataUpload={handleDataUpload}  // NEW: Pass this prop
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
            uploadedData={uploadedData}        // NEW: Pass data to ReportBuilder
            uploadedFileName={uploadedFileName}  // NEW: Pass filename
            uploadedColumns={uploadedColumns}    // NEW: Pass columns
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