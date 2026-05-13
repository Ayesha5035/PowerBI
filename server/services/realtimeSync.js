// server/services/realtimeSync.js
const sql = require('mssql');
const { pool } = require('../db/postgres');
const { emitToAll } = require('./websocket');

class RealtimeSync {
  constructor(sqlConfig) {
    this.sqlConfig = sqlConfig;
    this.isRunning = false;
    this.interval = null;
    this.lastSyncTime = new Date();
    this.syncIntervalMs = 5000;
    this.tableName = 'FYP';
    this.currentDatasetId = null;
  }

  // Method to update SQL config dynamically
  updateConfig(newConfig) {
    this.sqlConfig = newConfig;
    console.log('✅ Real-time sync config updated with new credentials');
  }

  async start() {
    if (this.isRunning) return;
    
    if (!pool) {
      console.log('⏳ Waiting for database connection...');
      setTimeout(() => this.start(), 2000);
      return;
    }
    
    // Don't start if no valid SQL config
    if (!this.sqlConfig || !this.sqlConfig.server) {
      console.log('⚠️ No SQL Server configuration available. Waiting for import...');
      return;
    }
    
    this.isRunning = true;
    console.log(`🔄 Starting real-time sync for table: ${this.tableName}`);
    
    try {
      const result = await pool.query(`
        SELECT id FROM imported_datasets ORDER BY imported_at DESC LIMIT 1
      `);
      if (result.rows.length > 0) {
        this.currentDatasetId = result.rows[0].id;
        console.log(`📊 Found existing dataset ID: ${this.currentDatasetId}`);
      } else {
        console.log('No existing dataset found, will wait for import');
        this.isRunning = false;
        return;
      }
    } catch (err) {
      console.log('Error checking for existing dataset:', err.message);
      this.isRunning = false;
      return;
    }
    
    this.interval = setInterval(() => {
      this.checkForNewData();
    }, this.syncIntervalMs);
  }

  stop() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
      this.isRunning = false;
      console.log('⏹️ Stopped real-time sync');
    }
  }

  async checkForNewData() {
    if (!this.currentDatasetId || !pool || !this.sqlConfig || !this.sqlConfig.server) {
      return;
    }
    
    let sqlPool = null;
    try {
      sqlPool = await sql.connect(this.sqlConfig);
      
      const maxIdResult = await pool.query(`
        SELECT COALESCE(MAX((data->>'Id')::INTEGER), 0) as max_id 
        FROM sql_imported_data 
        WHERE dataset_id = $1
      `, [this.currentDatasetId]);
      
      const currentMaxId = maxIdResult.rows[0].max_id;
      
      const result = await sqlPool.request().query(`
        SELECT * FROM ${this.tableName} 
        WHERE Id > ${currentMaxId}
        ORDER BY Id ASC
      `);
      
      if (result.recordset.length > 0) {
        console.log(`📡 Detected ${result.recordset.length} new records in SQL Server (IDs: ${result.recordset.map(r => r.Id).join(', ')})`);
        
        for (const record of result.recordset) {
          await pool.query(
            'INSERT INTO sql_imported_data (dataset_id, data) VALUES ($1, $2)',
            [this.currentDatasetId, record]
          );
        }
        
        await pool.query(
          'UPDATE imported_datasets SET row_count = row_count + $1 WHERE id = $2',
          [result.recordset.length, this.currentDatasetId]
        );
        
        emitToAll('realtime-data-update', {
          newRecords: result.recordset,
          count: result.recordset.length,
          timestamp: Date.now()
        });
        
        console.log(`✅ Saved ${result.recordset.length} new records to database`);
      }
      
    } catch (err) {
      // Don't log if just no connection yet
      if (!err.message.includes('Failed to connect') && !err.message.includes('Login failed')) {
        console.error('Sync error:', err.message);
      }
    } finally {
      if (sqlPool) await sqlPool.close();
    }
  }

  async initialImport() {
    let sqlPool = null;
    try {
      if (!this.sqlConfig || !this.sqlConfig.server) {
        throw new Error('No SQL Server configuration available');
      }
      
      console.log('📥 Starting initial import from SQL Server...');
      sqlPool = await sql.connect(this.sqlConfig);
      
      const result = await sqlPool.request().query(`SELECT * FROM ${this.tableName} ORDER BY Id`);
      
      if (result.recordset.length === 0) {
        console.log('No data found in SQL Server table');
        return { success: true, imported: 0 };
      }
      
      const insertResult = await pool.query(
        'INSERT INTO imported_datasets (file_name, source, row_count) VALUES ($1, $2, $3) RETURNING id',
        [`sql_${this.tableName}`, 'sqlserver', result.recordset.length]
      );
      
      this.currentDatasetId = insertResult.rows[0].id;
      
      for (const record of result.recordset) {
        await pool.query(
          'INSERT INTO sql_imported_data (dataset_id, data) VALUES ($1, $2)',
          [this.currentDatasetId, record]
        );
      }
      
      console.log(`✅ Initial import complete! Imported ${result.recordset.length} records`);
      return { success: true, imported: result.recordset.length };
      
    } catch (err) {
      console.error('Initial import failed:', err.message);
      return { success: false, error: err.message };
    } finally {
      if (sqlPool) await sqlPool.close();
    }
  }
}

module.exports = RealtimeSync;