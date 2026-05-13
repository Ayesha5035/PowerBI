const path = require('path');
// Load .env from parent directory (project root)
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const pool = require('./db/postgres');
const timescale = require('./db/timescale');
const redis = require('./db/redis');

async function testAll() {
    try {
        console.log('Connecting with:', {
            user: process.env.DB_USER,
            database: process.env.DB_NAME,
            host: process.env.DB_HOST,
            hasPassword: !!process.env.DB_PASSWORD
        });

        // 1. Test PostgreSQL
        const result = await pool.query('SELECT NOW() as time, current_user as user');
        console.log('✅ PostgreSQL connected!');
        console.log('   Time:', result.rows[0].time);
        console.log('   User:', result.rows[0].user);

        // 2. Test TimescaleDB hypertable
        const hypertable = await pool.query(`
            SELECT * FROM timescaledb_information.hypertables 
            WHERE hypertable_name = 'sensor_readings'
        `);
        console.log('✅ TimescaleDB hypertable:', hypertable.rows[0]?.hypertable_name || 'Not found');

        // 3. Check sample data
        const machines = await pool.query('SELECT * FROM machines');
        console.log('✅ Machines:', machines.rows.length, 'found');
        
        const readings = await pool.query('SELECT COUNT(*) FROM sensor_readings');
        console.log('✅ Sensor readings:', readings.rows[0].count, 'records');

        // 4. Test Redis
        await redis.setMachineCurrentStatus('TEST', { temperature: 75.2, status: 'test' });
        const status = await redis.getMachineCurrentStatus('TEST');
        console.log('✅ Redis cache:', status);

        console.log('\n🎉 All database connections successful!');
    } catch (err) {
        console.error('❌ Test failed:', err.message);
    } finally {
        await pool.end();
        await redis.redisClient.quit();
    }
}

testAll();