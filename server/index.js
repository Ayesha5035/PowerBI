// server/index.js
const express = require('express');
const cors = require('cors');
const path = require('path');
const sql = require('mssql');
const http = require('http');
// Keep your existing path (don't change it)
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

// Import authentication routes
const authRoutes = require('./routes/auth');
const userDataRoutes = require('./routes/user-data');

// Import your existing services
const ChangeDetector = require('./services/changeDetector');
const RealtimeSync = require('./services/realtimeSync');
const { initWebSocket, emitToAll } = require('./services/websocket');
const { redisClient } = require('./db/redis');
const { pool } = require('./db/postgres');

const app = express();
const PORT = process.env.PORT || 5000;

// ============================================
// MIDDLEWARE
// ============================================
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());

// ============================================
// AUTHENTICATION ROUTES (NEW)
// ============================================
app.use('/api/auth', authRoutes);
app.use('/api/user', userDataRoutes);

// ============================================
// CREATE HTTP SERVER FOR WEBSOCKET
// ============================================
const server = http.createServer(app);

// Initialize WebSocket
const io = initWebSocket(server);

// ============================================
// SQL SERVER CONNECTION (YOUR EXISTING CODE)
// ============================================

// Default SQL Server connection config
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

// Store active connections per session
const activeConnections = new Map();

// Initialize Change Detector
const changeDetector = new ChangeDetector(defaultSqlConfig);
changeDetector.setSocketIO(io);

// Initialize RealtimeSync
const realtimeSync = new RealtimeSync(defaultSqlConfig);

// Start polling for changes
if (process.env.ENABLE_REAL_TIME === 'true') {
  changeDetector.startPolling(parseInt(process.env.POLLING_INTERVAL) || 2000);
}

// ============================================
// REALTIME SYNC ENDPOINTS (YOUR EXISTING CODE)
// ============================================

app.post('/api/start-realtime-sync', async (req, res) => {
  const { syncInterval = 2000, tableName = 'FYP', connectionConfig, sessionId = 'default' } = req.body;
  
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
        enableArithABort: true
      }
    };
    
    activeConnections.set(sessionId, {
      config: sqlConfig,
      tableName: tableName,
      startTime: Date.now()
    });
    
    realtimeSync.updateConfig(sqlConfig);
    realtimeSync.tableName = tableName;
  }
  
  if (!realtimeSync.isRunning && activeConnections.size > 0) {
    realtimeSync.syncIntervalMs = syncInterval;
    await realtimeSync.start();
    res.json({ 
      success: true, 
      message: `Real-time sync started. Interval: ${syncInterval}ms`,
      tableName
    });
  } else if (realtimeSync.isRunning) {
    res.json({ success: false, message: 'Sync already running' });
  } else {
    res.json({ success: false, message: 'No connection configuration provided' });
  }
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
        enableArithABort: true
      }
    };
    realtimeSync.updateConfig(sqlConfig);
  }
  
  realtimeSync.tableName = tableName;
  const result = await realtimeSync.initialImport();
  res.json(result);
});

app.get('/api/sync-status', async (req, res) => {
  res.json({
    isRunning: realtimeSync.isRunning,
    lastSyncTime: realtimeSync.lastSyncTime,
    syncInterval: realtimeSync.syncIntervalMs,
    tableName: realtimeSync.tableName,
    activeConnections: activeConnections.size
  });
});

// ============================================
// DATABASE STORAGE ENDPOINTS (YOUR EXISTING CODE)
// ============================================

