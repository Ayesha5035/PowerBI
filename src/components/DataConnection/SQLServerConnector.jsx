// src/components/DataConnection/SQLServerConnector.jsx
import React, { useState } from 'react';
import { FiDatabase, FiCheck, FiX, FiLoader, FiRefreshCw, FiTable, FiSave } from 'react-icons/fi';
import './SQLServerConnector.css';

const SQLServerConnector = ({ onConnect, onClose }) => {
  const [connectionConfig, setConnectionConfig] = useState({
    server: '',
    database: '',
    username: '',
    password: '',
    port: '1433',
    encrypt: false,
    trustCert: true
  });
  
  const [query, setQuery] = useState('SELECT TOP 100 * FROM your_table_name');
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState(null);
  const [previewData, setPreviewData] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [tables, setTables] = useState([]);
  const [showTableSelector, setShowTableSelector] = useState(false);
  const [executing, setExecuting] = useState(false);
<<<<<<< Updated upstream
  const [queryResult, setQueryResult] = useState(null);
=======
  const [showFullTips, setShowFullTips] = useState(false);
  const [socket, setSocket] = useState(null);
  const [selectedTable, setSelectedTable] = useState('');
  const [isLoadingTable, setIsLoadingTable] = useState(false);

  useEffect(() => {
    const newSocket = io('http://localhost:5000');
    setSocket(newSocket);
    
    newSocket.on('realtime-data-update', (data) => {
      console.log('Real-time update received:', data);
    });
    
    return () => newSocket.disconnect();
  }, []);
>>>>>>> Stashed changes

  const handleConfigChange = (e) => {
    const { name, value, type, checked } = e.target;
    setConnectionConfig({
      ...connectionConfig,
      [name]: type === 'checkbox' ? checked : value
    });
    setIsConnected(false);
    setConnectionStatus(null);
    setPreviewData(null);
    setTables([]);
    setSelectedTable('');
  };

  const testConnection = async () => {
    if (!connectionConfig.server || !connectionConfig.database) {
      setConnectionStatus({ type: 'error', message: 'Server and Database are required!' });
      return;
    }
    
    setIsConnecting(true);
    setConnectionStatus({ type: 'loading', message: 'Testing connection...' });
    
    try {
      const response = await fetch('http://localhost:5000/api/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(connectionConfig)
      });
      const result = await response.json();
      
      if (result.success) {
        setConnectionStatus({ type: 'success', message: result.message });
        setIsConnected(true);
        await loadTables();
      } else {
        setConnectionStatus({ type: 'error', message: result.error || 'Connection failed' });
      }
    } catch (error) {
      setConnectionStatus({ type: 'error', message: 'Cannot reach backend server. Make sure server is running on port 5000' });
    }
    setIsConnecting(false);
  };

  const loadTables = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/get-tables', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(connectionConfig)
      });
      const result = await response.json();
      if (result.success) {
        setTables(result.tables);
      } else {
        console.error('Error loading tables:', result.error);
      }
    } catch (error) {
      console.error('Error loading tables:', error);
    }
  };

  const executeQuery = async () => {
    if (!query.trim()) {
      alert('Please enter a SQL query');
      return;
    }
    
    setExecuting(true);
    setConnectionStatus({ type: 'loading', message: 'Executing query...' });
    
    try {
      const response = await fetch('http://localhost:5000/api/execute-query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          ...connectionConfig,
          query: query,
<<<<<<< Updated upstream
          limit: 500
=======
          limit: 5000
>>>>>>> Stashed changes
        })
      });
      const result = await response.json();
      
      if (result.success) {
        if (result.isSelect && result.data) {
          setPreviewData(result.data);
          setQueryResult(result.data);
          setConnectionStatus({ type: 'success', message: `Query returned ${result.data.length} rows` });
        } else if (!result.isSelect) {
          setConnectionStatus({ type: 'success', message: `Query executed. ${result.rowsAffected?.[0] || 0} rows affected.` });
        }
      } else {
        setConnectionStatus({ type: 'error', message: result.error });
      }
    } catch (error) {
      setConnectionStatus({ type: 'error', message: 'Failed to execute query' });
    }
    setExecuting(false);
  };

  // FIXED: Proper table loading with selectedTable state
  const loadTableData = async (tableName) => {
<<<<<<< Updated upstream
    const newQuery = `SELECT TOP 100 * FROM [${tableName}]`;
=======
    if (!tableName) return;
    
    setIsLoadingTable(true);
    setSelectedTable(tableName);
    const newQuery = `SELECT TOP 5000 * FROM [${tableName}]`;
>>>>>>> Stashed changes
    setQuery(newQuery);
    setShowTableSelector(false);
    
    setConnectionStatus({ type: 'loading', message: `Loading ${tableName}...` });
    
    try {
      const response = await fetch('http://localhost:5000/api/execute-query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          ...connectionConfig,
          query: newQuery,
<<<<<<< Updated upstream
          limit: 500
=======
          limit: 5000
>>>>>>> Stashed changes
        })
      });
      const result = await response.json();
      
      if (result.success && result.data) {
        setPreviewData(result.data);
        setQueryResult(result.data);
        setConnectionStatus({ type: 'success', message: `Loaded ${result.data.length} rows from ${tableName}` });
      } else {
        setConnectionStatus({ type: 'error', message: result.error || 'Failed to load table' });
        setSelectedTable('');
      }
    } catch (error) {
      console.error('Load table error:', error);
      setConnectionStatus({ type: 'error', message: 'Failed to load table: ' + error.message });
      setSelectedTable('');
    }
    setIsLoadingTable(false);
  };

