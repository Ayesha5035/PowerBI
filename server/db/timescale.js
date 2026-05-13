// server/db/timescale.js
const pool = require('./postgres');

class TimescaleDB {
    // Insert a batch of sensor readings
    async insertReadings(readings) {
        if (!readings || readings.length === 0) return;
        
        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            
            for (const reading of readings) {
                await client.query(`
                    INSERT INTO sensor_readings (
                        time, machine_id, temperature, pressure, speed, 
                        bottle_count, reject_count, efficiency
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                `, [
                    reading.time || new Date(),
                    reading.machine_id,
                    reading.temperature,
                    reading.pressure,
                    reading.speed,
                    reading.bottle_count,
                    reading.reject_count,
                    reading.efficiency
                ]);
            }
            
            await client.query('COMMIT');
        } catch (err) {
            await client.query('ROLLBACK');
            throw err;
        } finally {
            client.release();
        }
    }

    // Get readings for time range (uses time-bucket for aggregation)
    async getReadings(machineId, startTime, endTime, bucket = '1 minute') {
        const query = `
            SELECT 
                time_bucket($1, time) AS bucket,
                AVG(temperature) as avg_temperature,
                MAX(temperature) as max_temperature,
                MIN(temperature) as min_temperature,
                AVG(pressure) as avg_pressure,
                AVG(speed) as avg_speed,
                SUM(bottle_count) as total_bottles,
                SUM(reject_count) as total_rejects,
                AVG(efficiency) as avg_efficiency,
                COUNT(*) as sample_count
            FROM sensor_readings
            WHERE machine_id = $2
                AND time BETWEEN $3 AND $4
                AND is_deleted = FALSE
            GROUP BY bucket
            ORDER BY bucket ASC
        `;
        
        const result = await pool.query(query, [bucket, machineId, startTime, endTime]);
        return result.rows;
    }

    // Get hourly aggregates (from materialized view)
    async getHourlyAggregates(machineId, days = 7) {
        const query = `
            SELECT * FROM hourly_machine_metrics
            WHERE machine_id = $1
                AND hour > NOW() - INTERVAL '${days} days'
            ORDER BY hour DESC
        `;
        const result = await pool.query(query, [machineId]);
        return result.rows;
    }

    // Get daily aggregates
    async getDailyAggregates(machineId, days = 30) {
        const query = `
            SELECT * FROM daily_machine_metrics
            WHERE machine_id = $1
                AND day > NOW() - INTERVAL '${days} days'
            ORDER BY day DESC
        `;
        const result = await pool.query(query, [machineId]);
        return result.rows;
    }

    // Get latest reading for each machine
    async getLatestReadings() {
        const query = `
            SELECT DISTINCT ON (machine_id) *
            FROM sensor_readings
            WHERE is_deleted = FALSE
            ORDER BY machine_id, time DESC
        `;
        const result = await pool.query(query);
        return result.rows;
    }

    // Real-time query for dashboard (only recent data)
    async getRealtimeDashboard(machineId) {
        const query = `
            SELECT * FROM sensor_readings
            WHERE machine_id = $1
                AND time > NOW() - INTERVAL '1 hour'
                AND is_deleted = FALSE
            ORDER BY time DESC
            LIMIT 100
        `;
        const result = await pool.query(query, [machineId]);
        return result.rows;
    }
}

module.exports = new TimescaleDB();