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
    this.syncIntervalMs = 3000;
    this.tableName = 'FYP';
    this.currentDatasetId = null;
    // Track existing record IDs (for the index.js compatibility)
    this.seenRecordIds = new Set();
    this.initialImportDone = false;
  }

  updateConfig(newConfig) {
    this.sqlConfig = newConfig;
    console.log('✅ Real-time sync config updated with new credentials');
  }

  async autoStartForExistingDatasets() {
    if (!pool) {
      console.log('⏳ Waiting for database connection...');
      setTimeout(() => this.autoStartForExistingDatasets(), 2000);
      return;
    }

    try {
      const result = await pool.query(`
        SELECT id, file_name, source FROM imported_datasets 
        ORDER BY imported_at DESC 
        LIMIT 1
      `);
      
      if (result.rows.length === 0) {
        console.log('No existing datasets found. Real-time sync will start after first import.');
        return;
      }

      const datasetId = result.rows[0].id;
      const source = result.rows[0].source;

      if (source === 'sqlserver') {
        console.log(`🔄 Found existing SQL Server dataset (ID: ${datasetId}). Auto-starting real-time sync...`);
        this.currentDatasetId = datasetId;
        await this.loadExistingRecordIds();
        this.initialImportDone = true;
        
        if (!this.isRunning && this.sqlConfig && this.sqlConfig.server) {
          await this.start();
        }
      }
    } catch (err) {
      console.error('Error checking for existing datasets:', err.message);
    }
  }

  // Load all existing record IDs from the database into memory
  async loadExistingRecordIds() {
    if (!this.currentDatasetId) return;
    
    try {
      const result = await pool.query(`
        SELECT (data->>'Id')::INTEGER as id 
        FROM sql_imported_data 
        WHERE dataset_id = $1
      `, [this.currentDatasetId]);
      
      this.seenRecordIds.clear();
      for (const row of result.rows) {
        if (row.id !== null && !isNaN(row.id)) {
          this.seenRecordIds.add(row.id);
        }
      }
      console.log(`📚 Loaded ${this.seenRecordIds.size} existing record IDs into memory`);
    } catch (err) {
      console.error('Error loading existing record IDs:', err.message);
    }
  }

  async start() {
    if (this.isRunning) {
      console.log('⚠️ Real-time sync already running');
      return;
    }
    
    if (!pool) {
      console.log('⏳ Waiting for database connection...');
      setTimeout(() => this.start(), 2000);
      return;
    }
    
    if (!this.sqlConfig || !this.sqlConfig.server) {
      console.log('⚠️ No SQL Server configuration available. Waiting for import...');
      return;
    }
    
    this.isRunning = true;
    console.log(`🔄 Starting real-time sync for table: ${this.tableName}, checking every ${this.syncIntervalMs}ms`);
    
    // Run first check immediately
    setTimeout(() => this.checkForChanges(), 1000);
    
    this.interval = setInterval(() => {
      this.checkForChanges();
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

  async checkForChanges() {
    if (!this.currentDatasetId || !pool || !this.sqlConfig || !this.sqlConfig.server) {
      return;
    }
    
    let sqlPool = null;
    try {
      sqlPool = await sql.connect(this.sqlConfig);
      
      // Get ALL current records from SQL Server
      const sqlServerResult = await sqlPool.request().query(`
        SELECT * FROM ${this.tableName}
      `);
      
      const sqlServerRecords = sqlServerResult.recordset;
      
      if (sqlServerRecords.length === 0) {
        return;
      }
      
      // Create a Set of current SQL Server IDs
      const currentSqlServerIds = new Set();
      const idToRecordMap = new Map();
      
      for (const record of sqlServerRecords) {
        const recordId = record.Id;
        if (recordId !== null && !isNaN(recordId)) {
          currentSqlServerIds.add(recordId);
          idToRecordMap.set(recordId, record);
        }
      }
      
      // ========== FIND NEW RECORDS ==========
      const newRecords = [];
      for (const recordId of currentSqlServerIds) {
        if (!this.seenRecordIds.has(recordId)) {
          newRecords.push(idToRecordMap.get(recordId));
        }
      }
      
      // ========== FIND DELETED RECORDS ==========
      const deletedRecordIds = [];
      for (const seenId of this.seenRecordIds) {
        if (!currentSqlServerIds.has(seenId)) {
          deletedRecordIds.push(seenId);
        }
      }
      
      // ========== HANDLE NEW RECORDS ==========
      if (newRecords.length > 0) {
        console.log(`📡 DETECTED ${newRecords.length} NEW RECORDS! IDs: ${newRecords.map(r => r.Id).join(', ')}`);
        
        for (const record of newRecords) {
          await pool.query(
            'INSERT INTO sql_imported_data (dataset_id, data) VALUES ($1, $2)',
            [this.currentDatasetId, record]
          );
          this.seenRecordIds.add(record.Id);
        }
        
        await pool.query(
          'UPDATE imported_datasets SET row_count = row_count + $1 WHERE id = $2',
          [newRecords.length, this.currentDatasetId]
        );
        
        // Emit WebSocket event for new records
        emitToAll('realtime-data-update', {
          newRecords: newRecords,
          count: newRecords.length,
          timestamp: Date.now()
        });
        
        console.log(`✅ Saved ${newRecords.length} new records to database`);
      }
      
      // ========== HANDLE DELETED RECORDS ==========
      if (deletedRecordIds.length > 0) {
        console.log(`🗑️ DETECTED ${deletedRecordIds.length} DELETED RECORDS! IDs: ${deletedRecordIds.slice(0, 20).join(', ')}${deletedRecordIds.length > 20 ? '...' : ''}`);
        
        for (const recordId of deletedRecordIds) {
          await pool.query(`
            DELETE FROM sql_imported_data 
            WHERE dataset_id = $1 AND (data->>'Id')::INTEGER = $2
          `, [this.currentDatasetId, recordId]);
          this.seenRecordIds.delete(recordId);
        }
        
        await pool.query(
          'UPDATE imported_datasets SET row_count = row_count - $1 WHERE id = $2',
          [deletedRecordIds.length, this.currentDatasetId]
        );
        
        emitToAll('realtime-data-delete', {
          deletedIds: deletedRecordIds,
          count: deletedRecordIds.length,
          timestamp: Date.now()
        });
        
        console.log(`✅ Deleted ${deletedRecordIds.length} records from database`);
      }
      
      this.lastSyncTime = new Date();
      
    } catch (err) {
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
      
      // Insert dataset record
      const insertResult = await pool.query(
        'INSERT INTO imported_datasets (file_name, source, row_count) VALUES ($1, $2, $3) RETURNING id',
        [`sql_${this.tableName}_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}`, 'sqlserver', result.recordset.length]
      );
      
      this.currentDatasetId = insertResult.rows[0].id;
      
      // Clear existing seen IDs
      this.seenRecordIds.clear();
      
      // Insert all records
      for (const record of result.recordset) {
        await pool.query(
          'INSERT INTO sql_imported_data (dataset_id, data) VALUES ($1, $2)',
          [this.currentDatasetId, record]
        );
        if (record.Id) {
          this.seenRecordIds.add(record.Id);
        }
      }
      
      this.initialImportDone = true;
      
      console.log(`✅ Initial import complete! Imported ${result.recordset.length} records`);
      return { success: true, imported: result.recordset.length, datasetId: this.currentDatasetId };
      
    } catch (err) {
      console.error('Initial import failed:', err.message);
      return { success: false, error: err.message };
    } finally {
      if (sqlPool) await sqlPool.close();
    }
  }

  // Reset sync state (useful when switching datasets)
  async resetForNewDataset(datasetId) {
    this.currentDatasetId = datasetId;
    this.seenRecordIds.clear();
    if (datasetId) {
      await this.loadExistingRecordIds();
    }
    console.log(`🔄 Sync reset for dataset ID: ${datasetId}`);
  }
}

module.exports = RealtimeSync;