<<<<<<< Updated upstream
  const handleImport = () => {
    if (previewData && previewData.length > 0) {
      const fileName = `sql_${connectionConfig.database}_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.json`;
      onConnect(previewData, fileName);
      onClose();
    } else {
      alert('No data to import. Please execute a query first.');
=======
  // FIXED: Handle table selection change
  const handleTableChange = (e) => {
    const tableName = e.target.value;
    if (tableName) {
      loadTableData(tableName);
    } else {
      setSelectedTable('');
      setPreviewData(null);
    }
  };

        const handleImport = async () => {
  if (previewData && previewData.length > 0) {
    setIsImporting(true);
    const fileName = `sql_${connectionConfig.database}_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.json`;
    
    try {
      const saveResponse = await fetch('http://localhost:5000/api/save-to-database', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          data: previewData,
          fileName: fileName,
          source: 'sqlserver'
        })
      });
      
      const saveResult = await saveResponse.json();
      
      if (saveResult.success) {
        await fetch('http://localhost:5000/api/start-realtime-sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            syncInterval: 3000,
            tableName: selectedTable || 'FYP',
            connectionConfig: {
              server: connectionConfig.server,
              database: connectionConfig.database,
              username: connectionConfig.username,
              password: connectionConfig.password,
              port: connectionConfig.port || '1433',
              encrypt: connectionConfig.encrypt,
              trustCert: connectionConfig.trustCert
            }
          })
        });
        
        // Reset sync state for the new dataset
        await fetch('http://localhost:5000/api/reset-realtime-sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ datasetId: saveResult.datasetId })
        });
        
        onConnect(previewData, fileName, saveResult.datasetId);
        onClose();
        toast.success(`Successfully imported ${previewData.length} rows! Real-time sync is now active.`);
      } else {
        toast.error('Failed to save to database');
      }
    } catch (error) {
      console.error('Import error:', error);
      toast.error('Failed to import data: ' + error.message);
>>>>>>> Stashed changes
    }
    setIsImporting(false);
  } else {
    toast.error('No data to import. Please execute a query first.');
  }
};
          

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="sql-modal" onClick={(e) => e.stopPropagation()}>
        <div className="sql-modal-header">
          <h2><FiDatabase size={22} /> SQL Server Connection</h2>
          <button className="close-modal" onClick={onClose}>×</button>
        </div>
        
        <div className="sql-modal-body">
          <div className="form-section-title">📡 Connection Settings</div>
          
          <div className="form-row">
            <div className="form-group half">
              <label>Server <span>*</span></label>
              <input
                type="text"
                name="server"
                placeholder="localhost, 192.168.1.100, or SERVER\\INSTANCE"
                value={connectionConfig.server}
                onChange={handleConfigChange}
              />
              {/* ✅ PASTE THE HELPER TEXT HERE - INSIDE the form-group after input */}
              <small className="form-hint">
                💡 <strong>Tips:</strong><br/>
                • For default instance: use computer name or IP (e.g., FAROOQ or localhost)<br/>
                • For named instance: use COMPUTER\INSTANCE (e.g., FAROOQ\SQLEXPRESS)<br/>
                • If using named instance, ensure SQL Browser service is running
              </small>
            </div>
            
            <div className="form-group half">
              <label>Database <span>*</span></label>
              <input
                type="text"
                name="database"
                placeholder="Database name"
                value={connectionConfig.database}
                onChange={handleConfigChange}
              />
              <small className="form-hint">The database you want to connect to</small>
            </div>
          </div>
          
          <div className="form-row">
            <div className="form-group half">
              <label>Username</label>
              <input
                type="text"
                name="username"
                placeholder="sa or domain\\username"
                value={connectionConfig.username}
                onChange={handleConfigChange}
              />
              <small className="form-hint">Leave blank for Windows Authentication</small>
            </div>
            
            <div className="form-group half">
              <label>Password</label>
              <input
                type="password"
                name="password"
                placeholder="••••••••"
                value={connectionConfig.password}
                onChange={handleConfigChange}
              />
            </div>
          </div>
          
          <div className="form-row">
            <div className="form-group half">
              <label>Port</label>
              <input
                type="text"
                name="port"
                placeholder="1433"
                value={connectionConfig.port}
                onChange={handleConfigChange}
              />
              {/* ✅ PASTE THE PORT HELPER TEXT HERE */}
              <small className="form-hint">
                Default is 1433. Only needed for direct connection (without instance name)
              </small>
            </div>
            
            <div className="form-group half">
              <label>&nbsp;</label>
              <div className="checkbox-group">
                <label>
                  <input
                    type="checkbox"
                    name="encrypt"
                    checked={connectionConfig.encrypt}
                    onChange={handleConfigChange}
                  />
                  Enable Encryption (for Azure/remote)
                </label>
                <label>
                  <input
                    type="checkbox"
                    name="trustCert"
                    checked={connectionConfig.trustCert}
                    onChange={handleConfigChange}
                  />
                  Trust Server Certificate
                </label>
              </div>
            </div>
          </div>
          
          <button 
            className="test-connect-btn" 
            onClick={testConnection}
            disabled={isConnecting || !connectionConfig.server || !connectionConfig.database}
          >
            {isConnecting ? <FiLoader className="spinner" /> : <FiDatabase />}
            {isConnecting ? 'Testing...' : 'Test Connection'}
          </button>
          
          {connectionStatus && (
            <div className={`connection-status ${connectionStatus.type}`}>
              {connectionStatus.type === 'success' && <FiCheck />}
              {connectionStatus.type === 'error' && <FiX />}
              {connectionStatus.type === 'loading' && <FiLoader className="spinner" />}
              <span>{connectionStatus.message}</span>
            </div>
          )}
          
          {isConnected && (
            <>
              <div className="form-section-title">🔍 Query & Data</div>
              
              {tables.length > 0 && (
                <div className="table-selector">
                  <label>Quick Select Table</label>
                  <div className="selector-wrapper">
                    <select 
<<<<<<< Updated upstream
                      onChange={(e) => loadTableData(e.target.value)}
                      defaultValue=""
=======
                      onChange={handleTableChange}
                      value={selectedTable}
                      disabled={isLoadingTable}
>>>>>>> Stashed changes
                    >
                      <option value="">-- Select a table to preview --</option>
                      {tables.map((table, idx) => (
                        <option key={`${table.TABLE_SCHEMA}.${table.TABLE_NAME}`} value={table.TABLE_NAME}>
                          {table.TABLE_SCHEMA}.{table.TABLE_NAME}
                        </option>
                      ))}
                    </select>
                    <FiTable className="selector-icon" />
                    {isLoadingTable && <div className="spinner-small"></div>}
                  </div>
                </div>
              )}
              
              <div className="form-group">
                <label>SQL Query</label>
                <textarea
                  className="query-input"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="SELECT TOP 100 * FROM your_table"
                  rows={5}
                  spellCheck={false}
                />
                <small className="form-hint">
                  💡 Tips: Use SELECT TOP 100 for preview, be careful with UPDATE/DELETE
                </small>
              </div>
              
<<<<<<< Updated upstream
              <button 
                className="execute-btn" 
                onClick={executeQuery}
                disabled={executing}
              >
=======
              <button className="execute-btn" onClick={executeQuery} disabled={executing || isLoadingTable}>
>>>>>>> Stashed changes
                {executing ? <FiLoader className="spinner" /> : <FiRefreshCw />}
                {executing ? 'Executing...' : 'Execute Query'}
              </button>
            </>
          )}
          
          {previewData && previewData.length > 0 && (
            <div className="table-preview">
              <h4>📊 Data Preview ({previewData.length.toLocaleString()} rows)</h4>
              <div className="preview-table-container">
                <table className="preview-table">
                  <thead>
                    <tr>
                      {previewData[0] && Object.keys(previewData[0]).map(key => (
                        <th key={key}>{key}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {previewData.slice(0, 20).map((row, idx) => (
                      <tr key={idx}>
                        {row && Object.values(row).map((val, i) => (
                          <td key={i}>
                            {val === null ? 'NULL' : 
                             typeof val === 'object' ? JSON.stringify(val).slice(0, 50) : 
                             String(val).slice(0, 100)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {previewData.length > 20 && (
                <p className="preview-note">
                  Showing first 20 of {previewData.length.toLocaleString()} rows
                </p>
              )}
            </div>
          )}
        </div>
        
        <div className="sql-modal-footer">
          <button className="cancel-btn" onClick={onClose}>Cancel</button>
          <button 
            className="import-btn" 
            onClick={handleImport}
            disabled={!previewData || previewData.length === 0}
          >
            <FiSave /> Import Data ({previewData?.length || 0} rows)
          </button>
        </div>
      </div>
    </div>
  );
};

export default SQLServerConnector;