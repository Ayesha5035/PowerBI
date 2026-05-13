// server/services/changeDetector.js
const sql = require('mssql');
const { redisClient, setMachineCurrentStatus } = require('../db/redis');

class ChangeDetector {
  constructor(sqlConfig) {
    this.sqlConfig = sqlConfig;
    this.lastSyncTime = new Date();
    this.pollingInterval = null;
    this.isPolling = false;
    this.io = null;
  }

  setSocketIO(io) {
    this.io = io;
  }

  async startPolling(intervalMs = 2000) {
    if (this.isPolling) return;
    this.isPolling = true;
    this.lastSyncTime = new Date();

    console.log(`🔄 Starting SQL Server change polling every ${intervalMs}ms`);

    this.pollingInterval = setInterval(async () => {
      try {
        await this.checkForChanges();
      } catch (err) {
        console.error('Polling error:', err);
      }
    }, intervalMs);
  }

  stopPolling() {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
      this.isPolling = false;
      console.log('⏹️ Stopped SQL Server change polling');
    }
  }

  async checkForChanges() {
    const pool = await sql.connect(this.sqlConfig);
    
    try {
      // Query for records changed since last check
      // Assumes your table has a 'last_updated' or 'timestamp' column
      const query = `
        SELECT * FROM sensor_readings 
        WHERE last_updated > @lastSyncTime
        OR created_at > @lastSyncTime
        ORDER BY last_updated DESC
      `;
      
      const result = await pool.request()
        .input('lastSyncTime', sql.DateTime, this.lastSyncTime)
        .query(query);

      if (result.recordset.length > 0) {
        console.log(`📡 Detected ${result.recordset.length} changes`);
        
        for (const record of result.recordset) {
          // Update Redis cache
          await setMachineCurrentStatus(record.machine_id, {
            temperature: record.temperature,
            pressure: record.pressure,
            speed: record.speed,
            bottle_count: record.bottle_count,
            reject_count: record.reject_count,
            efficiency: record.efficiency,
            status: record.status || 'running',
            timestamp: record.last_updated || new Date()
          });

          // Broadcast to connected clients via WebSocket
          if (this.io) {
            this.io.emit('sensor-update', {
              machineId: record.machine_id,
              data: record,
              timestamp: Date.now()
            });
          }
        }
      }
      
      // Update last sync time
      this.lastSyncTime = new Date();
      
    } catch (err) {
      console.error('Error checking changes:', err);
    } finally {
      await pool.close();
    }
  }

  // Alternative: Use SQL Server Change Tracking (more efficient)
  async setupChangeTracking() {
    const pool = await sql.connect(this.sqlConfig);
    
    try {
      // Enable change tracking on database
      await pool.request().query(`
        ALTER DATABASE CURRENT
        SET CHANGE_TRACKING = ON
        (CHANGE_RETENTION = 2 DAYS, AUTO_CLEANUP = ON)
      `);
      
      // Enable on specific table
      await pool.request().query(`
        ALTER TABLE sensor_readings
        ENABLE CHANGE_TRACKING
        WITH (TRACK_COLUMNS_UPDATED = ON)
      `);
      
      console.log('✅ SQL Server Change Tracking enabled');
    } catch (err) {
      console.log('Change Tracking may already be enabled:', err.message);
    } finally {
      await pool.close();
    }
  }

  async getChangesSince(version) {
    const pool = await sql.connect(this.sqlConfig);
    
    try {
      const result = await pool.request()
        .input('lastVersion', sql.BigInt, version)
        .query(`
          SELECT * FROM CHANGETABLE(CHANGES sensor_readings, @lastVersion) AS CT
        `);
      
      return result.recordset;
    } finally {
      await pool.close();
    }
  }
}

module.exports = ChangeDetector;