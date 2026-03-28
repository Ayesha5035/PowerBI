// src/App.jsx
import { useState } from 'react';
import Dashboard from "./components/Dashboard/Dashboard";
import DataConnectionPage from "./components/DataConnection/DataConnectionPage";
import './App.css';

function App() {
  const [showDataConnection, setShowDataConnection] = useState(false);

  const handleNavigateToDataConnection = () => {
    setShowDataConnection(true);
  };

  const handleBackToDashboard = () => {
    setShowDataConnection(false);
  };

  return (
    <div>
      {!showDataConnection ? (
        <Dashboard onNavigateToDataConnection={handleNavigateToDataConnection} />
      ) : (
        <DataConnectionPage onBackToDashboard={handleBackToDashboard} />
      )}
    </div>
  );
}

export default App;