app.post('/api/save-to-database', async (req, res) => {
  const { data, fileName, source } = req.body;
  
  if (!data || data.length === 0) {
    return res.status(400).json({ success: false, error: 'No data to save' });
  }
  
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
    
    for (const row of data) {
      await pool.query(
        'INSERT INTO sql_imported_data (dataset_id, data) VALUES ($1, $2)',
        [datasetId, row]
      );
    }
    
    res.json({ 
      success: true, 
      message: `Saved ${data.length} rows to database`,
      datasetId 
    });
    
  } catch (err) {
    console.error('Save error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/get-saved-datasets', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT id, file_name, source, row_count, imported_at 
      FROM imported_datasets 
      ORDER BY imported_at DESC
    `);
    
    res.json({ success: true, datasets: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/load-dataset', async (req, res) => {
  const { datasetId } = req.body;
  
  try {
    const result = await pool.query(
      'SELECT data FROM sql_imported_data WHERE dataset_id = $1 ORDER BY id',
      [datasetId]
    );
    
    const data = result.rows.map(row => row.data);
    
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/get-imported-data', async (req, res) => {
  try {
    const datasetResult = await pool.query(`
      SELECT id, file_name, row_count, imported_at 
      FROM imported_datasets 
      ORDER BY imported_at DESC 
      LIMIT 1
    `);
    
    if (datasetResult.rows.length === 0) {
      return res.json({ success: true, data: [], message: 'No data found' });
    }
    
    const datasetId = datasetResult.rows[0].id;
    
    const dataResult = await pool.query(`
      SELECT data FROM sql_imported_data 
      WHERE dataset_id = $1 
      ORDER BY id
    `, [datasetId]);
    
    const data = dataResult.rows.map(row => row.data);
    
    res.json({ success: true, data, rowCount: data.length });
  } catch (err) {
    console.error('Error getting imported data:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ============================================
// CONNECTION TEST ENDPOINTS (YOUR EXISTING CODE)
// ============================================

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

app.post('/api/test-connection', async (req, res) => {
  const { server, database, username, password, port, encrypt, trustCert } = req.body;
  
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
  
  let tempPool = null;
  try {
    tempPool = new sql.ConnectionPool(config);
    await tempPool.connect();
    
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
    
    let errorMessage = err.message;
    if (err.code === 'ENOTFOUND') {
      errorMessage = `Server '${server}' not found. Check the server name.`;
    } else if (err.code === 'ETIMEDOUT') {
      errorMessage = `Connection timeout. Make sure SQL Server Browser service is running.`;
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

app.post('/api/execute-query', async (req, res) => {
  const { server, database, username, password, port, encrypt, trustCert, query, limit = 10000 } = req.body;
  
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
    
    if (isSelect && result.recordset && result.recordset.length > 0) {
      const latestRecord = result.recordset[0];
      if (latestRecord.machine_id) {
        emitToAll('query-result', {
          data: result.recordset,
          rowCount: result.recordset.length,
          timestamp: Date.now()
        });
      }
    }
    
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
});

app.post('/api/start-realtime', async (req, res) => {
  const { connectionConfig, query, interval = 2000 } = req.body;
  
  if (!query) {
    return res.status(400).json({ success: false, error: 'Query is required' });
  }
  
  res.json({ 
    success: true, 
    message: `Real-time monitoring started. Updates every ${interval}ms`,
    streamId: Date.now()
  });
});

app.post('/api/stop-realtime', async (req, res) => {
  const { streamId } = req.body;
  res.json({ success: true, message: 'Real-time monitoring stopped' });
});

app.get('/api/realtime-status/:machineId', async (req, res) => {
  const { machineId } = req.params;
  
  try {
    const status = await redisClient.hGetAll(`machine:${machineId}`);
    if (Object.keys(status).length === 0) {
      return res.json({ success: true, data: null, message: 'No data available' });
    }
    
    res.json({ 
      success: true, 
      data: {
        machineId,
        temperature: parseFloat(status.temperature),
        pressure: parseFloat(status.pressure),
        speed: parseInt(status.speed),
        efficiency: parseFloat(status.efficiency),
        last_update: parseInt(status.last_update)
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/realtime-statuses', async (req, res) => {
  try {
    const keys = await redisClient.keys('machine:*');
    const machineIds = keys.filter(k => !k.includes(':history')).map(k => k.split(':')[1]);
    const statuses = {};
    
    for (const id of machineIds) {
      const status = await redisClient.hGetAll(`machine:${id}`);
      if (Object.keys(status).length > 0) {
        statuses[id] = {
          temperature: parseFloat(status.temperature),
          pressure: parseFloat(status.pressure),
          speed: parseInt(status.speed),
          efficiency: parseFloat(status.efficiency),
          last_update: parseInt(status.last_update)
        };
      }
    }
    
    res.json({ success: true, data: statuses });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ============================================
// HEALTH CHECK (MERGED)
// ============================================
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running', timestamp: new Date().toISOString() });
});

// ============================================
// START SERVER
// ============================================
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔌 WebSocket server ready`);
  console.log(`🔐 Auth routes: /api/auth`);
  console.log(`📦 User data routes: /api/user`);
  console.log(`🔄 Real-time polling: ${process.env.ENABLE_REAL_TIME === 'true' ? 'ENABLED' : 'DISABLED'}`);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down...');
  changeDetector.stopPolling();
  realtimeSync.stop();
  await redisClient.quit();
  process.exit(0);
});