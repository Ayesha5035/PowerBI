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
  }

  updateConfig(newConfig) {
    this.sqlConfig = newConfig;
    console.log('✅ Real-time sync config updated with new credentials');
  }

  // NEW: Auto-start for existing datasets on server startup
  async autoStartForExistingDatasets() {
    if (!pool) {
      console.log('⏳ Waiting for database connection...');
      setTimeout(() => this.autoStartForExistingDatasets(), 2000);
      return;
    }

    try {
      // Get the most recent dataset
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

      // Only auto-start for SQL Server datasets (not Excel/CSV)
      if (source === 'sqlserver') {
        console.log(`🔄 Found existing SQL Server dataset (ID: ${datasetId}). Auto-starting real-time sync...`);
        
        // Note: We don't have the SQL Server credentials stored persistently
        // We'll need to either:
        // 1. Store encrypted credentials (more complex)
        // 2. Only auto-start if credentials were saved (requires user to re-connect once after server restart)
        
        // For now, we'll notify that manual reconnection is needed
        console.log('⚠️ SQL Server credentials are not persisted. Please re-import or re-connect for real-time sync to resume.');
      } else {
        console.log(`Dataset ${datasetId} is from ${source}. Real-time sync not applicable.`);
      }
    } catch (err) {
      console.error('Error checking for existing datasets:', err.message);
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
    
    try {
      const result = await pool.query(`
        SELECT id FROM imported_datasets ORDER BY imported_at DESC LIMIT 1
      `);
      if (result.rows.length === 0) {
        console.log('No existing dataset found, will wait for import');
        return;
      }
      this.currentDatasetId = result.rows[0].id;
      console.log(`📊 Found existing dataset ID: ${this.currentDatasetId}`);
    } catch (err) {
      console.log('Error checking for existing dataset:', err.message);
      return;
    }
    
    this.isRunning = true;
    console.log(`🔄 Starting real-time sync for table: ${this.tableName}, checking every ${this.syncIntervalMs}ms`);
    
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
      
      // Get current max ID from PostgreSQL
      const maxIdResult = await pool.query(`
        SELECT COALESCE(MAX((data->>'Id')::INTEGER), 0) as max_id 
        FROM sql_imported_data 
        WHERE dataset_id = $1
      `, [this.currentDatasetId]);
      
      const currentMaxId = maxIdResult.rows[0].max_id;
      
      // Check for new records
      const newRecords = await sqlPool.request().query(`
        SELECT * FROM ${this.tableName} 
        WHERE Id > ${currentMaxId}
        ORDER BY Id ASC
      `);
      
      if (newRecords.recordset.length > 0) {
        console.log(`📡 DETECTED ${newRecords.recordset.length} NEW RECORDS! IDs: ${newRecords.recordset.map(r => r.Id).join(', ')}`);
        
        for (const record of newRecords.recordset) {
          await pool.query(
            'INSERT INTO sql_imported_data (dataset_id, data) VALUES ($1, $2)',
            [this.currentDatasetId, record]
          );
        }
        
        await pool.query(
          'UPDATE imported_datasets SET row_count = row_count + $1 WHERE id = $2',
          [newRecords.recordset.length, this.currentDatasetId]
        );
        
        emitToAll('realtime-data-update', {
          newRecords: newRecords.recordset,
          count: newRecords.recordset.length,
          timestamp: Date.now()
        });
        
        console.log(`✅ Saved ${newRecords.recordset.length} new records to database`);
      }
      
      // Check for deleted records
      const existingIdsResult = await pool.query(`
        SELECT (data->>'Id')::INTEGER as id 
        FROM sql_imported_data 
        WHERE dataset_id = $1
      `, [this.currentDatasetId]);
      
      const existingIds = existingIdsResult.rows.map(r => r.id);
      
      if (existingIds.length > 0) {
        const sqlServerIdsResult = await sqlPool.request().query(`
          SELECT Id FROM ${this.tableName}
        `);
        
        const sqlServerIds = new Set(sqlServerIdsResult.recordset.map(r => r.Id));
        const deletedIds = existingIds.filter(id => !sqlServerIds.has(id));
        
        if (deletedIds.length > 0) {
          console.log(`🗑️ DETECTED ${deletedIds.length} DELETED RECORDS! IDs: ${deletedIds.join(', ')}`);
          
          await pool.query(`
            DELETE FROM sql_imported_data 
            WHERE dataset_id = $1 AND (data->>'Id')::INTEGER = ANY($2)
          `, [this.currentDatasetId, deletedIds]);
          
          await pool.query(
            'UPDATE imported_datasets SET row_count = row_count - $1 WHERE id = $2',
            [deletedIds.length, this.currentDatasetId]
          );
          
          emitToAll('realtime-data-delete', {
            deletedIds: deletedIds,
            count: deletedIds.length,
            timestamp: Date.now()
          });
          
          console.log(`✅ Deleted ${deletedIds.length} records from database`);
        }
      }
      
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