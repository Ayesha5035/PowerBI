// src/App.jsx
import { useState } from 'react';
import Dashboard from "./components/Dashboard/Dashboard";
import DataConnectionPage from "./components/DataConnection/DataConnectionPage";
import './App.css';

function App() {
  const [showDataConnection, setShowDataConnection] = useState(false);

  return (
    <div>
      {!showDataConnection ? (
        <Dashboard onNavigateToDataConnection={() => setShowDataConnection(true)} />
      ) : (
        <DataConnectionPage onBackToDashboard={() => setShowDataConnection(false)} />
      )}
    </div>
  );
}

export default App;