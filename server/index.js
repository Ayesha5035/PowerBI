// server/index.js
const express = require('express');
const sql = require('mssql');
const cors = require('cors');
const dotenv = require('dotenv');
const os = require('os');

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

<<<<<<< Updated upstream
// Helper function to build connection config intelligently
function buildConnectionConfig(userConfig) {
    const server = userConfig.server || process.env.DB_SERVER;
    const port = userConfig.port || process.env.DB_PORT || 1433;
    const database = userConfig.database || process.env.DB_DATABASE;
    const username = userConfig.username || process.env.DB_USER;
    const password = userConfig.password || process.env.DB_PASSWORD;
    
    // Check if server name contains an instance (e.g., "FAROOQ\SQLEXPRESS")
    const hasInstance = server && server.includes('\\');
    
    // For connections WITH instance name, we need browser service
    // For connections WITHOUT instance name, we connect directly
    const config = {
        server: hasInstance ? server.split('\\')[0] : server,
        database: database,
        user: username,
        password: password,
        options: {
            encrypt: userConfig.encrypt === true || process.env.DB_ENCRYPT === 'true',
            trustServerCertificate: userConfig.trustCert === true || process.env.DB_TRUST_CERT === 'true',
            enableArithAbort: true
        },
        connectionTimeout: 30000,
        requestTimeout: 30000
    };
    
    // If no instance name, use the specified port
    if (!hasInstance) {
        config.port = parseInt(port);
    }
    
    return config;
}
=======
const server = http.createServer(app);
const io = initWebSocket(server);

const defaultSqlConfig = {
  user: process.env.SQL_USER || '',
  password: process.env.SQL_PASSWORD || '',
  server: process.env.SQL_SERVER || 'localhost',
  database: process.env.SQL_DATABASE || '',
  options: {
    encrypt: process.env.SQL_ENCRYPT === 'true',
    trustServerCertificate: process.env.SQL_TRUST_CERT === 'true',
    enableArithAbort: true
  },
  port: parseInt(process.env.SQL_PORT) || 1433
};

const activeConnections = new Map();
const changeDetector = new ChangeDetector(defaultSqlConfig);
changeDetector.setSocketIO(io);

const realtimeSync = new RealtimeSync(defaultSqlConfig);

if (process.env.ENABLE_REAL_TIME === 'true') {
  changeDetector.startPolling(parseInt(process.env.POLLING_INTERVAL) || 2000);
}

// ============ REALTIME SYNC ENDPOINTS ============

app.post('/api/start-realtime-sync', async (req, res) => {
  const { syncInterval = 3000, tableName = 'FYP', connectionConfig, sessionId = 'default' } = req.body;
  
  if (connectionConfig) {
    const sqlConfig = {
      user: connectionConfig.username || '',
      password: connectionConfig.password || '',
      server: connectionConfig.server,
      database: connectionConfig.database,
      port: parseInt(connectionConfig.port) || 1433,
      options: {
        encrypt: connectionConfig.encrypt || false,
        trustServerCertificate: connectionConfig.trustCert !== false,
        enableArithAbort: true
      }
    };
    
    activeConnections.set(sessionId, {
      config: sqlConfig,
      tableName: tableName,
      startTime: Date.now()
    });
    
    saveCredentials(connectionConfig);
    realtimeSync.updateConfig(sqlConfig);
    realtimeSync.tableName = tableName;
  }
  
  if (realtimeSync.isRunning) {
    realtimeSync.stop();
  }
  
  realtimeSync.syncIntervalMs = syncInterval;
  await realtimeSync.start();
  
  res.json({ 
    success: true, 
    message: `Real-time sync started. Interval: ${syncInterval}ms`,
    tableName
  });
});

app.post('/api/stop-realtime-sync', async (req, res) => {
  realtimeSync.stop();
  res.json({ success: true, message: 'Real-time sync stopped' });
});

