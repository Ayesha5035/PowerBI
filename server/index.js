// server/index.js
const express = require('express');
const sql = require('mssql');
const cors = require('cors');
const dotenv = require('dotenv');
const os = require('os');

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

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

// Test connection endpoint
app.post('/api/test-connection', async (req, res) => {
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
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 SQL Server API running on port ${PORT}`);
    console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
});