app.post('/api/initial-import', async (req, res) => {
  const { tableName = 'FYP', connectionConfig } = req.body;
  
  if (connectionConfig) {
    const sqlConfig = {
      user: connectionConfig.username || '',
      password: connectionConfig.password || '',
      server: connectionConfig.server,
      database: connectionConfig.database,
      port: parseInt(connectionConfig.port) || 1433,
      options: {
        encrypt: connectionConfig.encrypt || false,
        trustServerCertificate: connectionConfig.trustCert !== false,
        enableArithAbort: true
      }
    };
    realtimeSync.updateConfig(sqlConfig);
  }
  
  realtimeSync.tableName = tableName;
  const result = await realtimeSync.initialImport();
  
  if (result.success && result.datasetId) {
    await realtimeSync.start();
  }
  
  res.json(result);
});

app.get('/api/sync-status', async (req, res) => {
  res.json({
    isRunning: realtimeSync.isRunning,
    lastSyncTime: realtimeSync.lastSyncTime,
    syncInterval: realtimeSync.syncIntervalMs,
    tableName: realtimeSync.tableName,
    activeConnections: activeConnections.size,
    currentDatasetId: realtimeSync.currentDatasetId,
    trackedRecordCount: realtimeSync.seenRecordIds.size,
    initialImportDone: realtimeSync.initialImportDone
  });
});

app.post('/api/reset-realtime-sync', async (req, res) => {
  const { datasetId } = req.body;
  
  if (datasetId) {
    await realtimeSync.resetForNewDataset(datasetId);
    res.json({ success: true, message: `Sync reset for dataset ${datasetId}` });
  } else {
    res.json({ success: true, message: 'Sync state cleared' });
  }
});

// ============ DATABASE STORAGE ENDPOINTS ============

app.post('/api/save-to-database', async (req, res) => {
  const { data, fileName, source } = req.body;
  
  if (!data || data.length === 0) {
    return res.status(400).json({ success: false, error: 'No data to save' });
  }
  
  req.setTimeout(120000);
  
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS imported_datasets (
        id SERIAL PRIMARY KEY,
        file_name VARCHAR(255),
        source VARCHAR(50),
        imported_at TIMESTAMPTZ DEFAULT NOW(),
        row_count INTEGER
      )
    `);
    
    await pool.query(`
      CREATE TABLE IF NOT EXISTS sql_imported_data (
        id SERIAL PRIMARY KEY,
        dataset_id INTEGER,
        data JSONB,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    
    const result = await pool.query(
      'INSERT INTO imported_datasets (file_name, source, row_count) VALUES ($1, $2, $3) RETURNING id',
      [fileName, source, data.length]
    );
    
    const datasetId = result.rows[0].id;
    const batchSize = 1000;
    console.log(`📥 Saving ${data.length} rows in batches of ${batchSize}...`);
    
    for (let i = 0; i < data.length; i += batchSize) {
      const batch = data.slice(i, i + batchSize);
      const values = batch.map(row => {
        const jsonString = JSON.stringify(row).replace(/'/g, "''");
        return `(${datasetId}, '${jsonString}')`;
      }).join(',');
      
      await pool.query(`INSERT INTO sql_imported_data (dataset_id, data) VALUES ${values}`);
      console.log(`   Progress: ${Math.min(i + batchSize, data.length)}/${data.length} rows`);
    }
    
    console.log(`✅ Saved ${data.length} rows to database (Dataset ID: ${datasetId})`);
    
    res.json({ success: true, message: `Saved ${data.length} rows to database`, datasetId });
  } catch (err) {
    console.error('Save error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/get-all-datasets', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT id, file_name, source, row_count, imported_at 
      FROM imported_datasets 
      ORDER BY imported_at DESC
    `);
    console.log(`📊 Found ${result.rows.length} datasets in database`);
    res.json({ success: true, datasets: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/get-dataset-data', async (req, res) => {
  const { datasetId } = req.body;
  
  if (!datasetId) {
    return res.status(400).json({ success: false, error: 'Dataset ID required' });
  }
  
  try {
    const result = await pool.query(`
      SELECT data FROM sql_imported_data 
      WHERE dataset_id = $1 
      ORDER BY id
    `, [datasetId]);
    
    const data = result.rows.map(row => row.data);
    res.json({ success: true, data, rowCount: data.length });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/delete-dataset', async (req, res) => {
  const { datasetId } = req.body;
  
  if (!datasetId) {
    return res.status(400).json({ success: false, error: 'Dataset ID required' });
  }
  
  try {
    const checkResult = await pool.query('SELECT id FROM imported_datasets WHERE id = $1', [datasetId]);
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Dataset not found' });
    }
    
    await pool.query('DELETE FROM sql_imported_data WHERE dataset_id = $1', [datasetId]);
    await pool.query('DELETE FROM imported_datasets WHERE id = $1', [datasetId]);
    
    console.log(`✅ Deleted dataset ${datasetId} permanently`);
    res.json({ success: true, message: 'Dataset deleted permanently' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ============ CONNECTION TEST ENDPOINTS ============

function buildConnectionConfig(userConfig) {
  const server = userConfig.server || process.env.DB_SERVER;
  const port = userConfig.port || process.env.DB_PORT || 1433;
  const database = userConfig.database || process.env.DB_DATABASE;
  const username = userConfig.username || process.env.DB_USER;
  const password = userConfig.password || process.env.DB_PASSWORD;
  
  const hasInstance = server && server.includes('\\');
  
  const config = {
    server: hasInstance ? server.split('\\')[0] : server,
    database: database,
    user: username,
    password: password,
    options: {
      encrypt: userConfig.encrypt === true || process.env.DB_ENCRYPT === 'true',
      trustServerCertificate: userConfig.trustCert === true || process.env.DB_TRUST_CERT === 'true',
      enableArithAbort: true
    },
    connectionTimeout: 30000,
    requestTimeout: 30000
  };
  
  if (!hasInstance) {
    config.port = parseInt(port);
  }
  
  return config;
}

const fs = require('fs');
const path = require('path');
const CREDENTIALS_FILE = path.join(__dirname, '.sql_credentials.json');

function saveCredentials(connectionConfig) {
  try {
    if (!connectionConfig || !connectionConfig.server) return;
    
    const data = {
      server: connectionConfig.server,
      database: connectionConfig.database,
      username: connectionConfig.username || '',
      password: connectionConfig.password || '',
      port: connectionConfig.port || '1433',
      encrypt: connectionConfig.encrypt || false,
      trustCert: connectionConfig.trustCert !== false,
      savedAt: new Date().toISOString()
    };
    
    fs.writeFileSync(CREDENTIALS_FILE, JSON.stringify(data, null, 2));
    console.log('✅ SQL Server credentials saved for auto-reconnect');
  } catch (err) {
    console.error('Failed to save credentials:', err.message);
  }
}

function loadCredentials() {
  try {
    if (fs.existsSync(CREDENTIALS_FILE)) {
      const data = JSON.parse(fs.readFileSync(CREDENTIALS_FILE, 'utf8'));
      console.log('📂 Loaded saved SQL Server credentials');
      return data;
    }
  } catch (err) {
    console.error('Failed to load credentials:', err.message);
  }
  return null;
}

// Auto-resume real-time sync after server starts
setTimeout(async () => {
  try {
    const result = await pool.query(`
      SELECT id, source FROM imported_datasets ORDER BY imported_at DESC LIMIT 1
    `);
    
    if (result.rows.length > 0 && result.rows[0].source === 'sqlserver') {
      const savedCredentials = loadCredentials();
      if (savedCredentials && savedCredentials.server) {
        console.log('🔄 Found saved credentials. Auto-resuming real-time sync...');
        
        const sqlConfig = {
          user: savedCredentials.username,
          password: savedCredentials.password,
          server: savedCredentials.server,
          database: savedCredentials.database,
          port: parseInt(savedCredentials.port) || 1433,
          options: {
            encrypt: savedCredentials.encrypt || false,
            trustServerCertificate: savedCredentials.trustCert !== false,
            enableArithAbort: true
          }
        };
        
        realtimeSync.updateConfig(sqlConfig);
        realtimeSync.currentDatasetId = result.rows[0].id;
        await realtimeSync.loadExistingRecordIds();
        realtimeSync.initialImportDone = true;
        await realtimeSync.start();
        console.log('✅ Real-time sync auto-resumed with saved credentials');
      } else {
        console.log('⚠️ No saved credentials found. Real-time sync will start after manual import.');
      }
    }
  } catch (err) {
    console.log('Auto-resume check failed:', err.message);
  }
}, 5000);
>>>>>>> Stashed changes

// Test connection endpoint
app.post('/api/test-connection', async (req, res) => {
<<<<<<< Updated upstream
    const { server, database, username, password, port, encrypt, trustCert } = req.body;
    
    // Validate required fields
    if (!server || !database) {
        return res.status(400).json({ 
            success: false, 
            error: 'Server and Database are required fields' 
        });
    }
    
    const config = buildConnectionConfig({
        server, database, username, password, port, 
        encrypt, trustCert
    });
=======
  const { server, database, username, password, port, encrypt, trustCert } = req.body;
  
  if (!server || !database) {
    return res.status(400).json({ success: false, error: 'Server and Database are required fields' });
  }
  
  const config = buildConnectionConfig({ server, database, username, password, port, encrypt, trustCert });
  let tempPool = null;
  
  try {
    tempPool = new sql.ConnectionPool(config);
    await tempPool.connect();
    
    const result = await tempPool.request().query(`
      SELECT @@SERVERNAME as ServerName, DB_NAME() as DatabaseName, @@VERSION as Version
    `);
    
    res.json({ success: true, message: `Connected to ${result.recordset[0].ServerName}`, serverInfo: result.recordset[0] });
  } catch (err) {
    let errorMessage = err.message;
    if (err.code === 'ENOTFOUND') errorMessage = `Server '${server}' not found. Check the server name.`;
    else if (err.code === 'ETIMEDOUT') errorMessage = `Connection timeout. Make sure SQL Server Browser service is running.`;
    else if (err.message.includes('Login failed')) errorMessage = `Login failed. Check username and password.`;
    
    res.status(500).json({ success: false, error: errorMessage, code: err.code });
  } finally {
    if (tempPool) await tempPool.close();
  }
});

app.post('/api/get-tables', async (req, res) => {
  const { server, database, username, password, port, encrypt, trustCert } = req.body;
  const config = buildConnectionConfig({ server, database, username, password, port, encrypt, trustCert });
  let poolConn = null;
  
  try {
    poolConn = new sql.ConnectionPool(config);
    await poolConn.connect();
    
    const result = await poolConn.request().query(`
      SELECT TABLE_SCHEMA, TABLE_NAME
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_TYPE = 'BASE TABLE'
      ORDER BY TABLE_NAME
    `);
    
    res.json({ success: true, tables: result.recordset });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  } finally {
    if (poolConn) await poolConn.close();
  }
});

app.post('/api/execute-query', async (req, res) => {
  const { server, database, username, password, port, encrypt, trustCert, query, limit = 10000 } = req.body;
  
  if (!query) {
    return res.status(400).json({ success: false, error: 'Query is required' });
  }
  
  const config = buildConnectionConfig({ server, database, username, password, port, encrypt, trustCert });
  let poolConn = null;
  
  try {
    poolConn = new sql.ConnectionPool(config);
    await poolConn.connect();
    
    let finalQuery = query;
    if (limit && query.trim().toUpperCase().startsWith('SELECT')) {
      if (!query.toUpperCase().includes('TOP')) {
        finalQuery = query.replace(/SELECT/i, `SELECT TOP ${limit}`);
      }
    }
    
    const result = await poolConn.request().query(finalQuery);
    const isSelect = query.trim().toUpperCase().startsWith('SELECT');
    
    if (isSelect && result.recordset && result.recordset.length > 0) {
      emitToAll('query-result', { data: result.recordset, rowCount: result.recordset.length, timestamp: Date.now() });
    }
    
    res.json({ success: true, data: isSelect ? result.recordset : null, rowsAffected: result.rowsAffected, isSelect });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  } finally {
    if (poolConn) await poolConn.close();
  }
});

app.get('/api/realtime-status/:machineId', async (req, res) => {
  const { machineId } = req.params;
  
  try {
    const status = await redisClient.hGetAll(`machine:${machineId}`);
    if (Object.keys(status).length === 0) {
      return res.json({ success: true, data: null, message: 'No data available' });
    }
>>>>>>> Stashed changes
    
    let tempPool = null;
    try {
        tempPool = new sql.ConnectionPool(config);
        await tempPool.connect();
        
        // Get server info for confirmation
        const result = await tempPool.request().query(`
            SELECT 
                @@SERVERNAME as ServerName,
                DB_NAME() as DatabaseName,
                @@VERSION as Version
        `);
        
        res.json({ 
            success: true, 
            message: `Connected to ${result.recordset[0].ServerName}`,
            serverInfo: result.recordset[0]
        });
    } catch (err) {
        console.error('Connection error:', err);
        
        // Provide helpful error messages
        let errorMessage = err.message;
        if (err.code === 'ENOTFOUND') {
            errorMessage = `Server '${server}' not found. Check the server name.`;
        } else if (err.code === 'ETIMEDOUT') {
            errorMessage = `Connection timeout. Make sure SQL Server Browser service is running or use direct connection.`;
        } else if (err.message.includes('Login failed')) {
            errorMessage = `Login failed. Check username and password.`;
        }
        
        res.status(500).json({ 
            success: false, 
            error: errorMessage,
            code: err.code
        });
    } finally {
        if (tempPool) {
            await tempPool.close();
        }
    }
});

// Get tables endpoint (same as before)
app.post('/api/get-tables', async (req, res) => {
    const { server, database, username, password, port, encrypt, trustCert } = req.body;
    
    const config = buildConnectionConfig({
        server, database, username, password, port, encrypt, trustCert
    });
    
    let pool = null;
    try {
        pool = new sql.ConnectionPool(config);
        await pool.connect();
        
        const result = await pool.request().query(`
            SELECT 
                TABLE_SCHEMA,
                TABLE_NAME
            FROM INFORMATION_SCHEMA.TABLES 
            WHERE TABLE_TYPE = 'BASE TABLE'
            ORDER BY TABLE_NAME
        `);
        
        res.json({ success: true, tables: result.recordset });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    } finally {
        if (pool) await pool.close();
    }
});

<<<<<<< Updated upstream
// Execute query endpoint
app.post('/api/execute-query', async (req, res) => {
    const { server, database, username, password, port, encrypt, trustCert, query, limit } = req.body;
    
    if (!query) {
        return res.status(400).json({ success: false, error: 'Query is required' });
    }
    
    const config = buildConnectionConfig({
        server, database, username, password, port, encrypt, trustCert
    });
    
    let pool = null;
    try {
        pool = new sql.ConnectionPool(config);
        await pool.connect();
        
        let finalQuery = query;
        if (limit && query.trim().toUpperCase().startsWith('SELECT')) {
            if (!query.toUpperCase().includes('TOP')) {
                finalQuery = query.replace(/SELECT/i, `SELECT TOP ${limit}`);
            }
        }
        
        const result = await pool.request().query(finalQuery);
        const isSelect = query.trim().toUpperCase().startsWith('SELECT');
        
        res.json({ 
            success: true, 
            data: isSelect ? result.recordset : null,
            rowsAffected: result.rowsAffected,
            isSelect: isSelect
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    } finally {
        if (pool) await pool.close();
    }
=======
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
>>>>>>> Stashed changes
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 SQL Server API running on port ${PORT}`);
    console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
});